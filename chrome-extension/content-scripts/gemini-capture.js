/**
 * Gridge AI Logger — Gemini Content Script (v2)
 *
 * 이중 캡처 전략:
 * 1차: fetch 인터셉트 — Gemini의 API 호출 가로채기
 * 2차: DOM 관찰 — 폴백
 */

(function () {
  "use strict";

  const CHANNEL = "gemini";
  const CAPTURE_API_PATTERN = /\/api\/generate|BardChatUi|StreamGenerate|_\/BardChatUi/;

  // ═══════════════════════════════════════════════════
  // 1차: fetch 인터셉트
  // ═══════════════════════════════════════════════════

  function injectFetchInterceptor() {
    const script = document.createElement("script");
    script.textContent = `
      (function() {
        const originalFetch = window.fetch;

        window.fetch = async function(...args) {
          const [url, options] = args;
          const urlStr = typeof url === "string" ? url : url?.url || "";

          const isGeminiApi = ${CAPTURE_API_PATTERN.toString()}.test(urlStr);
          if (!isGeminiApi) return originalFetch.apply(this, args);

          let requestBody = null;
          try {
            if (options?.body) {
              requestBody = typeof options.body === "string" ? options.body : null;
            }
          } catch {}

          const startTime = Date.now();
          const response = await originalFetch.apply(this, args);
          const cloned = response.clone();

          // 응답 수집
          try {
            const text = await cloned.text();
            let prompt = "";
            let responseText = "";

            // Gemini 응답 파싱 (다양한 포맷 대응)
            try {
              // JSON 응답
              const parsed = JSON.parse(text);
              if (parsed.candidates) {
                responseText = parsed.candidates[0]?.content?.parts?.[0]?.text || "";
              }
            } catch {
              // 스트리밍/비표준 응답 — 텍스트에서 추출
              const textMatches = text.match(/"text":"((?:[^"\\\\]|\\\\.)*)"/g);
              if (textMatches) {
                responseText = textMatches
                  .map(m => m.replace(/"text":"/, "").replace(/"$/, ""))
                  .join("");
              }
            }

            // 요청에서 프롬프트 추출
            if (requestBody) {
              try {
                const reqParsed = JSON.parse(requestBody);
                if (reqParsed.contents) {
                  const userParts = reqParsed.contents
                    .filter(c => c.role === "user")
                    .flatMap(c => c.parts || [])
                    .filter(p => p.text)
                    .map(p => p.text);
                  prompt = userParts[userParts.length - 1] || "";
                }
              } catch {
                // URL 인코딩 등 다른 포맷
                const promptMatch = requestBody.match(/(?:prompt|query|input)[=:]([^&]+)/i);
                if (promptMatch) prompt = decodeURIComponent(promptMatch[1]);
              }
            }

            if (prompt && responseText) {
              window.dispatchEvent(new CustomEvent("__gridge_log__", {
                detail: {
                  channel: "${CHANNEL}",
                  model: "gemini-1.5-pro",
                  prompt: prompt,
                  response: responseText,
                  input_tokens: Math.ceil(prompt.length / 4),
                  output_tokens: Math.ceil(responseText.length / 4),
                  cost_usd: 0,
                  latency_ms: Date.now() - startTime,
                  mode: "chat",
                }
              }));
            }
          } catch (err) {
            console.error("[Gridge] Gemini 응답 수집 오류:", err);
          }

          return response;
        };

        console.log("[Gridge] Gemini fetch 인터셉터 주입 완료");
      })();
    `;
    document.documentElement.appendChild(script);
    script.remove();
  }

  window.addEventListener("__gridge_log__", (e) => {
    const payload = e.detail;
    if (!payload?.prompt || !payload?.response) return;
    chrome.runtime.sendMessage({
      type: "LOG_CAPTURED",
      payload: payload,
    }, (res) => {
      if (res) console.log(`[Gridge] Gemini 로그 캡처 (fetch) — 큐 ${res.queueSize}건`);
    });
  });

  // ═══════════════════════════════════════════════════
  // 2차: DOM 관찰 (폴백)
  // ═══════════════════════════════════════════════════

  let domLastPrompt = "";
  let domLastPromptTime = 0;
  let domCapturing = false;

  function estimateTokens(text) {
    if (!text) return 0;
    const korean = (text.match(/[\uac00-\ud7af]/g) || []).length;
    return Math.ceil(korean / 2 + (text.length - korean) / 4);
  }

  function getPromptInput() {
    const selectors = [
      'rich-textarea .ql-editor',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"][aria-label*="prompt"]',
      'textarea[aria-label*="prompt"]',
      'div[contenteditable="true"]',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent?.trim()) return el;
    }
    return null;
  }

  function getLatestResponse() {
    const selectors = [
      'model-response .response-content',
      'message-content.model-response-text',
      '[data-message-author-role="model"]',
      '.model-response-text',
      '[class*="response"][class*="model"]',
    ];
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      if (els.length > 0) return els[els.length - 1].textContent?.trim() || "";
    }
    return "";
  }

  function isStreamingComplete() {
    return !document.querySelector('.loading-indicator, [class*="streaming"], mat-progress-bar');
  }

  function sendDomLog(prompt, response) {
    if (!prompt || !response || response.length < 10) return;
    chrome.runtime.sendMessage({
      type: "LOG_CAPTURED",
      payload: {
        channel: CHANNEL, model: "gemini-1.5-pro",
        prompt, response,
        input_tokens: estimateTokens(prompt),
        output_tokens: estimateTokens(response),
        cost_usd: 0,
        latency_ms: Date.now() - domLastPromptTime,
        mode: "chat",
      },
    }, (res) => {
      if (res) console.log(`[Gridge] Gemini 로그 캡처 (DOM 폴백) — 큐 ${res.queueSize}건`);
    });
  }

  function setupDomCapture() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        const input = getPromptInput();
        if (input && (document.activeElement === input || input.contains(document.activeElement))) {
          domLastPrompt = input.textContent?.trim() || "";
          domLastPromptTime = Date.now();
          domCapturing = true;
        }
      }
    }, true);

    document.addEventListener("click", (e) => {
      const btn = e.target.closest('button[aria-label*="Send"], button[aria-label*="send"], .send-button');
      if (btn) {
        const input = getPromptInput();
        if (input) {
          domLastPrompt = input.textContent?.trim() || "";
          domLastPromptTime = Date.now();
          domCapturing = true;
        }
      }
    }, true);

    let checkTimer = null;
    const observer = new MutationObserver(() => {
      if (!domCapturing) return;
      clearTimeout(checkTimer);
      checkTimer = setTimeout(() => {
        if (isStreamingComplete() && domCapturing) {
          const response = getLatestResponse();
          if (response && response.length > 10) {
            sendDomLog(domLastPrompt, response);
            domCapturing = false;
          }
        }
      }, 2000);
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  // ═══════════════════════════════════════════════════
  // 초기화
  // ═══════════════════════════════════════════════════

  function init() {
    console.log("[Gridge] Gemini 캡처 스크립트 v2 로드 (fetch 인터셉트 + DOM 폴백)");
    injectFetchInterceptor();
    setupDomCapture();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
