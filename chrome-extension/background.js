// 암호화 모듈 로드
try { importScripts("crypto.js"); } catch { /* crypto.js 없으면 평문 전송 */ }

/**
 * Gridge AI Logger — Background Service Worker
 *
 * Content script에서 캡처된 로그를 받아 Gridge 서버에 배치 전송합니다.
 * - 로그 큐: 최대 10개 또는 30초마다 전송
 * - 설정: chrome.storage.local에 serverUrl, apiKey, userId 저장
 */

const LOG_QUEUE = [];
const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 30_000;

/** 설정 로드 */
async function getConfig() {
  let result = await chrome.storage.local.get(["serverUrl", "apiKey", "userId", "enabled"]);
  
  // 만약 설정이 비어있으면(빌드 후 첫 실행 등), config.json에서 다시 로드 시도
  if (!result.serverUrl || !result.apiKey) {
    const freshConfig = await loadInitialConfig();
    if (freshConfig) result = freshConfig;
  }

  return {
    serverUrl: result.serverUrl || "",
    apiKey: result.apiKey || "",
    userId: result.userId || "",
    enabled: result.enabled !== false,
  };
}

/** config.json에서 사전 설정 읽기 */
async function loadInitialConfig() {
  try {
    const res = await fetch(chrome.runtime.getURL("config.json"));
    if (!res.ok) return null;
    const config = await res.json();
    if (config.serverUrl && config.apiKey) {
      await chrome.storage.local.set({
        serverUrl: config.serverUrl,
        apiKey: config.apiKey,
        userId: config.userId || "u-001",
        enabled: true
      });
      console.log("[Gridge] config.json에서 설정 로드:", config.userId);
      return config;
    }
  } catch (e) {
    console.warn("[Gridge] config.json 로드 실패:", e);
  }
  return null;
}

async function flushLogs() {
  if (LOG_QUEUE.length === 0) return;

  const config = await getConfig();
  if (!config.enabled) return;

  const logsToSend = LOG_QUEUE.splice(0, BATCH_SIZE);
  const rawPayload = {
    logs: logsToSend.map(log => ({
      user_id: config.userId,
      ...log,
      channel: log.channel || "chrome-extension"
    })),
    api_key: config.apiKey,
  };

  // 1. Try local logging (for local viewer)
  try {
    await fetch("http://localhost:8080/api/logs/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rawPayload),
    });
    console.log("[Gridge] Local ingestion successful");
  } catch (e) {
    // Local proxy might not be running, ignore
  }

  // 2. Remote logging
  if (!config.serverUrl || !config.apiKey) {
    // If no remote server, we are done
    updateBadge();
    return;
  }

  try {
    // 암호화 시도 (crypto.js가 로드된 경우)
    let body;
    if (typeof gridgeCrypto !== "undefined") {
      const { encrypted, payload: encPayload } = await gridgeCrypto.encryptPayload(rawPayload, config.serverUrl);
      body = JSON.stringify(encrypted ? { encrypted: true, ...encPayload } : rawPayload);
    } else {
      body = JSON.stringify(rawPayload);
    }

    const res = await fetch(`${config.serverUrl}/api/logs/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (!res.ok) {
      console.error("[Gridge] Remote 전송 실패:", res.status);
      LOG_QUEUE.unshift(...logsToSend);
    } else {
      const data = await res.json();
      console.log(`[Gridge] ${data.ingested || logsToSend.length}건 Remote 전송 완료`);
      updateBadge();
    }
  } catch (err) {
    console.error("[Gridge] Remote 전송 오류:", err);
    LOG_QUEUE.unshift(...logsToSend);
  }
}

/** 배지 (큐 대기 수 표시) */
function updateBadge() {
  const count = LOG_QUEUE.length;
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : "" });
  chrome.action.setBadgeBackgroundColor({ color: count > 0 ? "#f59e0b" : "#10b981" });
}

/** Content script에서 메시지 수신 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "LOG_CAPTURED") {
    // Identity Filtering
    getConfig().then(config => {
      // If userEmail is configured, verify account_id matching
      if (config.userEmail && message.payload.account_id) {
        if (message.payload.account_id.toLowerCase() !== config.userEmail.toLowerCase()) {
          console.warn("[Gridge] 계정 불일치로 로그 폐기:", message.payload.account_id, "vs", config.userEmail);
          sendResponse({ status: "ignored", reason: "identity_mismatch" });
          return;
        }
      }

      LOG_QUEUE.push(message.payload);
      updateBadge();

      // 배치 사이즈 도달 시 즉시 전송
      if (LOG_QUEUE.length >= BATCH_SIZE) {
        flushLogs();
      }

      sendResponse({ status: "queued", queueSize: LOG_QUEUE.length });
    });
    return true; // async for getConfig
  }

  if (message.type === "GET_STATUS") {
    getConfig().then(config => {
      sendResponse({
        enabled: config.enabled,
        configured: !!(config.serverUrl && config.apiKey),
        queueSize: LOG_QUEUE.length,
      });
    });
    return true; // async sendResponse
  }

  if (message.type === "FLUSH_NOW") {
    flushLogs().then(() => sendResponse({ flushed: true }));
    return true;
  }
});

/** 주기적 전송 (30초) */
setInterval(flushLogs, FLUSH_INTERVAL_MS);

/** 설치 시 config.json에서 사전 설정 로드 */
chrome.runtime.onInstalled.addListener(async () => {
  await loadInitialConfig();
  await chrome.storage.local.set({ enabled: true });
});
