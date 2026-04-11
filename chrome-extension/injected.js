/**
 * Page context에서 실행되는 fetch 인터셉터.
 * content script가 아닌, 실제 페이지의 window.fetch를 래핑합니다.
 * web_accessible_resources로 등록되어 <script src="..."> 로 주입됩니다.
 */
(function () {
  "use strict";

  const originalFetch = window.fetch;
  const CLAUDE_API = /\/api\/(organizations\/[^/]+\/)?chat_conversations\/[^/]+\/(completion|messages)/;
  const GEMINI_API = /\/api\/generate|BardChatUi|StreamGenerate|_\/BardChatUi/;

  window.fetch = async function (...args) {
    const [url, options] = args;
    const urlStr = typeof url === "string" ? url : url?.url || "";

    const isClaude = CLAUDE_API.test(urlStr);
    const isGemini = GEMINI_API.test(urlStr);

    if (!isClaude && !isGemini) {
      return originalFetch.apply(this, args);
    }

    // 요청 본문 캡처
    let requestBody = null;
    try {
      if (options?.body) {
        requestBody = typeof options.body === "string" ? JSON.parse(options.body) : null;
      }
    } catch { /* non-JSON body */ }

    const startTime = Date.now();
    const response = await originalFetch.apply(this, args);
    const cloned = response.clone();

    // 비동기로 응답 수집
    processResponse(cloned, requestBody, isClaude ? "anthropic" : "gemini", startTime).catch(() => {});

    return response;
  };

  async function processResponse(response, requestBody, channel, startTime) {
    try {
      const contentType = response.headers.get("content-type") || "";
      let prompt = "";
      let responseText = "";
      let model = "";
      let inputTokens = 0;
      let outputTokens = 0;

      // ── 프롬프트 추출 ──
      if (requestBody) {
        if (requestBody.prompt) {
          prompt = requestBody.prompt;
        } else if (requestBody.messages) {
          const userMsgs = requestBody.messages.filter(m => m.role === "user");
          const last = userMsgs[userMsgs.length - 1];
          if (typeof last?.content === "string") {
            prompt = last.content;
          } else if (Array.isArray(last?.content)) {
            prompt = last.content.filter(c => c.type === "text").map(c => c.text).join("\n");
          }
        } else if (requestBody.contents) {
          const userParts = requestBody.contents
            .filter(c => c.role === "user")
            .flatMap(c => c.parts || [])
            .filter(p => p.text);
          prompt = userParts[userParts.length - 1]?.text || "";
        }
      }

      // ── 응답 추출 ──
      if (contentType.includes("text/event-stream") || contentType.includes("stream")) {
        // SSE 스트리밍
        const reader = response.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });

          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.model) model = parsed.model;
              if (parsed.type === "content_block_delta" && parsed.delta?.text) responseText += parsed.delta.text;
              if (parsed.completion) responseText += parsed.completion;
              if (parsed.usage) {
                inputTokens = parsed.usage.input_tokens || inputTokens;
                outputTokens = parsed.usage.output_tokens || outputTokens;
              }
              if (parsed.type === "message_delta" && parsed.usage) {
                outputTokens = parsed.usage.output_tokens || outputTokens;
              }
            } catch { /* skip non-JSON lines */ }
          }
        }
      } else {
        // 일반 JSON 응답
        const text = await response.text();
        try {
          const parsed = JSON.parse(text);
          if (parsed.candidates) {
            responseText = parsed.candidates[0]?.content?.parts?.[0]?.text || "";
          }
          if (parsed.content) {
            responseText = parsed.content.map(c => c.text || "").join("");
          }
          if (parsed.model) model = parsed.model;
          if (parsed.usage) {
            inputTokens = parsed.usage.input_tokens || 0;
            outputTokens = parsed.usage.output_tokens || 0;
          }
        } catch {
          // 텍스트에서 추출 시도
          const matches = text.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g);
          if (matches) responseText = matches.map(m => JSON.parse(`{${m}}`).text || "").join("");
        }
      }

      if (!prompt && !responseText) return;

      // 토큰 추정 (API에서 못 얻은 경우)
      if (!inputTokens && prompt) inputTokens = Math.ceil(prompt.length / 4);
      if (!outputTokens && responseText) outputTokens = Math.ceil(responseText.length / 4);

      // content script로 전달
      window.dispatchEvent(new CustomEvent("__gridge_log__", {
        detail: {
          channel,
          model: model || (channel === "anthropic" ? "claude-sonnet-4" : "gemini-1.5-pro"),
          prompt: prompt || "(캡처 실패)",
          response: responseText || "(캡처 실패)",
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cost_usd: 0,
          latency_ms: Date.now() - startTime,
          mode: "chat",
        },
      }));

    } catch (err) {
      console.error("[Gridge] 응답 처리 오류:", err);
    }
  }

  console.log("[Gridge] fetch 인터셉터 주입 완료");
})();
