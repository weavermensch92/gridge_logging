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
  const result = await chrome.storage.local.get(["serverUrl", "apiKey", "userId", "enabled"]);
  return {
    serverUrl: result.serverUrl || "",
    apiKey: result.apiKey || "",
    userId: result.userId || "",
    enabled: result.enabled !== false,
  };
}

/** 서버로 로그 전송 */
async function flushLogs() {
  if (LOG_QUEUE.length === 0) return;

  const config = await getConfig();
  if (!config.serverUrl || !config.apiKey || !config.enabled) return;

  const logsToSend = LOG_QUEUE.splice(0, BATCH_SIZE);
  const payload = {
    logs: logsToSend.map(log => ({
      user_id: config.userId,
      ...log,
    })),
    api_key: config.apiKey,
  };

  try {
    const res = await fetch(`${config.serverUrl}/api/logs/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("[Gridge] 로그 전송 실패:", res.status);
      // 실패한 로그를 큐 앞에 다시 추가
      LOG_QUEUE.unshift(...logsToSend);
    } else {
      const data = await res.json();
      console.log(`[Gridge] ${data.ingested}건 전송 완료`);
      // 배지 업데이트
      updateBadge();
    }
  } catch (err) {
    console.error("[Gridge] 전송 오류:", err);
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
    LOG_QUEUE.push(message.payload);
    updateBadge();

    // 배치 사이즈 도달 시 즉시 전송
    if (LOG_QUEUE.length >= BATCH_SIZE) {
      flushLogs();
    }

    sendResponse({ status: "queued", queueSize: LOG_QUEUE.length });
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

/** 설치 시 초기 설정 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ enabled: true });
  console.log("[Gridge] Extension installed");
});
