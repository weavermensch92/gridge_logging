/**
 * Gridge AI Logger — Gemini Content Script
 * 구조 동일: injected.js 주입 + 이벤트 relay + DOM 폴백
 */
(function () {
  "use strict";

  // injected.js 주입 (이미 claude에서 주입되지 않은 경우)
  if (!document.querySelector('script[data-gridge-injected]')) {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("injected.js");
    script.dataset.gridgeInjected = "true";
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
  }

  // fetch 인터셉터 로그 수신
  window.addEventListener("__gridge_log__", (e) => {
    const payload = e.detail;
    if (!payload || (!payload.prompt && !payload.response)) return;
    chrome.runtime.sendMessage({ type: "LOG_CAPTURED", payload }, (res) => {
      if (!chrome.runtime.lastError) console.log("[Gridge] Gemini 로그 캡처 완료 — 큐", res?.queueSize, "건");
    });
  });

  // DOM 폴백
  let lastPrompt = "";
  let lastPromptTime = 0;
  let capturing = false;

  function estimateTokens(text) {
    if (!text) return 0;
    const ko = (text.match(/[\uac00-\ud7af]/g) || []).length;
    return Math.ceil(ko / 2 + (text.length - ko) / 4);
  }

  function getInput() {
    for (const sel of [
      'rich-textarea .ql-editor',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
    ]) {
      const el = document.querySelector(sel);
      if (el && el.isConnected) return el;
    }
    return null;
  }

  function getLastResponse() {
    for (const sel of [
      'model-response .response-content',
      '[data-message-author-role="model"]',
      '.model-response-text',
    ]) {
      const els = document.querySelectorAll(sel);
      if (els.length > 0) return els[els.length - 1].textContent?.trim() || "";
    }
    return "";
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const input = getInput();
      if (input && input.contains(document.activeElement)) {
        const text = input.innerText?.trim();
        if (text) { lastPrompt = text; lastPromptTime = Date.now(); capturing = true; }
      }
    }
  }, true);

  document.addEventListener("click", (e) => {
    if (e.target.closest('button[aria-label*="end"], button[aria-label*="Send"], .send-button')) {
      const input = getInput();
      if (input) {
        const text = input.innerText?.trim();
        if (text) { lastPrompt = text; lastPromptTime = Date.now(); capturing = true; }
      }
    }
  }, true);

  let timer = null;
  new MutationObserver(() => {
    if (!capturing) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (document.querySelector('.loading-indicator, mat-progress-bar')) return;
      const resp = getLastResponse();
      if (resp && resp.length > 20 && capturing) {
        chrome.runtime.sendMessage({
          type: "LOG_CAPTURED",
          payload: {
            channel: "gemini", model: "gemini-1.5-pro",
            prompt: lastPrompt, response: resp,
            input_tokens: estimateTokens(lastPrompt),
            output_tokens: estimateTokens(resp),
            cost_usd: 0,
            latency_ms: Date.now() - lastPromptTime,
            mode: "chat",
          },
        }, () => {
          if (!chrome.runtime.lastError) console.log("[Gridge] Gemini 로그 캡처 (DOM 폴백)");
        });
        capturing = false;
      }
    }, 2500);
  }).observe(document.body, { childList: true, subtree: true, characterData: true });

  console.log("[Gridge] Gemini content script 로드 완료");
})();
