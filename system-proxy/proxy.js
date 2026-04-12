#!/usr/bin/env node
/**
 * Gridge System HTTPS Proxy
 *
 * 모든 AI 앱(Claude Desktop, ChatGPT Desktop, 브라우저 등)의
 * HTTPS 트래픽을 투명하게 인터셉트하여 회사 계정 트래픽만 캡처합니다.
 *
 * 동작:
 * 1. HTTP CONNECT 프록시로 동작 (시스템 프록시로 설정)
 * 2. AI 서비스 도메인만 MITM (나머지는 투명 터널링)
 * 3. 회사 API Key / 세션만 캡처 (개인 계정은 패스)
 * 4. 캡처된 로그를 Gridge 서버로 전송
 *
 * 대상 도메인:
 *   api.anthropic.com (Claude API)
 *   api.openai.com (OpenAI API)
 *   claude.ai (Claude 웹)
 *   chatgpt.com (ChatGPT 웹)
 */

const http = require("http");
const https = require("https");
const tls = require("tls");
const net = require("net");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ── 설정 ──
const CONFIG = loadConfig();

function loadConfig() {
  const configPath = path.join(__dirname, "config.json");
  const defaults = {
    port: 9090,
    serverUrl: "",
    apiKey: "",
    userId: "",
    // 인터셉트 대상 도메인
    interceptDomains: [
      "api.anthropic.com",
      "api.openai.com",
      "claude.ai",
      "chatgpt.com",
      "chat.openai.com",
    ],
    // 회사 API Key 화이트리스트 (이 키들만 캡처)
    companyApiKeys: [],
    // 회사 세션 토큰 패턴 (이 패턴에 매칭되는 세션만 캡처)
    companySessionPatterns: [],
    // 캡처 모드: "company_only" | "all"
    captureMode: "company_only",
  };

  if (fs.existsSync(configPath)) {
    try {
      return { ...defaults, ...JSON.parse(fs.readFileSync(configPath, "utf-8")) };
    } catch { /* use defaults */ }
  }
  return defaults;
}

// ── CA 인증서 로드 ──
const CERTS_DIR = path.join(__dirname, "certs");
const CA_KEY_PATH = path.join(CERTS_DIR, "gridge-ca.key");
const CA_CERT_PATH = path.join(CERTS_DIR, "gridge-ca.crt");

let caKey, caCert;
try {
  caKey = fs.readFileSync(CA_KEY_PATH);
  caCert = fs.readFileSync(CA_CERT_PATH);
} catch {
  console.error("[Gridge] CA 인증서가 없습니다. 먼저 실행:");
  console.error("  node gen-cert.js && node install-cert.js");
  process.exit(1);
}

// ── 도메인별 임시 인증서 캐시 ──
const certCache = new Map();

function generateCertForHost(hostname) {
  if (certCache.has(hostname)) return certCache.get(hostname);

  // 도메인별 서버 인증서 동적 생성 (CA로 서명)
  const keyPair = execSync("openssl genrsa 2048 2>/dev/null").toString();
  const csr = execSync(
    `openssl req -new -key /dev/stdin -subj "/CN=${hostname}" 2>/dev/null`,
    { input: keyPair }
  ).toString();

  // SAN (Subject Alternative Name) 포함 인증서 생성
  const extFile = `/tmp/gridge_ext_${Date.now()}.cnf`;
  fs.writeFileSync(extFile, `subjectAltName=DNS:${hostname},DNS:*.${hostname}`);

  const cert = execSync(
    `openssl x509 -req -CA "${CA_CERT_PATH}" -CAkey "${CA_KEY_PATH}" ` +
    `-CAcreateserial -days 365 -sha256 -extfile "${extFile}" 2>/dev/null`,
    { input: csr }
  ).toString();

  try { fs.unlinkSync(extFile); } catch { /* ignore */ }

  const result = { key: keyPair, cert };
  certCache.set(hostname, result);
  return result;
}

// ── 회사 계정 판별 ──
function isCompanyTraffic(headers, body) {
  if (CONFIG.captureMode === "all") return true;

  // API Key 체크 (Claude API: x-api-key, OpenAI API: Authorization)
  const anthropicKey = headers["x-api-key"] || "";
  const authHeader = headers["authorization"] || "";
  const openaiKey = authHeader.replace("Bearer ", "");

  if (CONFIG.companyApiKeys.length > 0) {
    if (CONFIG.companyApiKeys.includes(anthropicKey)) return true;
    if (CONFIG.companyApiKeys.includes(openaiKey)) return true;
  }

  // 세션 토큰 체크 (웹 앱)
  const cookie = headers["cookie"] || "";
  if (CONFIG.companySessionPatterns.length > 0) {
    for (const pattern of CONFIG.companySessionPatterns) {
      if (cookie.includes(pattern)) return true;
    }
  }

  // 화이트리스트가 비어있으면 → 모든 트래픽 캡처 (기본)
  if (CONFIG.companyApiKeys.length === 0 && CONFIG.companySessionPatterns.length === 0) {
    return true;
  }

  return false;
}

// ── 로그 수집 ──
const LOG_QUEUE = [];

function captureApiLog(hostname, reqHeaders, reqBody, resBody, startTime) {
  try {
    let prompt = "";
    let response = "";
    let model = "";
    let inputTokens = 0;
    let outputTokens = 0;
    let channel = "anthropic";

    if (hostname.includes("openai")) channel = "openai";

    // 요청 파싱
    if (reqBody) {
      try {
        const parsed = JSON.parse(reqBody);
        model = parsed.model || "";
        if (parsed.messages) {
          const userMsgs = parsed.messages.filter(m => m.role === "user");
          const last = userMsgs[userMsgs.length - 1];
          if (typeof last?.content === "string") prompt = last.content;
          else if (Array.isArray(last?.content)) {
            prompt = last.content.filter(c => c.type === "text").map(c => c.text).join("\n");
          }
        }
        if (parsed.prompt) prompt = parsed.prompt;
      } catch { /* non-JSON */ }
    }

    // 응답 파싱
    if (resBody) {
      // SSE 스트리밍
      if (resBody.includes("data: ")) {
        for (const line of resBody.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const p = JSON.parse(data);
            if (p.model) model = p.model;
            // Claude format
            if (p.type === "content_block_delta" && p.delta?.text) response += p.delta.text;
            if (p.completion) response += p.completion;
            // OpenAI format
            if (p.choices?.[0]?.delta?.content) response += p.choices[0].delta.content;
            // Usage
            if (p.usage) {
              inputTokens = p.usage.input_tokens || p.usage.prompt_tokens || inputTokens;
              outputTokens = p.usage.output_tokens || p.usage.completion_tokens || outputTokens;
            }
            if (p.type === "message_delta" && p.usage) {
              outputTokens = p.usage.output_tokens || outputTokens;
            }
          } catch { /* skip */ }
        }
      } else {
        // JSON 응답
        try {
          const p = JSON.parse(resBody);
          if (p.model) model = p.model;
          if (p.content) response = p.content.filter(c => c.type === "text").map(c => c.text).join("");
          if (p.choices) response = p.choices.map(c => c.message?.content || c.text || "").join("");
          if (p.usage) {
            inputTokens = p.usage.input_tokens || p.usage.prompt_tokens || 0;
            outputTokens = p.usage.output_tokens || p.usage.completion_tokens || 0;
          }
        } catch { /* skip */ }
      }
    }

    if (!prompt && !response) return;

    LOG_QUEUE.push({
      user_id: CONFIG.userId,
      channel,
      model: model || "unknown",
      prompt: prompt || "(캡처 실패)",
      response: response || "(캡처 실패)",
      input_tokens: inputTokens || Math.ceil((prompt || "").length / 4),
      output_tokens: outputTokens || Math.ceil((response || "").length / 4),
      cost_usd: 0,
      latency_ms: Date.now() - startTime,
      mode: "chat",
    });

    console.log(`  [캡처] ${channel} | ${model} | ${inputTokens}+${outputTokens} 토큰`);
  } catch (err) {
    console.error("  [캡처 오류]", err.message);
  }
}

// 로그 전송
const { encryptPayload } = require("../lib/crypto.js");

async function flushLogs() {
  if (LOG_QUEUE.length === 0 || !CONFIG.serverUrl || !CONFIG.apiKey) return;
  const logs = LOG_QUEUE.splice(0, 20);
  try {
    const rawPayload = { logs, api_key: CONFIG.apiKey };
    const { encrypted, payload } = await encryptPayload(rawPayload, CONFIG.serverUrl);
    const url = new URL("/api/logs/ingest", CONFIG.serverUrl);
    const body = JSON.stringify(encrypted ? { encrypted: true, ...payload } : payload);
    const proto = url.protocol === "https:" ? https : http;
    await new Promise((resolve, reject) => {
      const req = proto.request(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      }, res => { res.resume(); res.on("end", resolve); });
      req.on("error", e => { LOG_QUEUE.unshift(...logs); reject(e); });
      req.write(body);
      req.end();
    });
    console.log(`[Gridge] ${logs.length}건 전송 (암호화: ${encrypted ? "ON" : "OFF"})`);
  } catch { /* retry next */ }
}
setInterval(flushLogs, 10_000);

// ── HTTPS CONNECT 프록시 ──
const server = http.createServer((req, res) => {
  // 일반 HTTP 요청은 거부
  res.writeHead(400);
  res.end("This is an HTTPS proxy. Configure as system proxy.");
});

server.on("connect", (req, clientSocket, head) => {
  const [hostname, port] = req.url.split(":");
  const targetPort = parseInt(port) || 443;
  const shouldIntercept = CONFIG.interceptDomains.some(d => hostname.includes(d));

  if (!shouldIntercept) {
    // AI 서비스가 아닌 도메인 → 투명 터널링 (인터셉트 안 함)
    const serverSocket = net.connect(targetPort, hostname, () => {
      clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
      serverSocket.write(head);
      serverSocket.pipe(clientSocket);
      clientSocket.pipe(serverSocket);
    });
    serverSocket.on("error", () => clientSocket.destroy());
    clientSocket.on("error", () => serverSocket.destroy());
    return;
  }

  // AI 서비스 도메인 → MITM (중간자)
  console.log(`[MITM] ${hostname}:${targetPort}`);

  try {
    const hostCert = generateCertForHost(hostname);

    const mitmServer = new tls.TLSSocket(clientSocket, {
      isServer: true,
      key: hostCert.key,
      cert: hostCert.cert,
    });

    // CONNECT 성공 응답
    clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");

    // 클라이언트 요청 수집
    let requestData = Buffer.from(head);

    mitmServer.on("data", (chunk) => {
      requestData = Buffer.concat([requestData, chunk]);

      // HTTP 요청 완성 감지 (간이 파서)
      const dataStr = requestData.toString();
      const headerEnd = dataStr.indexOf("\r\n\r\n");
      if (headerEnd === -1) return;

      const headerStr = dataStr.slice(0, headerEnd);
      const headers = parseHeaders(headerStr);

      // Request Smuggling 방어
      if (headers["transfer-encoding"]) {
        console.error("[보안] Transfer-Encoding 요청 차단 (Request Smuggling 방지)");
        mitmServer.end();
        return;
      }
      const clHeader = headers["content-length"];
      const contentLength = clHeader ? parseInt(clHeader, 10) : 0;
      if (isNaN(contentLength) || contentLength < 0) {
        console.error("[보안] 비정상 Content-Length 차단:", clHeader);
        mitmServer.end();
        return;
      }
      const bodyStart = headerEnd + 4;
      const bodyEnd = bodyStart + contentLength;

      if (requestData.length < bodyEnd) return; // 아직 본문 수신 중

      const reqBody = requestData.slice(bodyStart, bodyEnd).toString();
      const startTime = Date.now();

      // 회사 계정 트래픽인지 확인
      const isCompany = isCompanyTraffic(headers, reqBody);

      // 실제 서버로 전달
      const options = {
        hostname,
        port: targetPort,
        method: headers["__method"] || "POST",
        path: headers["__path"] || "/",
        headers: { ...headers },
      };
      delete options.headers["__method"];
      delete options.headers["__path"];

      const proxyReq = https.request(options, (proxyRes) => {
        // 응답 헤더 → 클라이언트
        let resHeader = `HTTP/1.1 ${proxyRes.statusCode} ${proxyRes.statusMessage}\r\n`;
        for (const [k, v] of Object.entries(proxyRes.headers)) {
          if (Array.isArray(v)) v.forEach(val => resHeader += `${k}: ${val}\r\n`);
          else resHeader += `${k}: ${v}\r\n`;
        }
        resHeader += "\r\n";
        mitmServer.write(resHeader);

        // 응답 본문 수집 + 클라이언트 전달
        const resChunks = [];
        proxyRes.on("data", (chunk) => {
          resChunks.push(chunk);
          mitmServer.write(chunk);
        });

        proxyRes.on("end", () => {
          mitmServer.end();

          // 회사 트래픽만 캡처
          if (isCompany && (headers["__path"] || "").includes("/messages") ||
              (headers["__path"] || "").includes("/chat/completions")) {
            const resBody = Buffer.concat(resChunks).toString();
            captureApiLog(hostname, headers, reqBody, resBody, startTime);
          } else if (!isCompany) {
            console.log(`  [패스] 개인 계정 트래픽 — 캡처하지 않음`);
          }
        });
      });

      proxyReq.on("error", (e) => {
        console.error(`  [프록시 오류] ${hostname}:`, e.message);
        mitmServer.end();
      });

      if (reqBody) proxyReq.write(reqBody);
      proxyReq.end();

      // 다음 요청을 위해 버퍼 리셋
      requestData = requestData.slice(bodyEnd);
    });

    mitmServer.on("error", () => { /* TLS 핸드셰이크 실패 등 무시 */ });

  } catch (err) {
    console.error(`[MITM 오류] ${hostname}:`, err.message);
    clientSocket.destroy();
  }
});

function parseHeaders(headerStr) {
  const lines = headerStr.split("\r\n");
  const [method, pathStr] = (lines[0] || "").split(" ");
  const headers = { "__method": method, "__path": pathStr };
  for (let i = 1; i < lines.length; i++) {
    const idx = lines[i].indexOf(":");
    if (idx > 0) {
      const key = lines[i].slice(0, idx).trim().toLowerCase();
      const val = lines[i].slice(idx + 1).trim();
      headers[key] = val;
    }
  }
  return headers;
}

// ── 시작 ──
server.listen(CONFIG.port, () => {
  const bypass = CONFIG.captureMode === "company_only" ? "개인 계정 패스" : "전체 캡처";
  console.log("");
  console.log("  ╔══════════════════════════════════════════════╗");
  console.log("  ║     Gridge System HTTPS Proxy                ║");
  console.log(`  ║  http://localhost:${CONFIG.port}                        ║`);
  console.log("  ╠══════════════════════════════════════════════╣");
  console.log(`  ║  모드: ${bypass.padEnd(37)}║`);
  console.log(`  ║  유저: ${(CONFIG.userId || "미설정").padEnd(37)}║`);
  console.log("  ║                                              ║");
  console.log("  ║  인터셉트 대상:                              ║");
  CONFIG.interceptDomains.forEach(d => {
    console.log(`  ║    • ${d.padEnd(40)}║`);
  });
  console.log("  ║                                              ║");
  if (CONFIG.companyApiKeys.length > 0) {
    console.log(`  ║  회사 API Key: ${CONFIG.companyApiKeys.length}개 등록                   ║`);
  }
  console.log("  ╚══════════════════════════════════════════════╝");
  console.log("");
  console.log("  시스템 프록시 설정:");
  console.log(`    macOS:  네트워크 설정 → 프록시 → HTTPS → localhost:${CONFIG.port}`);
  console.log(`    Linux:  export https_proxy=http://localhost:${CONFIG.port}`);
  console.log(`    Windows: 설정 → 프록시 → 수동 → localhost:${CONFIG.port}`);
  console.log("");
});
