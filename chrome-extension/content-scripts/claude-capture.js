/**
 * Gridge AI Logger — Claude.ai Content Script (v2)
 *
 * 이중 캡처 전략:
 * 1차: fetch 인터셉트 — claude.ai의 API 호출을 가로채서 정확한 데이터 수집
 * 2차: DOM 관찰 — fetch 인터셉트 실패 시 폴백
 *
 * claude.ai는 프론트엔드에서 https://claude.ai/api/... 엔드포인트를 호출하므로
 * window.fetch를 래핑하면 정확한 프롬프트/응답/모델/토큰을 얻을 수 있습니다.
 */

(function () {
  "use strict";

  const CHANNEL = "anthropic";
  const CAPTURE_API_PATTERN = /\/api\/(organizations\/[^/]+\/)?chat_conversations\/[^/]+\/(completion|messages)/;

  // ═══════════════════════════════════════════════════
  // 1차: fetch 인터셉트 (가장 정확)
  // ═══════════════════════════════════════════════════

  /**
   * page context에 스크립트를 주입하여 fetch를 래핑합니다.
   * content script는 isolated world이므로, page의 fetch에 접근하려면
   * <script> 태그를 삽입해야 합니다.
   */
  function injectFetchInterceptor() {
    const script = document.createElement("script");
    script.textContent = `
      (function() {
        const originalFetch = window.fetch;

        window.fetch = async function(...args) {
          const [url, options] = args;
          const urlStr = typeof url === "string" ? url : url?.url || "";

          // Claude API 호출인지 체크
          const isChatApi = ${CAPTURE_API_PATTERN.toString()}.test(urlStr);

          if (!isChatApi) return originalFetch.apply(this, args);

          // 요청 본문 캡처
          let requestBody = null;
          try {
            if (options?.body) {
              requestBody = JSON.parse(options.body);
            }
          } catch {}

          // 원본 요청 실행
          const response = await originalFetch.apply(this, args);

          // 응답을 복제하여 읽기
          const cloned = response.clone();

          // 스트리밍 응답 수집 (SSE)
          collectStreamResponse(cloned, requestBody, urlStr);

          return response;
        };

        async function collectStreamResponse(response, requestBody, url) {
          try {
            const reader = response.body?.getReader();
            if (!reader) return;

            const decoder = new TextDecoder();
            let fullText = "";
            let model = "";
            let inputTokens = 0;
            let outputTokens = 0;
            const startTime = Date.now();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split("\\n");

              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);

                  // 모델 정보
                  if (parsed.model) model = parsed.model;

                  // 텍스트 추출 (여러 가지 응답 포맷 대응)
                  if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                    fullText += parsed.delta.text;
                  }
                  if (parsed.completion) {
                    fullText += parsed.completion;
                  }

                  // 토큰 사용량 (message_stop 또는 usage 이벤트)
                  if (parsed.usage) {
                    inputTokens = parsed.usage.input_tokens || inputTokens;
                    outputTokens = parsed.usage.output_tokens || outputTokens;
                  }
                  if (parsed.type === "message_delta" && parsed.usage) {
                    outputTokens = parsed.usage.output_tokens || outputTokens;
                  }
                } catch {}
              }
            }

            // 프롬프트 추출
            let prompt = "";
            if (requestBody?.prompt) {
              prompt = requestBody.prompt;
            } else if (requestBody?.messages) {
              const userMsgs = requestBody.messages.filter(m => m.role === "user");
              const lastUser = userMsgs[userMsgs.length - 1];
              if (typeof lastUser?.content === "string") {
                prompt = lastUser.content;
              } else if (Array.isArray(lastUser?.content)) {
                prompt = lastUser.content
                  .filter(c => c.type === "text")
                  .map(c => c.text)
                  .join("\\n");
              }
            }

            if (!prompt || !fullText) return;

            // content script로 이벤트 전달
            window.dispatchEvent(new CustomEvent("__gridge_log__", {
              detail: {
                channel: "${CHANNEL}",
                model: model || requestBody?.model || "claude-sonnet-4",
                prompt: prompt,
                response: fullText,
                input_tokens: inputTokens || Math.ceil(prompt.length / 4),
                output_tokens: outputTokens || Math.ceil(fullText.length / 4),
                cost_usd: 0,
                latency_ms: Date.now() - startTime,
                mode: "chat",
              }
            }));
          } catch (err) {
            console.error("[Gridge] 응답 수집 오류:", err);
          }
        }

        console.log("[Gridge] Claude.ai fetch 인터셉터 주입 완료");
      })();
    `;
    document.documentElement.appendChild(script);
    script.remove();
  }

  // page context에서 보낸 이벤트를 content script에서 수신
  window.addEventListener("__gridge_log__", (e) => {
    const payload = e.detail;
    if (!payload?.prompt || !payload?.response) return;

    chrome.runtime.sendMessage({
      type: "LOG_CAPTURED",
      payload: payload,
    }, (res) => {
      if (res) console.log(`[Gridge] Claude 로그 캡처 (fetch) — 큐 ${res.queueSize}건`);
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

  /** 프롬프트 입력 영역 — 여러 셀렉터 시도 */
  function getPromptInput() {
    const selectors = [
      'div[contenteditable="true"].ProseMirror',
      'div[contenteditable="true"][data-placeholder]',
      'fieldset div[contenteditable="true"]',
      'div[contenteditable="true"]',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent?.trim()) return el;
    }
    return null;
  }

  /** 최신 응답 블록 추출 — 여러 셀렉터 시도 */
  function getLatestResponse() {
    const selectors = [
      '[data-testid="chat-message-assistant"] .markdown',
      '[data-testid="assistant-message"]',
      '.font-claude-message',
      '[class*="AssistantMessage"]',
      '[class*="response-content"]',
    ];
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      if (els.length > 0) return els[els.length - 1].textContent?.trim() || "";
    }

    // 최후의 수단: 대화 목록에서 마지막 턴
    const allMessages = document.querySelectorAll('[data-testid*="message"], [class*="Message"]');
    if (allMessages.length >= 2) {
      return allMessages[allMessages.length - 1].textContent?.trim() || "";
    }
    return "";
  }

  function isStreamingComplete() {
    return !document.querySelector(
      '[data-is-streaming="true"], .animate-pulse, [class*="streaming"], [class*="Cursor"]'
    );
  }

  function sendDomLog(prompt, response) {
    if (!prompt || !response || response.length < 10) return;
    chrome.runtime.sendMessage({
      type: "LOG_CAPTURED",
      payload: {
        channel: CHANNEL,
        model: "claude-sonnet-4",
        prompt, response,
        input_tokens: estimateTokens(prompt),
        output_tokens: estimateTokens(response),
        cost_usd: 0,
        latency_ms: Date.now() - domLastPromptTime,
        mode: "chat",
      },
    }, (res) => {
      if (res) console.log(`[Gridge] Claude 로그 캡처 (DOM 폴백) — 큐 ${res.queueSize}건`);
    });
  }

  function setupDomCapture() {
    // 프롬프트 전송 감지
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
      const btn = e.target.closest('button[type="submit"], button[aria-label*="Send"], button[aria-label*="send"]');
      if (btn) {
        const input = getPromptInput();
        if (input) {
          domLastPrompt = input.textContent?.trim() || "";
          domLastPromptTime = Date.now();
          domCapturing = true;
        }
      }
    }, true);

    // 응답 완료 감지
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
    console.log("[Gridge] Claude.ai 캡처 스크립트 v2 로드 (fetch 인터셉트 + DOM 폴백)");

    // 1차: fetch 인터셉트 (정확한 데이터)
    injectFetchInterceptor();

    // 2차: DOM 관찰 (fetch 인터셉트 실패 시 폴백)
    setupDomCapture();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
