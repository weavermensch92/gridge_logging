/**
 * Gridge 로컬 로그 저장소 (SQLite)
 *
 * 서버 연결 없이도 모든 로그를 로컬에 저장합니다.
 * 서버 연결 시 배치 동기화합니다.
 *
 * DB 위치: ~/.gridge/logs.db
 */

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const GRIDGE_HOME = path.join(process.env.HOME || process.env.USERPROFILE || "/tmp", ".gridge");
const DB_PATH = path.join(GRIDGE_HOME, "logs.db");

let db;

function getDb() {
  if (db) return db;

  if (!fs.existsSync(GRIDGE_HOME)) fs.mkdirSync(GRIDGE_HOME, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");  // 동시 읽기/쓰기 성능
  db.pragma("busy_timeout = 5000");

  // 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt TEXT NOT NULL,
      response TEXT NOT NULL,
      input_tokens INTEGER NOT NULL,
      output_tokens INTEGER NOT NULL,
      cost_usd REAL NOT NULL DEFAULT 0,
      latency_ms INTEGER NOT NULL,
      mode TEXT DEFAULT 'chat',
      agent_detail TEXT,
      synced INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_logs_synced ON logs(synced) WHERE synced = 0;
    CREATE INDEX IF NOT EXISTS idx_logs_user ON logs(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_logs_channel ON logs(channel);

    CREATE TABLE IF NOT EXISTS sync_status (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  console.log(`[Gridge Store] SQLite 초기화: ${DB_PATH}`);
  return db;
}

/** 로그 저장 (즉시, 로컬) */
function saveLog(log) {
  const d = getDb();
  const id = log.id || `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const stmt = d.prepare(`
    INSERT OR REPLACE INTO logs (id, user_id, channel, model, prompt, response,
      input_tokens, output_tokens, cost_usd, latency_ms, mode, agent_detail, synced, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))
  `);

  stmt.run(
    id,
    log.user_id || "",
    log.channel || "anthropic",
    log.model || "",
    log.prompt || "",
    log.response || "",
    log.input_tokens || 0,
    log.output_tokens || 0,
    log.cost_usd || 0,
    log.latency_ms || 0,
    log.mode || "chat",
    log.agent_detail ? JSON.stringify(log.agent_detail) : null,
  );

  return id;
}

/** 벌크 저장 */
function saveLogs(logs) {
  const d = getDb();
  const insert = d.prepare(`
    INSERT OR REPLACE INTO logs (id, user_id, channel, model, prompt, response,
      input_tokens, output_tokens, cost_usd, latency_ms, mode, agent_detail, synced, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))
  `);

  const tx = d.transaction((items) => {
    for (const log of items) {
      const id = log.id || `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      insert.run(id, log.user_id || "", log.channel || "anthropic", log.model || "",
        log.prompt || "", log.response || "", log.input_tokens || 0, log.output_tokens || 0,
        log.cost_usd || 0, log.latency_ms || 0, log.mode || "chat",
        log.agent_detail ? JSON.stringify(log.agent_detail) : null);
    }
  });

  tx(logs);
  return logs.length;
}

/** 미동기화 로그 조회 (서버 전송용) */
function getUnsyncedLogs(limit = 50) {
  const d = getDb();
  const rows = d.prepare("SELECT * FROM logs WHERE synced = 0 ORDER BY created_at ASC LIMIT ?").all(limit);
  return rows.map(r => ({
    ...r,
    agent_detail: r.agent_detail ? JSON.parse(r.agent_detail) : undefined,
  }));
}

/** 동기화 완료 표시 */
function markSynced(ids) {
  if (ids.length === 0) return;
  const d = getDb();
  const placeholders = ids.map(() => "?").join(",");
  d.prepare(`UPDATE logs SET synced = 1 WHERE id IN (${placeholders})`).run(...ids);
}

/** 로컬 로그 조회 (본인 로그 열람) */
function queryLogs({ userId, channel, mode, limit = 50, offset = 0 } = {}) {
  const d = getDb();
  let sql = "SELECT * FROM logs WHERE 1=1";
  const params = [];

  if (userId) { sql += " AND user_id = ?"; params.push(userId); }
  if (channel) { sql += " AND channel = ?"; params.push(channel); }
  if (mode) { sql += " AND mode = ?"; params.push(mode); }

  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const rows = d.prepare(sql).all(...params);
  return rows.map(r => ({
    ...r,
    agent_detail: r.agent_detail ? JSON.parse(r.agent_detail) : undefined,
  }));
}

/** 통계 */
function getStats(userId) {
  const d = getDb();
  let sql = "SELECT COUNT(*) as total, SUM(cost_usd) as cost, SUM(input_tokens + output_tokens) as tokens FROM logs";
  const params = [];
  if (userId) { sql += " WHERE user_id = ?"; params.push(userId); }

  const row = d.prepare(sql).get(...params);
  const unsyncedCount = d.prepare("SELECT COUNT(*) as cnt FROM logs WHERE synced = 0").get();

  return {
    total_logs: row.total || 0,
    total_cost_usd: row.cost || 0,
    total_tokens: row.tokens || 0,
    unsynced: unsyncedCount.cnt || 0,
  };
}

/** DB 닫기 */
function close() {
  if (db) { db.close(); db = null; }
}

module.exports = { saveLog, saveLogs, getUnsyncedLogs, markSynced, queryLogs, getStats, close, DB_PATH };
