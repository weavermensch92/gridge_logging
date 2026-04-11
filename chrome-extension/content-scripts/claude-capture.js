/**
 * Gridge AI Logger — Claude.ai Content Script
 *
 * claude.ai 페이지에서 프롬프트 전송과 응답 완료를 감지하여
 * background worker에 로그를 전달합니다.
 *
 * 캡처 방식:
 * 1. 프롬프트: contenteditable div의 submit 이벤트 감지
 * 2. 응답: MutationObserver로 스트리밍 완료 감지
 * 3. 토큰 추정: 텍스트 길이 기반 (tiktoken 없이 근사치)
 */

(function () {
  "use strict";

  const CHANNEL = "anthropic";
  let lastPrompt = "";
  let lastPromptTime = 0;
  let isCapturing = false;

  /** 토큰 수 추정 (영어 ~4자/토큰, 한글 ~2자/토큰) */
  function estimateTokens(text) {
    if (!text) return 0;
    const korean = (text.match(/[\uac00-\ud7af]/g) || []).length;
    const other = text.length - korean;
    return Math.ceil(korean / 2 + other / 4);
  }

  /** 모델명 추출 (페이지에서 현재 선택된 모델) */
  function detectModel() {
    // Claude.ai UI에서 모델 선택기 텍스트 추출
    const modelSelector = document.querySelector("[data-testid='model-selector']");
    if (modelSelector) return modelSelector.textContent?.trim() || "claude-sonnet-4";

    // 대안: 페이지 타이틀이나 다른 요소에서 추론
    const title = document.title || "";
    if (title.includes("Opus")) return "claude-opus-4";
    if (title.includes("Haiku")) return "claude-haiku-4";
    return "claude-sonnet-4";
  }

  /** 프롬프트 입력 영역 감지 */
  function getPromptInput() {
    // Claude.ai의 프롬프트 입력 영역 (contenteditable div)
    return document.querySelector(
      '[contenteditable="true"][data-placeholder], ' +
      'div[contenteditable="true"].ProseMirror, ' +
      'fieldset div[contenteditable="true"]'
    );
  }

  /** 가장 최근 응답 블록의 텍스트 추출 */
  function getLatestResponse() {
    // Claude.ai의 응답 블록들
    const responseBlocks = document.querySelectorAll(
      '[data-testid="assistant-message"], ' +
      '.font-claude-message, ' +
      '[class*="response"], ' +
      '[data-is-streaming]'
    );

    if (responseBlocks.length === 0) return "";

    const lastBlock = responseBlocks[responseBlocks.length - 1];
    return lastBlock.textContent?.trim() || "";
  }

  /** 스트리밍 완료 감지 */
  function isStreamingComplete() {
    // 스트리밍 인디케이터가 없으면 완료
    const streaming = document.querySelector(
      '[data-is-streaming="true"], ' +
      '.animate-pulse, ' +
      '[class*="streaming"]'
    );
    return !streaming;
  }

  /** 로그를 background에 전송 */
  function sendLog(prompt, response) {
    if (!prompt || !response) return;

    const inputTokens = estimateTokens(prompt);
    const outputTokens = estimateTokens(response);

    chrome.runtime.sendMessage({
      type: "LOG_CAPTURED",
      payload: {
        channel: CHANNEL,
        model: detectModel(),
        prompt: prompt,
        response: response,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: 0, // 웹 구독 모델이므로 비용 0
        latency_ms: Date.now() - lastPromptTime,
        mode: "chat",
      },
    }, (res) => {
      if (res) console.log(`[Gridge] Claude 로그 큐 등록 (${res.queueSize}건 대기)`);
    });
  }

  /** 프롬프트 전송 감지 */
  function setupPromptCapture() {
    // 키보드 이벤트로 Enter 전송 감지
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        const input = getPromptInput();
        if (input && document.activeElement === input) {
          const text = input.textContent?.trim();
          if (text && text.length > 0) {
            lastPrompt = text;
            lastPromptTime = Date.now();
            isCapturing = true;
          }
        }
      }
    }, true);

    // 전송 버튼 클릭 감지
    document.addEventListener("click", (e) => {
      const target = e.target;
      const button = target.closest('button[type="submit"], button[aria-label*="Send"], button[data-testid="send-button"]');
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

  /** 응답 완료 감지 (MutationObserver) */
  function setupResponseCapture() {
    let checkTimer = null;

    const observer = new MutationObserver(() => {
      if (!isCapturing) return;

      // 스트리밍 중이면 대기
      if (!isStreamingComplete()) {
        // 완료 체크 타이머 리셋
        clearTimeout(checkTimer);
        checkTimer = setTimeout(() => {
          if (isStreamingComplete() && isCapturing) {
            const response = getLatestResponse();
            if (response && response.length > 10) {
              sendLog(lastPrompt, response);
              isCapturing = false;
            }
          }
        }, 1500); // 스트리밍 완료 후 1.5초 대기
        return;
      }
    });

    // 대화 컨테이너 관찰
    const chatContainer = document.querySelector(
      '[class*="conversation"], [class*="chat"], main, [role="main"]'
    );

    if (chatContainer) {
      observer.observe(chatContainer, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    } else {
      // 컨테이너가 아직 로드되지 않은 경우, body를 관찰
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  /** 초기화 */
  function init() {
    console.log("[Gridge] Claude.ai 캡처 스크립트 로드됨");
    setupPromptCapture();
    setupResponseCapture();
  }

  // DOM 준비 후 실행
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
