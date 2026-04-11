# 로그 수집 아키텍처 설계

## 개요

그릿지 플랫폼은 고객사의 AI 사용 로그를 **5개 채널**에서 수집합니다.
모든 로그는 단일 ingest API (`POST /api/logs/ingest`)로 수렴됩니다.

```
┌─────────────────────────────────────────────────────────────┐
│                     고객사 환경 (온프레미스)                   │
│                                                             │
│  [ChatGPT 웹]    [Claude 웹]   [Gemini 웹]                  │
│       │               │             │                       │
│       │          ┌────┴─────────────┴────┐                  │
│       │          │  Chrome Extension      │                  │
│       │          │  (content script로     │                  │
│       │          │   프롬프트/응답 캡처)   │                  │
│       │          └───────────┬────────────┘                  │
│       │                      │                               │
│  ┌────┴────┐                 │                               │
│  │ OpenAI  │                 │                               │
│  │ Team    │                 │                               │
│  │ Space   │                 │                               │
│  │ API폴링 │                 │                               │
│  └────┬────┘                 │                               │
│       │                      │                               │
│  [Claude Code]    [Cursor]                                   │
│       │               │                                      │
│  ┌────┴───────────────┴────┐                                │
│  │  로컬 프록시 인터셉터    │                                │
│  │  (localhost:8080)       │                                │
│  │                         │                                │
│  │  AI API 호출을 가로채서  │                                │
│  │  1) 원본 요청 → AI API  │                                │
│  │  2) 로그 복사 → Gridge  │                                │
│  └────────────┬────────────┘                                │
│               │                                              │
│               ▼                                              │
│  ┌─────────────────────────────────────────┐                │
│  │         Gridge 서버 (온프레미스)          │                │
│  │                                         │                │
│  │  POST /api/logs/ingest                  │                │
│  │  ┌───────────────────────────────────┐  │                │
│  │  │ 1. API Key 인증                   │  │                │
│  │  │ 2. Zod 스키마 검증                │  │                │
│  │  │ 3. Rate Limiting (100 req/min)    │  │                │
│  │  │ 4. 비동기 큐에 저장 (Bull/Redis)  │  │                │
│  │  │ 5. 즉시 202 Accepted 응답         │  │                │
│  │  └───────────┬───────────────────────┘  │                │
│  │              │                           │                │
│  │              ▼                           │                │
│  │  ┌───────────────────────────────────┐  │                │
│  │  │ 비동기 워커                        │  │                │
│  │  │ 1. DB 저장 (PostgreSQL logs 테이블)│  │                │
│  │  │ 2. 비용 집계 (user.ai_used_usd)   │  │                │
│  │  │ 3. 한도 체크 → 초과 시 알림       │  │                │
│  │  │ 4. 보안 스캔 큐에 추가            │  │                │
│  │  └───────────────────────────────────┘  │                │
│  │                                         │                │
│  │  ┌───────────────────────────────────┐  │                │
│  │  │ 보안 스캔 배치 (node-cron)        │  │                │
│  │  │ - 미검사 로그 대상 정규식 매칭     │  │                │
│  │  │ - 매칭 시 risk_alerts 생성        │  │                │
│  │  │ - critical → 관리자 즉시 알림     │  │                │
│  │  └───────────────────────────────────┘  │                │
│  └─────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## 채널별 수집 상세

### 1. ChatGPT (웹) — 공유 계정 + API 폴링

```
방식: 그릿지가 ChatGPT Team Space 공유 계정 제공
수집: OpenAI Admin API로 사용 내역 폴링 (5분 간격)
채널값: "openai"
```

**수집 흐름:**
1. 관리자가 유저에게 ChatGPT 공유 계정 할당
2. 유저는 공유 계정으로 ChatGPT 사용
3. 백엔드 cron이 OpenAI Admin API (`/v1/organization/usage`)를 5분마다 폴링
4. 신규 대화 감지 → `POST /api/logs/ingest`로 자체 전송
5. user_id는 공유 계정 내 유저 매핑으로 식별

**백엔드 구현 필요:**
- OpenAI Admin API 연동 (org-level usage API)
- 유저 ↔ ChatGPT 계정 매핑 테이블
- 폴링 스케줄러 (node-cron, 5분 간격)

---

### 2. Claude / Gemini (웹) — Chrome Extension

```
방식: Chrome Extension이 웹 UI에서 프롬프트/응답 인터셉트
수집: Extension → POST /api/logs/ingest
채널값: "anthropic" | "gemini"
```

**Extension 구조:**
```
chrome-extension/
├── manifest.json          # permissions: tabs, storage, host_permissions
├── content-scripts/
│   ├── claude-capture.js  # claude.ai DOM에서 프롬프트/응답 캡처
│   └── gemini-capture.js  # gemini.google.com DOM에서 캡처
├── background.js          # 캡처 데이터 → Gridge 서버 전송
└── popup.html             # 설정 UI (서버 URL, 인증 토큰)
```

**캡처 방식:**
- `MutationObserver`로 대화 DOM 변경 감지
- 프롬프트: 입력 textarea의 submit 이벤트 가로채기
- 응답: 스트리밍 완료 후 응답 블록 텍스트 추출
- 민감정보 마스킹: 로컬에서 정규식 사전 필터링 (선택)

**전송 페이로드:**
```json
{
  "logs": [{
    "user_id": "u-001",
    "channel": "anthropic",
    "model": "claude-sonnet-4",
    "prompt": "...",
    "response": "...",
    "input_tokens": 312,   // 추정값 (tiktoken 라이브러리)
    "output_tokens": 890,
    "cost_usd": 0,         // 웹은 비용 0 (구독 모델)
    "latency_ms": 1823,
    "mode": "chat"
  }],
  "api_key": "ext_xxxxx"
}
```

---

### 3. Claude Code / Cursor — 로컬 프록시 인터셉터

```
방식: 로컬 프록시가 AI API 호출을 가로채서 로그 복사
수집: 프록시 → POST /api/logs/ingest
채널값: "anthropic" | "extension"
```

**프록시 구조:**
```
local-proxy/
├── proxy-server.ts       # HTTP 프록시 (localhost:8080)
├── interceptor.ts        # 요청/응답 캡처 + 파싱
├── agent-parser.ts       # 에이전트 세션 파싱 (steps, tool_calls)
├── log-sender.ts         # 비동기 배치 전송 → Gridge 서버
└── config.json           # Gridge 서버 URL, API Key, 유저 ID
```

**동작 원리:**
1. 유저가 환경변수로 프록시 설정:
   ```bash
   # Claude Code
   export ANTHROPIC_BASE_URL=http://localhost:8080/v1

   # Cursor
   # Cursor Settings → API Base URL → http://localhost:8080/v1
   ```
2. 프록시가 요청을 받으면:
   - 원본 요청을 실제 AI API로 전달 (api.anthropic.com)
   - 응답을 유저에게 그대로 반환
   - 요청+응답 사본을 Gridge 서버에 비동기 전송
3. **에이전트 모드 감지**: 짧은 시간 내 연속 호출 → 세션으로 묶음
   - Claude Code: tool_use 블록 파싱 → AgentStep 구조 생성
   - Cursor: Composer 세션의 연속 호출 → 동일 session_id로 그룹핑

**에이전트 세션 파싱 로직:**
```typescript
// agent-parser.ts 핵심 로직
interface RawApiCall {
  timestamp: string;
  request: { messages: Message[]; tools?: Tool[] };
  response: { content: ContentBlock[] };
}

function parseAgentSession(calls: RawApiCall[]): AgentDetail {
  const sessionId = `ses-${Date.now()}`;
  const steps: AgentStep[] = [];
  let currentPhase: "plan" | "execute" | "verify" | "iterate" = "plan";

  for (const call of calls) {
    // tool_use 블록이 있으면 execute, 없으면 plan
    const toolUses = call.response.content.filter(c => c.type === "tool_use");
    if (toolUses.length > 0) currentPhase = "execute";

    // tool_result가 에러면 iterate
    const hasError = call.request.messages.some(m =>
      m.content?.some(c => c.type === "tool_result" && c.is_error)
    );
    if (hasError) currentPhase = "iterate";

    // "테스트", "확인", "verify" 키워드 → verify
    const lastMsg = call.request.messages[call.request.messages.length - 1];
    if (typeof lastMsg?.content === "string" &&
        /테스트|확인|verify|test|check/.test(lastMsg.content)) {
      currentPhase = "verify";
    }

    steps.push({
      step: steps.length + 1,
      phase: currentPhase,
      description: extractDescription(call),
      tool_calls: toolUses.map(mapToolCall),
      timestamp: call.timestamp,
    });
  }

  return {
    session_id: sessionId,
    session_duration_ms: calculateDuration(calls),
    total_steps: steps.length,
    total_tool_calls: steps.reduce((s, st) => s + st.tool_calls.length, 0),
    files_changed: extractFileChanges(calls),
    steps,
    code_artifacts: extractCodeArtifacts(calls),
    summary: generateSummary(steps),
  };
}
```

---

## Ingest API 상세

### `POST /api/logs/ingest`

**인증:** API Key (유저별 또는 채널별 발급)
```
Authorization: Bearer ext_xxxxx
```

**요청 본문:**
```typescript
// lib/validations.ts의 logIngestBulkSchema 참조
{
  "logs": [
    {
      "user_id": "u-001",
      "channel": "anthropic",
      "model": "claude-sonnet-4",
      "prompt": "...",
      "response": "...",
      "input_tokens": 312,
      "output_tokens": 890,
      "cost_usd": 6.83,
      "latency_ms": 1823,
      "mode": "agent",         // optional
      "agent_detail": { ... }  // optional, agent 모드일 때
    }
  ],
  "api_key": "ext_xxxxx"
}
```

**응답:**
```json
{ "ingested": 5, "errors": 0 }
```

**백엔드 처리 순서:**
1. API Key 검증 → 유저/채널 매핑
2. Zod 스키마 검증 (`logIngestBulkSchema`)
3. Rate Limiting 체크 (100 req/min per API Key)
4. Bull Queue에 비동기 적재 (메인 응답 지연 방지)
5. 즉시 `202 Accepted` 반환
6. 워커에서:
   - PostgreSQL `logs` 테이블에 INSERT
   - `users.ai_used_usd` 실시간 누적
   - 한도 초과 체크 → 초과 시 프록시 차단 + 관리자 알림
   - `scanned_at IS NULL`로 마킹 (보안 스캔 대기)

---

## 보안 스캔 배치

```
스케줄: node-cron, 10분 간격
대상: logs WHERE scanned_at IS NULL
방법: risk_rules.patterns 정규식 매칭
결과: risk_alerts 테이블에 INSERT
알림: severity=critical → admin에게 즉시 알림 (웹소켓/SSE)
```

---

## 온보딩 시 설치 안내 (유저별)

유저 추가 시 선택한 AI 도구에 따라 자동 안내:

| AI 도구 | 설치 항목 | 안내 내용 |
|---------|----------|----------|
| ChatGPT | 없음 | 공유 계정 정보 전달 (ID/PW) |
| Claude 웹 | Chrome Extension | `chrome://extensions`에서 설치 + Gridge 서버 URL 입력 |
| Gemini 웹 | Chrome Extension | 동일 Extension (gemini-capture 포함) |
| Claude Code | 로컬 프록시 | `npx gridge-proxy` 설치 + 환경변수 설정 안내 |
| Cursor | 로컬 프록시 | 동일 프록시 + Cursor Settings에서 Base URL 변경 |

---

## DB 스키마 (백엔드 참고)

```sql
-- 로그 테이블
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  channel VARCHAR(20) NOT NULL,       -- anthropic|openai|gemini|extension|crawler
  model VARCHAR(50) NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_usd DECIMAL(10,4) NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL,
  mode VARCHAR(10) DEFAULT 'chat',    -- chat|agent
  agent_detail JSONB,                 -- AgentDetail JSON (agent 모드일 때)
  scanned_at TIMESTAMPTZ,             -- 보안 스캔 완료 시간 (NULL = 미검사)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_logs_user_time ON logs(user_id, created_at DESC);
CREATE INDEX idx_logs_team_time ON logs(user_id, created_at DESC);
CREATE INDEX idx_logs_channel ON logs(channel);
CREATE INDEX idx_logs_mode ON logs(mode);
CREATE INDEX idx_logs_unscanned ON logs(scanned_at) WHERE scanned_at IS NULL;

-- 로그 수집 API 키
CREATE TABLE ingest_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  channel VARCHAR(20),
  key_hash VARCHAR(64) NOT NULL,      -- SHA-256 해시
  label VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 비용 계산 로직

| 채널 | 비용 산출 방식 |
|------|-------------|
| ChatGPT (공유계정) | OpenAI Admin API에서 사용량 조회 → 토큰 기반 비용 계산 |
| Claude 웹 (Extension) | 웹 구독이므로 cost_usd = 0 (토큰만 추적) |
| Gemini 웹 (Extension) | 웹 구독이므로 cost_usd = 0 |
| Claude Code (프록시) | API 호출이므로 실제 토큰 × 단가 계산 |
| Cursor (프록시) | API 호출이므로 실제 토큰 × 단가 계산 |

**토큰 단가 테이블 (백엔드에서 관리):**
```json
{
  "claude-sonnet-4": { "input": 0.003, "output": 0.015 },
  "claude-haiku-4": { "input": 0.0008, "output": 0.004 },
  "gpt-4o": { "input": 0.005, "output": 0.015 },
  "gemini-1.5-pro": { "input": 0.00125, "output": 0.005 }
}
```

---

## 프론트엔드 연동 포인트

프론트엔드에서 이미 구현된 API 클라이언트:

| 파일 | 메서드 | 백엔드 엔드포인트 |
|------|--------|-----------------|
| `lib/api/logs.ts` | `logsApi.list()` | `GET /api/logs` |
| `lib/api/logs.ts` | `logsApi.getById()` | `GET /api/logs/:id` |
| `lib/api/logs.ts` | `logsApi.getStats()` | `GET /api/logs/stats` |
| `lib/api/logs.ts` | `logsApi.ingest()` | `POST /api/logs/ingest` |
| `lib/api/risk.ts` | `riskApi.listRules()` | `GET /api/risk-rules` |
| `lib/api/risk.ts` | `riskApi.listAlerts()` | `GET /api/risk-alerts` |
| `lib/api/risk.ts` | `riskApi.dismissAlert()` | `PUT /api/risk-alerts/:id/dismiss` |
| `lib/api/files.ts` | `filesApi.list()` | `GET /api/files` |
| `lib/api/files.ts` | `filesApi.upload()` | `POST /api/files/upload` |
| `lib/api/reports.ts` | `reportsApi.getMaturity()` | `GET /api/maturity/:userId` |

**백엔드 개발자에게:** `NEXT_PUBLIC_API_MODE=real`로 전환하면 위 메서드들이 실제 `fetch()`를 실행합니다. Mock 분기 수정 불필요.
