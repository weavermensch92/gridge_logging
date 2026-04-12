#!/usr/bin/env node
/**
 * Gridge Local Proxy — Claude Code / Cursor API 인터셉터
 *
 * 동작:
 * 1. localhost:8080에서 HTTP 프록시 실행
 * 2. Claude Code/Cursor의 API 요청을 가로채서 실제 API로 전달
 * 3. 요청/응답 사본을 Gridge 서버로 비동기 전송
 * 4. 에이전트 세션 자동 감지 (연속 호출 → session 그룹핑)
 *
 * 사용법:
 *   node proxy.js
 *   또는 config.json이 같은 디렉토리에 있으면 자동 로드
 *
 * 환경변수 (config.json 없을 때):
 *   GRIDGE_SERVER=https://gridge.company.com
 *   GRIDGE_API_KEY=ext_xxxxx
 *   GRIDGE_USER_ID=u-001
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

// ── 설정 로드 ──
let CONFIG = {
  serverUrl: process.env.GRIDGE_SERVER || "",
  apiKey: process.env.GRIDGE_API_KEY || "",
  userId: process.env.GRIDGE_USER_ID || "",
  userEmail: process.env.GRIDGE_USER_EMAIL || "",
  port: parseInt(process.env.GRIDGE_PROXY_PORT || "8080"),
};

const configPath = path.join(__dirname, "config.json");
if (fs.existsSync(configPath)) {
  try {
    const fileConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    CONFIG = { ...CONFIG, ...fileConfig };
    console.log(`[Gridge Proxy] config.json 로드: ${CONFIG.userId}`);
  } catch { /* ignore */ }
}

// ── 에이전트 세션 추적 ──
const SESSION_TIMEOUT_MS = 15_000; // 15초 이내 연속 호출 → 같은 세션
let currentSession = null;
let sessionTimer = null;

function getOrCreateSession() {
  if (currentSession && sessionTimer) {
    clearTimeout(sessionTimer);
  } else {
    currentSession = {
      sessionId: `ses-${Date.now()}`,
      startTime: Date.now(),
      calls: [],
    };
  }
  sessionTimer = setTimeout(flushSession, SESSION_TIMEOUT_MS);
  return currentSession;
}

function flushSession() {
  if (!currentSession || currentSession.calls.length === 0) {
    currentSession = null;
    return;
  }

  const session = currentSession;
  currentSession = null;
  sessionTimer = null;

  if (session.calls.length === 1) {
    // 단일 호출 → chat 모드
    const call = session.calls[0];
    sendLog(call.prompt, call.response, call.model, call.inputTokens, call.outputTokens, call.latency, "chat", null);
  } else {
    // 복수 호출 → agent 모드
    const agentDetail = buildAgentDetail(session);
    const firstCall = session.calls[0];
    const allPrompts = session.calls.map(c => c.prompt).filter(Boolean).join("\n---\n");
    const lastResponse = session.calls[session.calls.length - 1].response;
    const totalInput = session.calls.reduce((s, c) => s + c.inputTokens, 0);
    const totalOutput = session.calls.reduce((s, c) => s + c.outputTokens, 0);
    const totalLatency = Date.now() - session.startTime;
    sendLog(allPrompts, lastResponse, firstCall.model, totalInput, totalOutput, totalLatency, "agent", agentDetail);
  }
}

function buildAgentDetail(session) {
  const steps = session.calls.map((call, i) => {
    let phase = "execute";
    if (i === 0) phase = "plan";
    if (call.hasToolResult && call.isError) phase = "iterate";
    if (call.prompt && /테스트|확인|verify|test|check/i.test(call.prompt)) phase = "verify";

    return {
      step: i + 1,
      phase,
      description: call.description || `Step ${i + 1}`,
      tool_calls: (call.toolUses || []).map(t => ({
        id: t.id || `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: mapToolType(t.name),
        input: typeof t.input === "string" ? t.input : JSON.stringify(t.input).slice(0, 200),
        output_summary: t.output?.slice(0, 200) || "",
        timestamp: new Date().toISOString(),
        duration_ms: 0,
      })),
      timestamp: call.timestamp,
    };
  });

  return {
    session_id: session.sessionId,
    session_duration_ms: Date.now() - session.startTime,
    total_steps: steps.length,
    total_tool_calls: steps.reduce((s, st) => s + st.tool_calls.length, 0),
    files_changed: [],
    steps,
    code_artifacts: [],
    summary: `${steps.length}단계 에이전트 세션`,
  };
}

function mapToolType(name) {
  const map = { bash: "bash", read: "file_read", write: "file_write", edit: "edit", glob: "glob", grep: "grep", web_search: "web_search" };
  for (const [key, val] of Object.entries(map)) {
    if (name && name.toLowerCase().includes(key)) return val;
  }
  return "file_read";
}

// ── 로컬 로그 파일 ──
const LOGS_DIR = path.join(path.dirname(__dirname), "logs");
const LOGS_FILE = path.join(LOGS_DIR, "captures.jsonl");
try { fs.mkdirSync(LOGS_DIR, { recursive: true }); } catch {}

function writeLocalLog(entry) {
  const record = { ...entry, timestamp: new Date().toISOString(), sent_to_server: false };
  try { fs.appendFileSync(LOGS_FILE, JSON.stringify(record) + "\n"); } catch {}
}

function markLogsSent(count) {
  // Best-effort: mark recent entries as sent
  try {
    const lines = fs.readFileSync(LOGS_FILE, "utf8").trim().split("\n").filter(Boolean);
    const updated = lines.map((line, i) => {
      if (i >= lines.length - count) {
        try { const obj = JSON.parse(line); obj.sent_to_server = true; return JSON.stringify(obj); } catch { return line; }
      }
      return line;
    });
    fs.writeFileSync(LOGS_FILE, updated.join("\n") + "\n");
  } catch {}
}

// ── 로그 전송 ──
const LOG_QUEUE = [];
const FLUSH_INTERVAL = 10_000;

function sendLog(prompt, response, model, inputTokens, outputTokens, latency, mode, agentDetail) {
  const entry = {
    user_id: CONFIG.userId,
    channel: "anthropic",
    model: model || "claude-sonnet-4",
    prompt: prompt || "",
    response: response || "",
    input_tokens: inputTokens || 0,
    output_tokens: outputTokens || 0,
    cost_usd: calculateCost(model, inputTokens, outputTokens),
    latency_ms: latency || 0,
    mode,
    agent_detail: agentDetail || undefined,
  };
  LOG_QUEUE.push(entry);
  
  // Only write local log if it matches userEmail (basic privacy filter)
  // For proxy, account_id might be missing unless injected by extension
  if (!CONFIG.userEmail || !agentDetail?.account_id || agentDetail.account_id.toLowerCase() === CONFIG.userEmail.toLowerCase()) {
    writeLocalLog(entry);
  }
}

function calculateCost(model, input, output) {
  const prices = {
    "claude-sonnet-4": { i: 0.003, o: 0.015 },
    "claude-opus-4": { i: 0.015, o: 0.075 },
    "claude-haiku-4": { i: 0.0008, o: 0.004 },
  };
  const m = model || "";
  for (const [key, p] of Object.entries(prices)) {
    if (m.includes(key.replace("claude-", ""))) {
      return (input / 1000) * p.i + (output / 1000) * p.o;
    }
  }
  return (input / 1000) * 0.003 + (output / 1000) * 0.015;
}

const { encryptPayload } = require("../lib/crypto.js");

async function flushQueue() {
  if (LOG_QUEUE.length === 0 || !CONFIG.serverUrl || !CONFIG.apiKey) return;

  const logs = LOG_QUEUE.splice(0, 20);
  try {
    const rawPayload = { logs, api_key: CONFIG.apiKey };

    // 암호화 (서버 공개키가 있으면 암호화, 없으면 평문)
    const { encrypted, payload } = await encryptPayload(rawPayload, CONFIG.serverUrl);
    const url = new URL("/api/logs/ingest", CONFIG.serverUrl);
    const body = JSON.stringify(encrypted ? { encrypted: true, ...payload } : payload);
    const proto = url.protocol === "https:" ? https : http;

    await new Promise((resolve, reject) => {
      const req = proto.request(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      }, (res) => {
        let data = "";
        res.on("data", d => data += d);
        res.on("end", () => {
          console.log(`[Gridge Proxy] ${logs.length}건 전송 완료 (암호화: ${encrypted ? "ON" : "OFF"})`);
          markLogsSent(logs.length);
          resolve();
        });
      });
      req.on("error", (e) => {
        console.error(`[Gridge Proxy] 전송 실패:`, e.message);
        LOG_QUEUE.unshift(...logs);
        reject(e);
      });
      req.write(body);
      req.end();
    });
  } catch { /* retry on next flush */ }
}

setInterval(flushQueue, FLUSH_INTERVAL);

// ── 프록시 서버 ──
const ANTHROPIC_HOST = "api.anthropic.com";
const OPENAI_HOST = "api.openai.com";

const server = http.createServer(async (req, res) => {
  // CORS 처리
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // 1. 익스텐션에서 온 로그 수집 API
  if (req.url === "/api/logs/ingest" && req.method === "POST") {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const logs = data.logs || [data];
        logs.forEach(log => {
          LOG_QUEUE.push(log);
          writeLocalLog(log);
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", count: logs.length }));
      } catch (e) {
        res.writeHead(400);
        res.end("Invalid JSON");
      }
    });
    return;
  }

  // 2. 일반 프록시 처리 (Claude/OpenAI)
  const chunks = [];
  req.on("data", c => chunks.push(c));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    const startTime = Date.now();

    // 호스트 결정
    let targetHost = ANTHROPIC_HOST;
    let isAnthropic = true;
    
    if (req.url.includes("openai") || req.url.includes("chat/completions")) {
      targetHost = OPENAI_HOST;
      isAnthropic = false;
    }

    const options = {
      hostname: targetHost,
      port: 443,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: targetHost },
    };
    
    // Authorization 헤더가 있으면 그대로 전달
    const proxyReq = https.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);

      const responseChunks = [];
      proxyRes.on("data", (chunk) => {
        responseChunks.push(chunk);
        res.write(chunk);
      });

      proxyRes.on("end", () => {
        res.end();

        // 로그 캡처
        const isTarget = req.url.includes("/messages") || req.url.includes("/chat/completions");
        if (isTarget && req.method === "POST") {
          try {
            captureLog(body, Buffer.concat(responseChunks), startTime, proxyRes.headers["content-type"] || "", isAnthropic);
          } catch (e) {
            console.error("[Gridge Proxy] 캡처 오류:", e.message);
          }
        }
      });
    });

    proxyReq.on("error", (e) => {
      console.error("[Gridge Proxy] 프록시 오류:", e.message);
      res.writeHead(502);
      res.end("Proxy Error");
    });

    proxyReq.write(body);
    proxyReq.end();
  });
});

function captureLog(reqBuffer, resBuffer, startTime, contentType, isAnthropic) {
  const reqBody = JSON.parse(reqBuffer.toString());
  const resText = resBuffer.toString();
  const latency = Date.now() - startTime;

  let prompt = "";
  let response = "";
  let model = reqBody.model || "";
  let inputTokens = 0;
  let outputTokens = 0;
  let toolUses = [];

  if (isAnthropic) {
    // Anthropic (Claude) parsing logic (existing)
    if (reqBody.messages) {
      const userMsgs = reqBody.messages.filter(m => m.role === "user");
      const last = userMsgs[userMsgs.length - 1];
      if (typeof last?.content === "string") prompt = last.content;
      else if (Array.isArray(last?.content)) prompt = last.content.filter(c => c.type === "text").map(c => c.text).join("\n");
    }

    if (contentType.includes("text/event-stream")) {
      for (const line of resText.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const p = JSON.parse(data);
          if (p.model) model = p.model;
          if (p.type === "content_block_delta" && p.delta?.text) response += p.delta.text;
          if (p.type === "content_block_start" && p.content_block?.type === "tool_use") {
            toolUses.push({ id: p.content_block.id, name: p.content_block.name, input: "" });
          }
          if (p.type === "content_block_delta" && p.delta?.partial_json) {
            if (toolUses.length > 0) toolUses[toolUses.length - 1].input += p.delta.partial_json;
          }
          if (p.usage) { inputTokens = p.usage.input_tokens || inputTokens; outputTokens = p.usage.output_tokens || outputTokens; }
          if (p.type === "message_delta" && p.usage) outputTokens = p.usage.output_tokens || outputTokens;
        } catch { }
      }
    } else {
      try {
        const p = JSON.parse(resText);
        if (p.model) model = p.model;
        if (p.content) response = p.content.filter(c => c.type === "text").map(c => c.text).join("");
        if (p.content) toolUses = p.content.filter(c => c.type === "tool_use").map(c => ({ id: c.id, name: c.name, input: c.input }));
        if (p.usage) { inputTokens = p.usage.input_tokens || 0; outputTokens = p.usage.output_tokens || 0; }
      } catch { }
    }
  } else {
    // OpenAI (ChatGPT) parsing logic
    if (reqBody.messages) {
      const last = reqBody.messages[reqBody.messages.length - 1];
      prompt = typeof last.content === "string" ? last.content : JSON.stringify(last.content);
    }

    if (contentType.includes("text/event-stream")) {
      for (const line of resText.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const p = JSON.parse(data);
          if (p.choices?.[0]?.delta?.content) response += p.choices[0].delta.content;
          if (p.usage) { inputTokens = p.usage.prompt_tokens; outputTokens = p.usage.completion_tokens; }
        } catch { }
      }
    } else {
      try {
        const p = JSON.parse(resText);
        if (p.choices?.[0]?.message?.content) response = p.choices[0].message.content;
        if (p.usage) { inputTokens = p.usage.prompt_tokens; outputTokens = p.usage.completion_tokens; }
      } catch { }
    }
  }

  const hasToolResult = reqBody.messages?.some(m => Array.isArray(m.content) && m.content.some(c => c.type === "tool_result" || c.tool_call_id));
  const isError = false; // Summary placeholder

  const session = getOrCreateSession();
  session.calls.push({
    prompt, response, model, inputTokens, outputTokens, latency,
    toolUses, hasToolResult, isError,
    description: prompt.slice(0, 100),
    timestamp: new Date().toISOString(),
  });

  console.log(`[Gridge Proxy] 캡처: ${isAnthropic ? "Claude" : "ChatGPT"} | ${model} | ${inputTokens}+${outputTokens} 토큰`);
}

// ── 시작 ──
server.listen(CONFIG.port, () => {
  console.log("");
  console.log("  ╔══════════════════════════════════════════╗");
  console.log("  ║       Gridge AI Proxy 실행 중            ║");
  console.log(`  ║  http://localhost:${CONFIG.port}                  ║`);
  console.log("  ╠══════════════════════════════════════════╣");
  console.log(`  ║  유저: ${(CONFIG.userId || "미설정").padEnd(33)}║`);
  console.log(`  ║  서버: ${(CONFIG.serverUrl || "미설정").slice(0, 33).padEnd(33)}║`);
  console.log("  ╚══════════════════════════════════════════╝");
  console.log("");
  console.log("  Claude Code 설정:");
  console.log(`    export ANTHROPIC_BASE_URL=http://localhost:${CONFIG.port}/v1`);
  console.log("");
  console.log("  Cursor 설정:");
  console.log(`    Settings → API Base URL → http://localhost:${CONFIG.port}/v1`);
  console.log("");
});
