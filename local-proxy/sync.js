/**
 * Gridge 서버 동기화 엔진
 *
 * 로컬 SQLite → 서버 배치 동기화
 * - 서버 연결 시: 5분 간격 자동 동기화
 * - 서버 오프라인: 로컬에 계속 쌓임, 복구 시 자동 전송
 * - 수동 동기화: syncNow() 호출
 */

const http = require("http");
const https = require("https");
const store = require("./local-store");

const SYNC_INTERVAL_MS = 5 * 60 * 1000;  // 5분
const BATCH_SIZE = 50;
const MAX_RETRY = 3;

let syncTimer = null;
let syncing = false;
let serverOnline = false;
let config = { serverUrl: "", apiKey: "", userId: "" };

/** 서버 상태 체크 */
async function checkServer() {
  if (!config.serverUrl) return false;
  try {
    const url = new URL("/api/auth/me", config.serverUrl);
    const proto = url.protocol === "https:" ? https : http;
    return new Promise((resolve) => {
      const req = proto.get(url, { timeout: 5000 }, (res) => {
        res.resume();
        resolve(res.statusCode < 500);
      });
      req.on("error", () => resolve(false));
      req.on("timeout", () => { req.destroy(); resolve(false); });
    });
  } catch {
    return false;
  }
}

/** 서버로 로그 배치 전송 */
async function sendBatch(logs) {
  if (!config.serverUrl || !config.apiKey || logs.length === 0) return false;

  // 암호화 (가능한 경우)
  let body;
  try {
    const { encryptPayload } = require("./crypto");
    const rawPayload = { logs, api_key: config.apiKey };
    const { encrypted, payload } = await encryptPayload(rawPayload, config.serverUrl);
    body = JSON.stringify(encrypted ? { encrypted: true, ...payload } : rawPayload);
  } catch {
    body = JSON.stringify({ logs, api_key: config.apiKey });
  }

  const url = new URL("/api/logs/ingest", config.serverUrl);
  const proto = url.protocol === "https:" ? https : http;

  return new Promise((resolve) => {
    const req = proto.request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, (res) => {
      let data = "";
      res.on("data", d => data += d);
      res.on("end", () => resolve(res.statusCode >= 200 && res.statusCode < 300));
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => { req.destroy(); resolve(false); });
    req.setTimeout(30000);
    req.write(body);
    req.end();
  });
}

/** 동기화 실행 */
async function syncNow() {
  if (syncing) return { skipped: true };
  syncing = true;

  const stats = store.getStats();
  if (stats.unsynced === 0) {
    syncing = false;
    return { synced: 0, remaining: 0 };
  }

  // 서버 상태 체크
  serverOnline = await checkServer();
  if (!serverOnline) {
    syncing = false;
    console.log(`[Gridge Sync] 서버 오프라인 — ${stats.unsynced}건 로컬 대기 중`);
    return { offline: true, pending: stats.unsynced };
  }

  let totalSynced = 0;
  let retries = 0;

  while (retries < MAX_RETRY) {
    const unsyncedLogs = store.getUnsyncedLogs(BATCH_SIZE);
    if (unsyncedLogs.length === 0) break;

    const success = await sendBatch(unsyncedLogs);
    if (success) {
      const ids = unsyncedLogs.map(l => l.id);
      store.markSynced(ids);
      totalSynced += ids.length;
      retries = 0;  // 성공하면 리셋
      console.log(`[Gridge Sync] ${ids.length}건 동기화 완료 (누적: ${totalSynced})`);
    } else {
      retries++;
      console.log(`[Gridge Sync] 전송 실패 (재시도 ${retries}/${MAX_RETRY})`);
      // 지수 백오프
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
    }
  }

  const remaining = store.getStats().unsynced;
  syncing = false;
  console.log(`[Gridge Sync] 동기화 완료: ${totalSynced}건 전송, ${remaining}건 대기`);
  return { synced: totalSynced, remaining };
}

/** 자동 동기화 시작 */
function startAutoSync(cfg) {
  config = cfg;
  console.log(`[Gridge Sync] 자동 동기화 시작 (${SYNC_INTERVAL_MS / 60000}분 간격)`);

  // 즉시 1회 시도
  syncNow().catch(() => {});

  // 주기적 실행
  syncTimer = setInterval(() => {
    syncNow().catch(() => {});
  }, SYNC_INTERVAL_MS);
}

/** 자동 동기화 중지 */
function stopAutoSync() {
  if (syncTimer) { clearInterval(syncTimer); syncTimer = null; }
}

/** 현재 상태 */
function getStatus() {
  const stats = store.getStats();
  return {
    serverOnline,
    syncing,
    ...stats,
  };
}

module.exports = { syncNow, startAutoSync, stopAutoSync, getStatus };
