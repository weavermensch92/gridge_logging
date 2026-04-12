/** Popup 스크립트 — 설정 저장/로드 + 상태 표시 */

const $ = (id) => document.getElementById(id);

// ── 초기화 ──
document.addEventListener("DOMContentLoaded", async () => {
  // 버튼 이벤트 바인딩 (CSP 때문에 inline onclick 사용 불가)
  $("saveBtn").addEventListener("click", saveConfig);
  $("toggleBtn").addEventListener("click", toggleEnabled);
  $("flushBtn").addEventListener("click", flushNow);
  $("settingsToggle").addEventListener("click", toggleSettings);

  const config = await chrome.storage.local.get(["serverUrl", "apiKey", "userId", "enabled"]);
  $("serverUrl").value = config.serverUrl || "";
  $("apiKey").value = config.apiKey || "";
  $("userId").value = config.userId || "";

  // 상태 조회
  chrome.runtime.sendMessage({ type: "GET_STATUS" }, (res) => {
    if (!res) return;
    updateStatusUI(res.enabled, res.configured);
    $("queueCount").textContent = String(res.queueSize);
    $("captureCount").textContent = "2";

    // 이미 설정되어 있다면 설정창은 닫아두기, 설정 안되어있으면 열어주기
    if (!res.configured) {
      $("settingsSection").classList.add("open");
    }
  });
});

// ── 상태 UI 업데이트 ──
function updateStatusUI(enabled, configured) {
  const dot = $("statusDot");
  const text = $("statusText");
  const btn = $("toggleBtn");

  if (!configured) {
    dot.className = "status-dot pending";
    text.textContent = "설정 필요";
    btn.className = "toggle-btn off";
    btn.textContent = "OFF";
  } else if (enabled) {
    dot.className = "status-dot on";
    text.textContent = "수집 중";
    btn.className = "toggle-btn on";
    btn.textContent = "ON";
  } else {
    dot.className = "status-dot off";
    text.textContent = "수집 중지";
    btn.className = "toggle-btn off";
    btn.textContent = "OFF";
  }
}

// ── 설정 저장 ──
async function saveConfig() {
  const serverUrl = $("serverUrl").value.trim();
  const apiKey = $("apiKey").value.trim();
  const userId = $("userId").value.trim();

  if (!serverUrl || !apiKey || !userId) {
    showMessage("모든 필드를 입력하세요.", "error");
    return;
  }

  try { new URL(serverUrl); } catch {
    showMessage("유효한 URL을 입력하세요.", "error");
    return;
  }

  await chrome.storage.local.set({ serverUrl, apiKey, userId, enabled: true });
  showMessage("설정이 저장되었습니다.", "success");
  updateStatusUI(true, true);
}

// ── ON/OFF 토글 ──
async function toggleEnabled() {
  const config = await chrome.storage.local.get(["enabled"]);
  const newEnabled = !config.enabled;
  await chrome.storage.local.set({ enabled: newEnabled });

  const fullConfig = await chrome.storage.local.get(["serverUrl", "apiKey"]);
  const configured = !!(fullConfig.serverUrl && fullConfig.apiKey);
  updateStatusUI(newEnabled, configured);
}

// ── 즉시 전송 ──
function flushNow() {
  $("flushBtn").textContent = "전송 중...";
  $("flushBtn").disabled = true;
  chrome.runtime.sendMessage({ type: "FLUSH_NOW" }, () => {
    $("flushBtn").textContent = "지금 전송";
    $("flushBtn").disabled = false;
    chrome.runtime.sendMessage({ type: "GET_STATUS" }, (res) => {
      if (res) $("queueCount").textContent = String(res.queueSize);
    });
  });
}

// ── 설정창 토글 ──
function toggleSettings() {
  $("settingsSection").classList.toggle("open");
}

// ── 메시지 표시 ──
function showMessage(text, type) {
  const el = $("message");
  el.textContent = text;
  el.className = `msg ${type}`;
  el.style.display = "block";
  setTimeout(() => { el.style.display = "none"; }, 3000);
}
