/**
 * Gridge AI Logger — Claude.ai Content Script
 *
 * 역할:
 * 1. injected.js를 page context에 주입 (fetch 인터셉트)
 * 2. CustomEvent로 전달받은 로그를 background에 relay
 * 3. DOM 폴백 (fetch 인터셉트 실패 시)
 */
(function () {
  "use strict";

  // ── injected.js 주입 (page context에서 fetch 래핑) ──
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);

  function getUserEmail() {
    // Claude sidebar bottom user profile area
    const sidebar = document.querySelector('nav, [role="navigation"]');
    if (!sidebar) return null;
    
    // Look for text matching email pattern
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const items = sidebar.querySelectorAll('div, span, button');
    for (const item of items) {
      if (emailRegex.test(item.innerText)) {
        return item.innerText.match(emailRegex)[0];
      }
    }
    return null;
  }

  // ── fetch 인터셉터에서 보낸 로그 수신 → background로 relay ──
  window.addEventListener("__gridge_log__", (e) => {
    const payload = e.detail;
    if (!payload || (!payload.prompt && !payload.response)) return;

    payload.account_id = getUserEmail();

    chrome.runtime.sendMessage({ type: "LOG_CAPTURED", payload }, (res) => {
      if (chrome.runtime.lastError) {
        console.warn("[Gridge] background 전달 실패:", chrome.runtime.lastError.message);
        return;
      }
      console.log("[Gridge] Claude 로그 캡처 완료 — 큐", res?.queueSize, "건");
    });
  });

  // ── DOM 폴백 (fetch 인터셉트가 안 되는 환경용) ──
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
      'div[contenteditable="true"].ProseMirror',
      'div.ProseMirror[contenteditable]',
      'fieldset div[contenteditable="true"]',
      'div[contenteditable="true"]',
    ]) {
      const el = document.querySelector(sel);
      if (el && el.isConnected) return el;
    }
    return null;
  }

  function getLastResponse() {
    // 대화 목록의 마지막 응답 블록
    const blocks = document.querySelectorAll('[data-testid*="message"], [class*="Message"], [class*="message"]');
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      // 어시스턴트 메시지 판별 (data attribute 또는 순서)
      if (b.getAttribute("data-testid")?.includes("assistant") ||
          b.querySelector(".markdown, .prose, [class*='markdown']")) {
        return b.textContent?.trim() || "";
      }
    }
    return "";
  }

  // 전송 감지
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      const input = getInput();
      if (input && input.contains(document.activeElement)) {
        const text = input.innerText?.trim();
        if (text) { lastPrompt = text; lastPromptTime = Date.now(); capturing = true; }
      }
    }
  }, true);

  document.addEventListener("click", (e) => {
    if (e.target.closest('button[aria-label*="end"], button[type="submit"], button[data-testid*="send"]')) {
      const input = getInput();
      if (input) {
        const text = input.innerText?.trim();
        if (text) { lastPrompt = text; lastPromptTime = Date.now(); capturing = true; }
      }
    }
  }, true);

  // 응답 완료 감지
  let timer = null;
  new MutationObserver(() => {
    if (!capturing) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      // 스트리밍 끝났는지 체크
      if (document.querySelector('[data-is-streaming="true"], .animate-pulse')) return;
      const resp = getLastResponse();
      if (resp && resp.length > 20 && capturing) {
        chrome.runtime.sendMessage({
          type: "LOG_CAPTURED",
          payload: {
            channel: "anthropic",
            model: "claude-sonnet-4",
            prompt: lastPrompt,
            response: resp,
            input_tokens: estimateTokens(lastPrompt),
            output_tokens: estimateTokens(resp),
            cost_usd: 0,
            latency_ms: Date.now() - lastPromptTime,
            mode: "chat",
          },
        }, () => {
          if (!chrome.runtime.lastError) console.log("[Gridge] Claude 로그 캡처 (DOM 폴백)");
        });
        capturing = false;
      }
    }, 2500);
  }).observe(document.body, { childList: true, subtree: true, characterData: true });

  console.log("[Gridge] Claude.ai content script 로드 완료");
})();
