/**
 * Gridge AI Logger — Gemini Content Script
 *
 * gemini.google.com 페이지에서 프롬프트/응답을 캡처합니다.
 * Claude 캡처와 동일한 패턴이지만, Gemini 고유 DOM 구조에 맞춤.
 */

(function () {
  "use strict";

  const CHANNEL = "gemini";
  let lastPrompt = "";
  let lastPromptTime = 0;
  let isCapturing = false;

  function estimateTokens(text) {
    if (!text) return 0;
    const korean = (text.match(/[\uac00-\ud7af]/g) || []).length;
    const other = text.length - korean;
    return Math.ceil(korean / 2 + other / 4);
  }

  function detectModel() {
    // Gemini UI에서 모델 정보 추출
    const modelEl = document.querySelector('[data-model-name], [class*="model-name"]');
    if (modelEl) return modelEl.textContent?.trim() || "gemini-1.5-pro";
    return "gemini-1.5-pro";
  }

  function getPromptInput() {
    return document.querySelector(
      'rich-textarea .ql-editor, ' +
      'div[contenteditable="true"][aria-label*="prompt"], ' +
      'div[contenteditable="true"][role="textbox"], ' +
      'textarea[aria-label*="prompt"]'
    );
  }

  function getLatestResponse() {
    const responses = document.querySelectorAll(
      'model-response .response-content, ' +
      'message-content[class*="model"], ' +
      '.model-response-text, ' +
      '[data-message-author-role="model"]'
    );
    if (responses.length === 0) return "";
    return responses[responses.length - 1].textContent?.trim() || "";
  }

  function isStreamingComplete() {
    const streaming = document.querySelector(
      '.loading-indicator, ' +
      '[class*="streaming"], ' +
      'mat-progress-bar, ' +
      '.response-streaming'
    );
    return !streaming;
  }

  function sendLog(prompt, response) {
    if (!prompt || !response) return;
    chrome.runtime.sendMessage({
      type: "LOG_CAPTURED",
      payload: {
        channel: CHANNEL,
        model: detectModel(),
        prompt,
        response,
        input_tokens: estimateTokens(prompt),
        output_tokens: estimateTokens(response),
        cost_usd: 0,
        latency_ms: Date.now() - lastPromptTime,
        mode: "chat",
      },
    }, (res) => {
      if (res) console.log(`[Gridge] Gemini 로그 큐 등록 (${res.queueSize}건 대기)`);
    });
  }

  function setupPromptCapture() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        const input = getPromptInput();
        if (input && (document.activeElement === input || input.contains(document.activeElement))) {
          const text = input.textContent?.trim();
          if (text && text.length > 0) {
            lastPrompt = text;
            lastPromptTime = Date.now();
            isCapturing = true;
          }
        }
      }
    }, true);

    document.addEventListener("click", (e) => {
      const button = e.target.closest(
        'button[aria-label*="Send"], button[aria-label*="submit"], ' +
        'button[data-testid="send-button"], .send-button'
      );
      if (button) {
        const input = getPromptInput();
        if (input) {
          const text = input.textContent?.trim();
          if (text && text.length > 0) {
            lastPrompt = text;
            lastPromptTime = Date.now();
            isCapturing = true;
          }
        }
      }
    }, true);
  }

  function setupResponseCapture() {
    let checkTimer = null;

    const observer = new MutationObserver(() => {
      if (!isCapturing) return;
      if (!isStreamingComplete()) {
        clearTimeout(checkTimer);
        checkTimer = setTimeout(() => {
          if (isStreamingComplete() && isCapturing) {
            const response = getLatestResponse();
            if (response && response.length > 10) {
              sendLog(lastPrompt, response);
              isCapturing = false;
            }
          }
        }, 1500);
        return;
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function init() {
    console.log("[Gridge] Gemini 캡처 스크립트 로드됨");
    setupPromptCapture();
    setupResponseCapture();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
