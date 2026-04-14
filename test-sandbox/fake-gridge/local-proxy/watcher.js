#!/usr/bin/env node
/**
 * Gridge Log Watcher — Claude Code 대화 로그 파일 감시
 *
 * 환경변수 변경 없음. Claude Code가 정상 동작하면서
 * ~/.claude/projects/ 의 JSONL 파일 변경을 감시하여
 * 새로운 대화를 로컬 SQLite에 저장합니다.
 *
 * 사용법: node watcher.js
 */

const fs = require("fs");
const path = require("path");
const store = require("./local-store");
const sync = require("./sync");

const CLAUDE_DIR = path.join(process.env.HOME || process.env.USERPROFILE || "/tmp", ".claude");
const PROJECTS_DIR = path.join(CLAUDE_DIR, "projects");
const WATCH_INTERVAL_MS = 3000; // 3초마다 확인

// 설정 로드
let CONFIG = { serverUrl: "", apiKey: "", userId: "", port: 8080 };
const configPath = path.join(__dirname, "config.json");
if (fs.existsSync(configPath)) {
  try { CONFIG = { ...CONFIG, ...JSON.parse(fs.readFileSync(configPath, "utf-8")) }; } catch {}
}

// 파일별 마지막 읽은 위치 추적
const fileOffsets = new Map();

/** JSONL 파일에서 새 줄 읽기 */
function readNewLines(filePath) {
  try {
    const stat = fs.statSync(filePath);
    const lastOffset = fileOffsets.get(filePath) || 0;

    if (stat.size <= lastOffset) return []; // 변경 없음

    const fd = fs.openSync(filePath, "r");
    const buf = Buffer.alloc(stat.size - lastOffset);
    fs.readSync(fd, buf, 0, buf.length, lastOffset);
    fs.closeSync(fd);

    fileOffsets.set(filePath, stat.size);

    return buf.toString("utf-8")
      .split("\n")
      .filter(line => line.trim())
      .map(line => { try { return JSON.parse(line); } catch { return null; } })
      .filter(Boolean);
  } catch {
    return [];
  }
}

/** Claude Code JSONL 엔트리를 로그로 변환 */
function processEntries(entries, filePath) {
  let lastUserMessage = null;
  let savedCount = 0;

  for (const entry of entries) {
    if (entry.type === "user") {
      // 유저 메시지 저장 (다음 assistant 응답과 쌍으로)
      let prompt = "";
      if (typeof entry.message === "string") {
        prompt = entry.message;
      } else if (entry.message?.content) {
        if (typeof entry.message.content === "string") prompt = entry.message.content;
        else if (Array.isArray(entry.message.content)) {
          prompt = entry.message.content
            .filter(c => c.type === "text")
            .map(c => c.text)
            .join("\n");
        }
      }
      if (prompt) lastUserMessage = { prompt, timestamp: entry.timestamp };
    }

    if (entry.type === "assistant" && lastUserMessage) {
      // assistant 응답 추출
      let response = "";
      let model = "";
      let inputTokens = 0;
      let outputTokens = 0;
      let toolCalls = [];

      if (typeof entry.message === "string") {
        response = entry.message;
      } else if (entry.message?.content) {
        if (typeof entry.message.content === "string") {
          response = entry.message.content;
        } else if (Array.isArray(entry.message.content)) {
          response = entry.message.content
            .filter(c => c.type === "text")
            .map(c => c.text)
            .join("\n");
          toolCalls = entry.message.content
            .filter(c => c.type === "tool_use")
            .map(c => ({ name: c.name, input: JSON.stringify(c.input || {}).slice(0, 200) }));
        }
      }

      if (entry.message?.model) model = entry.message.model;
      if (entry.message?.usage) {
        inputTokens = entry.message.usage.input_tokens || 0;
        outputTokens = entry.message.usage.output_tokens || 0;
      }
      // costUsd 근사치
      const costUsd = (inputTokens / 1000) * 0.003 + (outputTokens / 1000) * 0.015;

      if (response || toolCalls.length > 0) {
        const hasTools = toolCalls.length > 0;
        store.saveLog({
          user_id: CONFIG.userId,
          channel: "anthropic",
          model: model || "claude-sonnet-4",
          prompt: lastUserMessage.prompt,
          response: response || `[${toolCalls.length} tool calls]`,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cost_usd: costUsd,
          latency_ms: entry.timestamp && lastUserMessage.timestamp
            ? new Date(entry.timestamp) - new Date(lastUserMessage.timestamp)
            : 0,
          mode: hasTools ? "agent" : "chat",
          agent_detail: hasTools ? {
            session_id: path.basename(filePath, ".jsonl"),
            session_duration_ms: 0,
            total_steps: 1,
            total_tool_calls: toolCalls.length,
            files_changed: [],
            steps: [{
              step: 1,
              phase: "execute",
              description: toolCalls.map(t => t.name).join(", "),
              tool_calls: toolCalls.map((t, i) => ({
                id: `tc-${Date.now()}-${i}`,
                type: t.name || "unknown",
                input: t.input,
                output_summary: "",
                timestamp: entry.timestamp || "",
                duration_ms: 0,
              })),
              timestamp: entry.timestamp || "",
            }],
            code_artifacts: [],
            summary: "",
          } : undefined,
        });
        savedCount++;
        lastUserMessage = null;
      }
    }
  }

  return savedCount;
}

/** 모든 JSONL 파일 스캔 */
function scanAll() {
  if (!fs.existsSync(PROJECTS_DIR)) return;

  const scan = (dir) => {
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) {
          scan(full);
        } else if (item.name.endsWith(".jsonl")) {
          const newLines = readNewLines(full);
          if (newLines.length > 0) {
            const saved = processEntries(newLines, full);
            if (saved > 0) {
              const stats = store.getStats();
              console.log(`[Gridge Watcher] ${path.basename(full)}: ${saved}건 캡처 | 총 ${stats.total_logs}건 | 미동기화 ${stats.unsynced}건`);
            }
          }
        }
      }
    } catch {}
  };

  scan(PROJECTS_DIR);
}

/** 초기 오프셋 설정 (기존 로그 건너뛰기) */
function initOffsets() {
  if (!fs.existsSync(PROJECTS_DIR)) return;

  const init = (dir) => {
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) init(full);
        else if (item.name.endsWith(".jsonl")) {
          const stat = fs.statSync(full);
          fileOffsets.set(full, stat.size); // 현재 끝으로 설정
        }
      }
    } catch {}
  };

  init(PROJECTS_DIR);
}

// ── 시작 ──
console.log("");
console.log("  ╔══════════════════════════════════════════════╗");
console.log("  ║    Gridge Log Watcher 실행 중                ║");
console.log(`  ║  감시: ~/.claude/projects/                    ║`);
console.log(`  ║  저장: ~/.gridge/logs.db                      ║`);
console.log(`  ║  유저: ${(CONFIG.userId || "미설정").padEnd(37)}║`);
console.log(`  ║  간격: ${WATCH_INTERVAL_MS / 1000}초                                    ║`);
console.log("  ╠══════════════════════════════════════════════╣");
console.log("  ║  환경변수 변경 없음 — Claude Code 정상 동작  ║");
console.log("  ║  JSONL 파일 변경 감시 → 로컬 SQLite 저장     ║");
console.log("  ╚══════════════════════════════════════════════╝");
console.log("");

// 기존 로그는 건너뛰고 새 것만 캡처
initOffsets();
console.log(`[Gridge Watcher] 기존 파일 ${fileOffsets.size}개 감지, 이후 새 대화만 캡처`);

// 서버 동기화 시작
sync.startAutoSync(CONFIG);

// 주기적 스캔
setInterval(scanAll, WATCH_INTERVAL_MS);

// 종료 시 정리
process.on("SIGINT", () => {
  console.log("\n[Gridge Watcher] 종료 중...");
  const stats = store.getStats();
  console.log(`[Gridge Watcher] 총 ${stats.total_logs}건 캡처, ${stats.unsynced}건 미동기화`);
  sync.stopAutoSync();
  store.close();
  process.exit(0);
});
