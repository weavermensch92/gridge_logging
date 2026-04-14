# PRD — Claude Code CLI 기반 AI 위험 감지 + 코칭 분석기
## Sandbox Track | gridge_logging

> **이 문서는 Claude Code에게 넘기는 실행 명세서다.**
> 기존 production 코드를 건드리지 않는 별도 sandbox 트랙으로 진행한다.

---

## 0. 배경 & 목적

### 현재 상태 (as-is)
- `docs/backend-requirements.md` §8에 보안 스캔 배치가 정규식 기반으로 설계됨
- `types/risk.ts`에 RiskRule, RiskAlert, RiskException 타입 정의 완료
- `app/production/admin/security/page.tsx`에 규칙 CRUD + 알림 UI 완성 (Mock 데이터)
- `types/log-classification.ts`에 SDLC/의도/산출물/감지플래그 분류 체계 완성
- `lib/mockData.ts`에 9개 규칙 + 8개 알림 + 20개 로그 샘플 존재
- 실제 백엔드 미구축, 전부 Mock 모드

### 변경 목적 (to-be)
기존 설계: 로그마다 LLM API 호출 → **과비용**
새 설계: **Claude Code CLI + Max 구독** 으로 고정비 전환

- 1단계: 정규식 필터 (비용 0) → 전체 로그의 ~85% 걸러냄
- 2단계: 통과한 의심 로그만 Claude Code CLI 세션에 투입 → 맥락 기반 판단
- 고객사별 CLAUDE.md 스킬 파일로 감지 기준 커스터마이징
- 성숙도 코칭 리포트도 동일 구조로 생성

### 핵심 제약
- **API 추가 비용 0원** — Max 구독 고정비만 사용
- **기존 production 코드 수정 금지** — sandbox/ 디렉토리 내에서만 작업
- **Mock 데이터로 E2E 검증** — 실 DB 연동은 이후 단계

---

## 1. 디렉토리 구조

```
sandbox/
└── ai-analyzer/
    ├── PRD.md                          ← 이 문서
    ├── package.json                    ← 의존성 (minimist, glob 등 최소한)
    │
    ├── config/
    │   └── default.json                ← 글로벌 설정 (필터 임계값, CLI 경로 등)
    │
    ├── orgs/                           ← 고객사별 디렉토리
    │   ├── org-softsquared/
    │   │   ├── CLAUDE.md               ← Softsquared 전용 감지 기준 (스킬)
    │   │   ├── pending.jsonl           ← 1차 필터 통과 로그 큐
    │   │   ├── results.jsonl           ← Claude 판단 결과
    │   │   └── coaching.jsonl          ← 코칭 분석 결과
    │   └── org-template/
    │       └── CLAUDE.md               ← 신규 고객사용 템플릿
    │
    ├── scripts/
    │   ├── 01-export-logs.ts           ← DB/Mock에서 미스캔 로그 추출
    │   ├── 02-regex-filter.ts          ← 1단계 정규식 필터
    │   ├── 03-prepare-batch.ts         ← 필터 통과 로그 → pending.jsonl 생성
    │   ├── 04-claude-analyze.sh        ← Claude Code CLI 호출 (핵심)
    │   ├── 05-parse-results.ts         ← Claude 출력 → results.jsonl 파싱
    │   ├── 06-import-alerts.ts         ← results → risk_alerts 형식 변환 + DB 저장
    │   ├── 07-coaching-batch.sh        ← 코칭 분석 Claude Code CLI 호출
    │   ├── run-full-pipeline.sh        ← 01~06 일괄 실행
    │   └── run-coaching-pipeline.sh    ← 코칭 파이프라인 일괄 실행
    │
    ├── lib/
    │   ├── log-loader.ts               ← Mock/DB 로그 로더 (추상화)
    │   ├── regex-engine.ts             ← 정규식 매칭 엔진
    │   ├── result-parser.ts            ← Claude 출력 JSON 파서
    │   ├── cost-calculator.ts          ← 비용 계산 유틸
    │   └── types.ts                    ← sandbox 전용 타입 (기존 types/ 재사용 + 확장)
    │
    └── tests/
        ├── regex-filter.test.ts        ← 정규식 필터 단위 테스트
        ├── result-parser.test.ts       ← 파서 단위 테스트
        └── e2e-pipeline.test.ts        ← Mock 데이터 E2E
```

---

## 2. 데이터 흐름 전체

```
┌─────────────────────────────────────────────────────────┐
│                      PIPELINE                           │
│                                                         │
│  [DB/Mock 로그]                                         │
│       │                                                 │
│       ▼                                                 │
│  01-export-logs.ts                                      │
│  scanned_at IS NULL인 로그 추출                          │
│       │                                                 │
│       ▼                                                 │
│  02-regex-filter.ts  ←── risk_rules (enabled=true)      │
│  정규식 매칭 → 즉시 알림 생성 (critical/warning/info)      │
│  + 정규식 미매칭이지만 의심 조건 해당 → "AI 분석 필요" 플래그 │
│       │                                                 │
│       ├── 정규식 매칭 → 바로 risk_alerts INSERT           │
│       │                                                 │
│       ▼                                                 │
│  03-prepare-batch.ts                                    │
│  "AI 분석 필요" 로그 → orgs/{orgId}/pending.jsonl        │
│  고객사별로 분리, 컨텍스트 윈도우 한도(300건) 내 배치 분할   │
│       │                                                 │
│       ▼                                                 │
│  04-claude-analyze.sh                                   │
│  cd orgs/{orgId} && cat pending.jsonl |                 │
│  claude --print "CLAUDE.md 기준으로 위험도 평가"          │
│       │                                                 │
│       ▼                                                 │
│  05-parse-results.ts                                    │
│  Claude 텍스트 출력 → results.jsonl (구조화된 JSON)       │
│       │                                                 │
│       ▼                                                 │
│  06-import-alerts.ts                                    │
│  results.jsonl → RiskAlert[] 형식 변환                   │
│  → DB INSERT 또는 Mock 파일 출력                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 각 스크립트 상세 명세

### 3-1. `01-export-logs.ts`

**역할:** 미스캔 로그를 추출한다.

```
입력: --source mock | db
      --org <orgId> (선택, 없으면 전체)
출력: stdout로 JSONL 출력 (파이프 가능)

Mock 모드:
  - lib/mockData.ts의 MOCK_LOGS를 읽는다
  - 각 로그를 types/log.ts의 Log 형식 그대로 JSONL로 출력

DB 모드 (미래):
  - SELECT * FROM logs WHERE scanned_at IS NULL AND org_id = ?
  - JSONL로 출력

각 줄 형식:
{"id":"log-001","user_id":"u-001","user_name":"홍길동","team":"개발팀","channel":"anthropic","model":"claude-sonnet-4-20250514","prompt":"...","response":"...","input_tokens":1200,"output_tokens":800,"cost_usd":0.015,"latency_ms":2300,"timestamp":"2026-03-25T09:15:00Z"}
```

### 3-2. `02-regex-filter.ts`

**역할:** 정규식 1차 필터. 기존 risk_rules를 그대로 사용.

```
입력: stdin (JSONL) + --rules-source mock | db
출력: 두 개의 스트림
      → stdout: "AI 분석 필요" 로그 (정규식으로 잡히지 않았지만 의심 조건 해당)
      → stderr 또는 --alerts-out 파일: 정규식 매칭된 즉시 알림

정규식 매칭 로직:
  1. MOCK_RISK_RULES (또는 DB risk_rules) WHERE enabled=true 로드
  2. 각 로그에 대해:
     a. rule.match_field에 따라 prompt/response/both 선택
     b. rule.patterns[] 각각에 대해 substring match (대소문자 무시)
     c. 매칭 시 → RiskAlert 생성, --alerts-out에 기록
  3. 정규식 미매칭이지만 아래 "의심 조건" 해당 시 → stdout로 출력 (AI 분석 대상)

의심 조건 (AI 분석으로 넘기는 기준):
  - input_tokens > 3000 (대량 입력)
  - prompt 길이 > 2000자
  - prompt에 코드 블록(```)이 100줄 이상 포함
  - prompt에 테이블/CSV 형태 데이터 20행 이상
  - prompt에 이메일 주소 패턴 3개 이상
  - prompt에 숫자 나열 (전화번호/계좌번호 추정) 3개 이상
  - 이전 session_id 동일 로그에서 이미 critical 알림 발생 (연쇄 위험)

의심 조건에 해당하지 않고 정규식에도 안 걸린 로그 → 버림 (scanned_at 마킹만)
```

### 3-3. `03-prepare-batch.ts`

**역할:** AI 분석 대상 로그를 고객사별로 분리하고 배치 크기를 관리한다.

```
입력: stdin (02의 stdout, JSONL)
출력: orgs/{orgId}/pending.jsonl 파일 생성

로직:
  1. 각 로그의 org_id (Mock에서는 전부 "org-001")로 그룹핑
  2. 고객사별로 pending.jsonl 생성
  3. 배치 크기 제한: 1배치 = 최대 50건 (컨텍스트 윈도우 안전 마진)
     - 50건 초과 시 pending-001.jsonl, pending-002.jsonl 로 분할
  4. 각 로그에서 Claude에 보낼 필드만 추출 (response 제외 — 토큰 절약):
     {
       "id": "log-001",
       "user": "홍길동 (개발팀)",
       "channel": "anthropic",
       "model": "claude-sonnet-4-20250514",
       "prompt_preview": "앞 500자 + ... + 뒤 200자",
       "tokens": 2000,
       "cost": 0.015,
       "timestamp": "2026-03-25T09:15:00Z"
     }
  5. prompt_preview: 전체 프롬프트가 아닌 앞 500자 + 뒤 200자만 (토큰 절약)
     - 단, 의심 조건에 해당하는 구간(이메일, 숫자 나열 등)은 보존
```

### 3-4. `04-claude-analyze.sh` ⭐ 핵심

**역할:** Claude Code CLI를 호출하여 pending 로그를 분석한다.

```bash
#!/bin/bash
# 사용법: ./04-claude-analyze.sh [orgId]
# 예시: ./04-claude-analyze.sh org-softsquared

set -euo pipefail

ORG_DIR="$(dirname "$0")/../orgs/${1:?org ID 필수}"
PENDING="$ORG_DIR/pending.jsonl"
RESULTS="$ORG_DIR/results.jsonl"

if [ ! -f "$PENDING" ]; then
  echo "pending.jsonl 없음. 분석 대상 없음." >&2
  exit 0
fi

BATCH_COUNT=$(ls "$ORG_DIR"/pending*.jsonl 2>/dev/null | wc -l)

for BATCH_FILE in "$ORG_DIR"/pending*.jsonl; do
  echo "[$(date)] 분석 시작: $BATCH_FILE ($(wc -l < "$BATCH_FILE")건)" >&2

  # Claude Code CLI 호출
  # --print: 대화형이 아닌 단발 출력 모드
  # CLAUDE.md가 같은 디렉토리에 있으면 자동으로 컨텍스트에 포함됨
  cd "$ORG_DIR"
  cat "$BATCH_FILE" | claude --print \
    "첨부된 JSONL의 각 로그를 CLAUDE.md에 정의된 기준으로 위험도를 평가해줘.

반드시 아래 JSON 배열 형식으로만 응답해. 설명 텍스트 없이 JSON만 출력해.

[
  {
    \"log_id\": \"원본 id\",
    \"risk_level\": \"critical|warning|info|safe\",
    \"category\": \"confidential|security|compliance|non_work|cost_anomaly|safe\",
    \"reason\": \"판단 근거 1줄\",
    \"coaching_hint\": \"이 사용자에게 줄 수 있는 개선 제안 1줄 (safe면 빈 문자열)\"
  }
]" >> "$RESULTS"

  echo "[$(date)] 분석 완료: $BATCH_FILE" >&2
done

echo "[$(date)] 전체 완료. 결과: $RESULTS" >&2
```

**주의사항:**
- `cd "$ORG_DIR"` 후 `claude` 실행 → CLAUDE.md가 프로젝트 루트로 인식됨
- `--print` 플래그: 대화형 세션이 아닌 1회성 출력 모드
- `cat ... | claude`: stdin으로 로그 데이터 전달
- 결과를 append(>>)로 results.jsonl에 누적

### 3-5. `05-parse-results.ts`

**역할:** Claude 텍스트 출력을 구조화된 JSON으로 파싱한다.

```
입력: orgs/{orgId}/results.jsonl (Claude 원본 출력)
출력: 정제된 results.jsonl (덮어쓰기)

로직:
  1. Claude 출력에서 JSON 배열 추출 (```json 코드블록 또는 bare JSON)
  2. 각 항목 검증:
     - log_id가 pending에 존재하는지
     - risk_level이 유효한 enum인지
     - category가 유효한 enum인지
  3. 파싱 실패 건 → error.jsonl에 원본 텍스트와 함께 기록
  4. 성공 건 → 정제된 JSON으로 results.jsonl 덮어쓰기

출력 형식 (각 줄):
{"log_id":"log-001","risk_level":"warning","category":"confidential","reason":"내부 프로젝트명 노출","coaching_hint":"프롬프트에서 프로젝트 코드명을 일반명으로 치환하세요"}
```

### 3-6. `06-import-alerts.ts`

**역할:** 파싱된 결과를 기존 RiskAlert 형식으로 변환한다.

```
입력: orgs/{orgId}/results.jsonl + 원본 pending.jsonl
출력: --mode mock → alerts.json 파일 생성
      --mode db → risk_alerts 테이블 INSERT (미래)

변환 매핑:
  results.jsonl 항목 → RiskAlert:
  {
    id: "ai-alert-{timestamp}-{index}",
    rule_id: "ai-analysis",               // 고정값: AI 분석 결과임을 표시
    log_id: results.log_id,
    severity: results.risk_level,          // safe는 알림 미생성
    matched_pattern: "AI: " + results.category,
    matched_text_preview: results.reason,
    timestamp: now(),
    dismissed: false
  }

  risk_level == "safe" → 알림 미생성, scanned_at만 업데이트
  coaching_hint가 있으면 → coaching.jsonl에 별도 저장
```

---

## 4. CLAUDE.md 스킬 파일 명세

### 4-1. 템플릿 (`orgs/org-template/CLAUDE.md`)

```markdown
# {고객사명} AI 사용 위험 감지 기준

> 이 파일은 Claude Code CLI가 로그를 분석할 때 참조하는 감지 기준입니다.
> 고객사 관리자가 웹 UI에서 기준을 설정하면 이 파일이 자동 생성됩니다.

## 역할

너는 기업 AI 사용 로그 보안 분석가야.
전달되는 JSONL 로그 각각에 대해 아래 기준으로 위험도를 평가해.

## 위험 카테고리

### 1. 기밀 정보 유출 (confidential) → critical
- 고객 개인정보 (이름+연락처, 주민번호, 계좌번호 조합)
- API 키, 시크릿 토큰, 비밀번호가 평문으로 포함
- 내부 서버 주소, DB 접속 정보
- 미공개 사업 계획, M&A 정보, 재무 데이터
- 직원 급여/연봉/인사 정보

### 2. 보안 위험 (security) → critical 또는 warning
- 소스코드 대량 외부 전송 시도 (critical)
- 내부 인프라 구조 상세 기술 (warning)
- 인증/권한 우회 방법 질의 (warning)

### 3. 컴플라이언스 위반 (compliance) → warning
- 경쟁사 기밀 분석 요청
- 저작권 침해 가능 콘텐츠 생성 요청
- 법적 조언을 AI에 의존하는 패턴

### 4. 비업무 사용 (non_work) → info
- 개인 용도 (게임, 여행, 쇼핑, 투자 등)
- 업무 시간 내 과도한 비업무 사용

### 5. 비용 이상 (cost_anomaly) → warning
- 단순 질문에 고비용 모델 사용 (GPT-4o, Claude Opus 등)
- 동일 질문 반복 (3회 이상 유사 프롬프트)
- 단일 프롬프트에 과도한 토큰 소비 (input > 3000)

## 판단 원칙

- **맥락 우선**: 단어 하나로 판단하지 말 것. "password"가 있어도 "비밀번호 정책을 설명해줘"는 safe.
- **의도 파악**: 코드 리뷰에서 보안 취약점을 찾는 건 safe. 취약점을 만드는 건 security.
- **과잉 탐지 방지**: 확실하지 않으면 safe로 판단. 오탐보다 미탐이 나음.
- **코드 내 하드코딩 구분**: 코드에 password="admin123"이 있으면 confidential. 변수명이 password인 건 safe.

## 출력 형식

반드시 JSON 배열로만 응답해. 설명 텍스트 없이 순수 JSON만.

[
  {
    "log_id": "원본 id",
    "risk_level": "critical|warning|info|safe",
    "category": "confidential|security|compliance|non_work|cost_anomaly|safe",
    "reason": "판단 근거 1줄 (한국어)",
    "coaching_hint": "개선 제안 1줄 (safe면 빈 문자열)"
  }
]
```

### 4-2. Softsquared 전용 (`orgs/org-softsquared/CLAUDE.md`)

템플릿을 기반으로 하되 아래 항목 추가:

```markdown
## 고객사 특이사항 — Softsquared Inc.

### 추가 기밀 키워드
- 프로젝트 코드명: "ThinkTrace", "Antigravity", "LucaPus", "불혹"
- 내부 도메인: *.softsquared.io, *.gridge.ai
- 고객사명 직접 언급: 코레일, Hybe, 현대, LG, 삼성 + 관련 프로젝트 내용

### 허용 예외 (safe 처리)
- AI 도구 사용 가이드/매뉴얼 작성 목적의 프롬프트
- 공개 API 문서 기반 코드 생성
- 오픈소스 라이브러리 사용법 질의

### 비용 기준
- 1인당 일일 한도: $5
- 단일 세션 한도: $2
- 이 한도 초과 시 cost_anomaly로 분류
```

---

## 5. 코칭 분석 파이프라인

### 5-1. `07-coaching-batch.sh`

위험 감지와 별도로, 주간/월간 단위로 사용자별 AI 활용 패턴을 분석하여 코칭 인사이트를 생성한다.

```bash
#!/bin/bash
# 사용법: ./07-coaching-batch.sh [orgId] [period: weekly|monthly]

ORG_DIR="$(dirname "$0")/../orgs/${1:?org ID 필수}"
PERIOD="${2:-weekly}"

# 사용자별 로그 요약 파일 생성 (01-export + 집계)
node scripts/prepare-coaching-data.ts --org "$1" --period "$PERIOD" \
  > "$ORG_DIR/coaching-input.jsonl"

cd "$ORG_DIR"
cat coaching-input.jsonl | claude --print \
  "첨부된 JSONL은 사용자별 AI 활용 요약 데이터야.
각 사용자에 대해 아래 형식으로 코칭 인사이트를 생성해줘.

types/log-classification.ts의 분류 체계를 참고해:
- SDLC 단계 분포 (requirements/design/implementation/testing/maintenance)
- 작업 의도 분포 (creation/refactoring/debugging/review/learning/planning)
- 프롬프트 구조 수준 (short/structured/role_based)
- 감지 플래그 (retry_loop/over_token/fire_fighting_mode)

JSON 배열로만 응답해:
[
  {
    \"user_id\": \"u-001\",
    \"user_name\": \"홍길동\",
    \"maturity_score\": 72,
    \"strengths\": [\"코드 생성 활용도 높음\", \"구조화된 프롬프트 사용\"],
    \"improvements\": [
      {
        \"title\": \"재질문 비율 개선\",
        \"current\": \"재질문 비율 38%\",
        \"suggestion\": \"프롬프트 앞에 배경/목표/제약조건을 명시하세요\",
        \"expected_impact\": \"재질문 50% 감소 예상\"
      }
    ],
    \"model_optimization\": {
      \"current_model\": \"claude-opus-4\",
      \"suggested_model\": \"claude-sonnet-4\",
      \"tasks\": \"문서 요약, 단순 코드 생성\",
      \"cost_saving\": \"60%\"
    },
    \"sdlc_insight\": \"implementation 82% 편중. testing/review 활용 확대 권장\"
  }
]" > "$ORG_DIR/coaching.jsonl"
```

### 5-2. 코칭 입력 데이터 준비 (`prepare-coaching-data.ts`)

```
사용자별로 아래 지표를 집계하여 JSONL 출력:

{
  "user_id": "u-001",
  "user_name": "홍길동",
  "team": "개발팀",
  "period": "2026-W15",
  "total_prompts": 47,
  "total_tokens": 125000,
  "total_cost_usd": 4.20,
  "models_used": {"claude-sonnet-4": 35, "claude-opus-4": 12},
  "channels": {"anthropic": 40, "extension": 7},
  "avg_prompt_length": 280,
  "retry_count": 8,
  "sessions": 12,
  "avg_session_depth": 3.9,
  "sample_prompts": ["앞 100자씩 5개"],
  "risk_alerts_count": {"critical": 0, "warning": 1, "info": 2}
}
```

---

## 6. 구현 순서

```
Phase 1 — 정규식 엔진 + Mock E2E (1일)
  ├── lib/regex-engine.ts
  ├── lib/log-loader.ts (Mock 모드)
  ├── scripts/01-export-logs.ts
  ├── scripts/02-regex-filter.ts
  ├── scripts/03-prepare-batch.ts
  ├── tests/regex-filter.test.ts
  └── 검증: MOCK_LOGS 입력 → 정규식 알림 + pending.jsonl 생성 확인

Phase 2 — CLAUDE.md + CLI 호출 (1일)
  ├── orgs/org-template/CLAUDE.md
  ├── orgs/org-softsquared/CLAUDE.md
  ├── scripts/04-claude-analyze.sh
  ├── scripts/05-parse-results.ts
  ├── tests/result-parser.test.ts
  └── 검증: pending.jsonl → Claude CLI → results.jsonl 파싱 성공

Phase 3 — 알림 변환 + 파이프라인 통합 (반일)
  ├── scripts/06-import-alerts.ts
  ├── scripts/run-full-pipeline.sh
  ├── tests/e2e-pipeline.test.ts
  └── 검증: run-full-pipeline.sh 1회 실행 → alerts.json 생성 확인

Phase 4 — 코칭 파이프라인 (반일)
  ├── scripts/prepare-coaching-data.ts
  ├── scripts/07-coaching-batch.sh
  ├── scripts/run-coaching-pipeline.sh
  └── 검증: coaching.jsonl 생성 확인

Phase 5 — 프론트엔드 연동 포인트 문서화 (선택)
  └── docs/sandbox-integration.md
      (alerts.json → 기존 security/page.tsx 연동 방법 기술)
```

---

## 7. 기존 코드베이스 참조 포인트

Claude Code가 작업할 때 반드시 참조해야 하는 기존 파일:

| 참조 파일 | 용도 |
|-----------|------|
| `types/risk.ts` | RiskRule, RiskAlert, RiskException 타입 — 출력 형식 준수 |
| `types/log.ts` | Log 타입 — 입력 형식 |
| `types/log-classification.ts` | 분류 체계 — 코칭 분석 시 참조 |
| `lib/mockData.ts` L1530~1599 | MOCK_RISK_RULES — 정규식 규칙 소스 |
| `lib/mockData.ts` L1590~1599 | MOCK_RISK_ALERTS — 출력 형식 참조 |
| `lib/mockData.ts` L1~200 | MOCK_LOGS, MOCK_ORGS, MOCK_USERS — 테스트 데이터 |
| `docs/backend-requirements.md` §8 | 보안 스캔 배치 기존 설계 — 호환성 유지 |
| `app/production/admin/security/page.tsx` | 프론트엔드 UI — 알림 데이터 구조 확인 |

---

## 8. CLI 환경 전제 조건

```bash
# Claude Code CLI 설치 확인
which claude  # /usr/local/bin/claude 또는 ~/.npm-global/bin/claude

# Max 구독 인증 상태 확인
claude --version

# Node.js
node --version  # >= 18

# 실행 권한
chmod +x sandbox/ai-analyzer/scripts/*.sh
```

---

## 9. 설정 파일 (`config/default.json`)

```json
{
  "source": "mock",
  "claude_cli_path": "claude",
  "claude_flags": "--print",

  "regex_filter": {
    "suspect_thresholds": {
      "input_tokens_min": 3000,
      "prompt_length_min": 2000,
      "code_block_lines_min": 100,
      "table_rows_min": 20,
      "email_pattern_min": 3,
      "number_pattern_min": 3
    }
  },

  "batch": {
    "max_logs_per_batch": 50,
    "prompt_preview_head": 500,
    "prompt_preview_tail": 200
  },

  "coaching": {
    "period": "weekly",
    "sample_prompts_count": 5,
    "sample_prompt_preview_length": 100
  }
}
```

---

## 10. 성공 기준

| # | 기준 | 검증 방법 |
|---|------|----------|
| 1 | MOCK_LOGS 20건 입력 → 정규식 알림 5건+ 생성 | `02-regex-filter.ts` 출력 확인 |
| 2 | 의심 로그 5건+ → pending.jsonl 생성 | `03-prepare-batch.ts` 출력 확인 |
| 3 | Claude CLI 호출 → 유효한 JSON 응답 | `05-parse-results.ts` 에러 0건 |
| 4 | results.jsonl → RiskAlert 형식 변환 성공 | `06-import-alerts.ts` 출력 확인 |
| 5 | 전체 파이프라인 1회 실행 60초 이내 완료 | `run-full-pipeline.sh` 타이밍 |
| 6 | 코칭 JSONL 생성, 사용자당 1개 인사이트 | `coaching.jsonl` 항목 수 확인 |
| 7 | 기존 production 코드 변경 0건 | `git diff app/ lib/ types/` 결과 없음 |

---

## 11. Claude Code에게 주는 최종 지시

```
이 PRD를 읽고 sandbox/ai-analyzer/ 디렉토리 내에서 작업해.

작업 순서:
1. PRD.md의 Phase 1부터 순서대로 진행
2. 각 Phase 완료 후 해당 테스트 실행하여 통과 확인
3. 기존 production 코드(app/, lib/, types/)는 절대 수정하지 마
4. 기존 타입과 Mock 데이터는 import해서 읽기 전용으로만 사용
5. 04-claude-analyze.sh는 실제 Claude CLI 호출이므로, 
   테스트 시에는 Mock 응답 파일로 대체하는 --dry-run 모드를 추가해
6. 모든 TypeScript는 tsconfig.json 설정을 따르되, 
   sandbox 전용 tsconfig.sandbox.json을 별도 생성해도 됨
7. package.json은 sandbox/ai-analyzer/package.json으로 독립 관리

완료 후 git status로 변경 파일 목록을 보여줘.
sandbox/ 외부 파일이 변경되었으면 즉시 되돌려.
```
