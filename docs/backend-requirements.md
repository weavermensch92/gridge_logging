# Gridge Logging — 백엔드 개발자 요구사항 명세서

> **최종 갱신**: 2026-04-11
> **프론트엔드 저장소**: `weavermensch92/gridge_logging`
> **연동 방법**: `.env`에서 `NEXT_PUBLIC_API_MODE=real`, `NEXT_PUBLIC_API_URL=<백엔드 URL>` 설정 시 프론트엔드가 실제 fetch 실행

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [역할 계층 & 권한](#2-역할-계층--권한)
3. [인증 플로우](#3-인증-플로우)
4. [DB 스키마](#4-db-스키마)
5. [API 엔드포인트 전체 명세](#5-api-엔드포인트-전체-명세)
6. [입력 검증 (Zod 스키마)](#6-입력-검증-zod-스키마)
7. [로그 수집 파이프라인](#7-로그-수집-파이프라인)
8. [보안 스캔 배치](#8-보안-스캔-배치)
9. [성숙도 평가 엔진](#9-성숙도-평가-엔진)
10. [인프라 & 환경변수](#10-인프라--환경변수)
11. [프론트엔드 연동 포인트](#11-프론트엔드-연동-포인트)

---

## 1. 프로젝트 개요

**Gridge**: 기업의 AI 사용 로그를 수집·분석하고, 개발자 성숙도를 코칭하는 온프레미스 플랫폼.

**핵심 BM**: AI 비용 대납 모델 — 기업이 별도 과금 없이 AI를 사용하고, 그릿지가 비용을 대납하며 사용 현황을 모니터링.

**배포 방식**: 고객사 서버에 직접 설치 (Docker Compose). 클라우드 BaaS 사용 불가.

**기술 스택 권장**:
- **서버**: Node.js + Express 또는 Fastify
- **DB**: PostgreSQL 15+
- **캐시/큐**: Redis 7 (세션 + Bull Queue)
- **ORM**: Prisma
- **파일 저장소**: 로컬 디스크 또는 MinIO (S3 호환)

---

## 2. 역할 계층 & 권한

```
Super Admin (그릿지 플랫폼 관리자)
└── Organization (기업) ← super_admin이 생성/삭제
    └── Admin (기업 관리자) ← super_admin이 지정
        └── Team (팀) ← admin이 생성/삭제
            ├── Team Lead (팀장) ← admin이 지정
            └── Member (멤버) ← admin/team_lead가 추가
```

| 역할 | 스코프 | 권한 |
|------|--------|------|
| `super_admin` | 플랫폼 전체 | 기업 CRUD, admin 지정, 플랫폼 운영 비용 열람 |
| `admin` | 소속 기업 | 팀 CRUD, 유저 전체 관리, 예산/보안/설정, 한도 승인, 팀장 지정 |
| `team_lead` | 소속 팀 | 팀원 추가/삭제, AI 권한 토글, 팀 로그/성숙도/위험 로그 열람 |
| `member` | 본인 | 본인 로그 열람, 코칭 리포트 확인, 한도 연장 요청 |

### team_lead 열람 권한 (admin이 설정에서 ON/OFF 가능)

| 권한 항목 | 기본값 |
|----------|--------|
| 팀 AI 로그 열람 | ON |
| 팀 성숙도 열람 | ON |
| 팀 위험 로그 열람 | ON |
| AI 권한 ON/OFF | ON |
| 팀원 비용 열람 | ON |
| 프롬프트 내용 열람 | **OFF** |
| 팀원 추가/삭제 | **OFF** |

---

## 3. 인증 플로우

### 로그인

```
POST /api/auth/login
  ├─ Zod 검증: email (valid email), password (min 6)
  ├─ DB: SELECT * FROM users WHERE email = ?
  ├─ bcrypt.compare(password, password_hash)
  ├─ 실패 → 401 { error: "INVALID_CREDENTIALS" }
  └─ 성공:
      ├─ JWT 생성 (payload: { user_id, role, org_id })
      ├─ Set-Cookie: gridge_session=<JWT> (HttpOnly, Secure, SameSite=Strict, Max-Age=86400)
      ├─ Set-Cookie: gridge_role=<role> (프론트 middleware에서 읽음)
      └─ Response: { user: User, token: string }
```

### 토큰 검증 (모든 API)

```
1. Cookie에서 gridge_session 추출
2. JWT verify (SESSION_SECRET)
3. payload에서 user_id 추출
4. DB에서 유저 조회 → status="active" 확인
5. 역할 기반 접근 제어 (RBAC)
```

### 첫 로그인 온보딩

```
1. 로그인 성공 → must_change_password=true
2. 프론트가 비밀번호 변경 페이지로 리다이렉트
3. POST /api/auth/change-password → must_change_password=false, onboarding_step="tool_install"
4. 프론트가 AI 도구 설치 안내 표시
5. 유저가 설치 완료 표시 → onboarding_step="complete"
6. ai_enabled=true로 활성화
```

---

## 4. DB 스키마

### organizations

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  ai_budget_usd DECIMAL(10,2) DEFAULT 0,
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  admin_id UUID,                       -- 기업 관리자 유저 ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### teams

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  lead_id UUID REFERENCES users(id),   -- 팀장 유저 ID
  ai_budget_usd DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),  -- NULL for super_admin
  team_id UUID REFERENCES teams(id),          -- NULL for admin/super_admin
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'member',          -- super_admin|admin|team_lead|member
  status VARCHAR(20) DEFAULT 'invited',       -- active|suspended|invited
  ai_enabled BOOLEAN DEFAULT false,
  ai_tools TEXT[] DEFAULT '{}',               -- chatgpt|claude_web|gemini_web|claude_code|cursor
  ai_quota_usd DECIMAL(10,2) DEFAULT 0,
  ai_used_usd DECIMAL(10,2) DEFAULT 0,
  must_change_password BOOLEAN DEFAULT true,
  onboarding_step VARCHAR(20) DEFAULT 'password_change',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_org ON users(org_id);
CREATE INDEX idx_users_team ON users(team_id);
```

### logs

```sql
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  channel VARCHAR(20) NOT NULL,               -- anthropic|openai|gemini|extension|crawler
  model VARCHAR(100) NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_usd DECIMAL(10,5) NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL,
  mode VARCHAR(10) DEFAULT 'chat',            -- chat|agent
  agent_detail JSONB,                         -- AgentDetail (NULL if chat)
  scanned_at TIMESTAMPTZ,                     -- NULL = 보안 미검사
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_user_time ON logs(user_id, created_at DESC);
CREATE INDEX idx_logs_channel ON logs(channel);
CREATE INDEX idx_logs_mode ON logs(mode);
CREATE INDEX idx_logs_unscanned ON logs(scanned_at) WHERE scanned_at IS NULL;
```

### risk_rules

```sql
CREATE TABLE risk_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  name VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  category VARCHAR(20) NOT NULL,              -- confidential|non_work|security|compliance|custom
  severity VARCHAR(20) NOT NULL,              -- info|warning|critical
  enabled BOOLEAN DEFAULT true,
  patterns TEXT[] NOT NULL,                   -- 정규식 패턴 배열
  match_field VARCHAR(10) DEFAULT 'both',     -- prompt|response|both
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### risk_alerts

```sql
CREATE TABLE risk_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES risk_rules(id),
  log_id UUID NOT NULL REFERENCES logs(id),
  severity VARCHAR(20) NOT NULL,
  matched_pattern TEXT NOT NULL,
  matched_text_preview TEXT,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_undismissed ON risk_alerts(severity) WHERE dismissed = false;
CREATE INDEX idx_alerts_log ON risk_alerts(log_id);
```

### risk_exceptions

```sql
CREATE TABLE risk_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  pattern TEXT NOT NULL,
  type VARCHAR(20) NOT NULL,                  -- role_based|content_based
  role_threshold VARCHAR(20),                 -- role_based일 때: team_lead|admin
  reason TEXT DEFAULT '',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### maturity_assessments

```sql
CREATE TABLE maturity_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  period VARCHAR(50) NOT NULL,
  level INTEGER NOT NULL,
  scores JSONB NOT NULL,
  coaching_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maturity_user ON maturity_assessments(user_id, period DESC);
```

### shared_files

```sql
CREATE TABLE shared_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  title VARCHAR(500) NOT NULL,
  file_type VARCHAR(10) NOT NULL,             -- PDF|XLSX|PPTX|DOCX|CSV
  size_mb DECIMAL(10,2),
  creator_id UUID NOT NULL REFERENCES users(id),
  shared_to VARCHAR(100) DEFAULT '전체',
  status VARCHAR(20) DEFAULT '공유중',        -- 공유중|초안|만료
  tags TEXT[] DEFAULT '{}',
  storage_key VARCHAR(500),
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### quota_requests

```sql
CREATE TABLE quota_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  requested_amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',       -- pending|approved|rejected
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### audit_logs

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id, created_at DESC);
```

### ingest_api_keys

```sql
CREATE TABLE ingest_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  channel VARCHAR(20),
  key_hash VARCHAR(64) NOT NULL,              -- SHA-256
  label VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### team_lead_permissions (기업별 팀장 권한 설정)

```sql
CREATE TABLE team_lead_permissions (
  org_id UUID PRIMARY KEY REFERENCES organizations(id),
  view_team_logs BOOLEAN DEFAULT true,
  view_team_maturity BOOLEAN DEFAULT true,
  view_team_security BOOLEAN DEFAULT true,
  manage_ai_toggle BOOLEAN DEFAULT true,
  view_member_cost BOOLEAN DEFAULT true,
  view_member_prompt BOOLEAN DEFAULT false,
  manage_member_add BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. API 엔드포인트 전체 명세

### 인증 (Public)

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| POST | `/api/auth/login` | 로그인 → JWT + 쿠키 | 없음 |
| POST | `/api/auth/change-password` | 비밀번호 변경 | 인증 |
| GET | `/api/auth/me` | 현재 유저 정보 | 인증 |
| POST | `/api/auth/logout` | 로그아웃 (쿠키 삭제) | 인증 |

### 기업 관리 (Super Admin)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/orgs` | 기업 목록 |
| POST | `/api/orgs` | 기업 생성 |
| DELETE | `/api/orgs/:id` | 기업 삭제 |
| PUT | `/api/orgs/:id/admin` | admin 지정 |

### 유저 관리 (Admin+)

| Method | Path | 설명 | Query |
|--------|------|------|-------|
| GET | `/api/users` | 유저 목록 | ?team_id=&status=&page=&limit= |
| POST | `/api/users` | 유저 추가 (임시 비밀번호) | |
| PUT | `/api/users/:id` | 유저 수정 (역할/팀/AI 권한) | |
| DELETE | `/api/users/:id` | 유저 비활성화 (soft delete) | |

### 팀 관리 (Admin+)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/teams` | 팀 목록 (멤버수/비용 집계 포함) |
| POST | `/api/teams` | 팀 생성 |
| PUT | `/api/teams/:id` | 팀 수정 |
| DELETE | `/api/teams/:id` | 팀 삭제 |

### 조직 설정 (Admin+)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/org/settings` | 조직 설정 |
| PUT | `/api/org/settings` | 조직 설정 변경 |
| GET | `/api/org/cost-summary` | 비용 현황 (팀별/유저별) |

### 한도 관리

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/quota-requests` | 한도 요청 목록 | Admin+ |
| POST | `/api/quota-requests` | 한도 연장 요청 | Member |
| PUT | `/api/quota-requests/:id` | 승인/거절 | Admin+ |

### 로그

| Method | Path | 설명 | Query |
|--------|------|------|-------|
| GET | `/api/logs` | 로그 조회 | ?team=&user_id=&channel=&mode=&from=&to=&page=&limit= |
| GET | `/api/logs/:id` | 로그 상세 (agent_detail 포함) | |
| GET | `/api/logs/stats` | 집계 통계 | 동일 필터 |
| POST | `/api/logs/ingest` | **벌크 로그 수집** (프록시/익스텐션) | API Key 인증 |

### 보안

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/risk-rules` | 규칙 목록 | Admin+ |
| POST | `/api/risk-rules` | 규칙 추가 | Admin+ |
| PUT | `/api/risk-rules/:id` | 규칙 수정 | Admin+ |
| DELETE | `/api/risk-rules/:id` | 규칙 삭제 | Admin+ |
| GET | `/api/risk-alerts` | 알림 목록 | 인증 |
| PUT | `/api/risk-alerts/:id/dismiss` | 알림 해제 | 인증 |
| GET | `/api/risk-exceptions` | 예외 목록 | Admin+ |
| POST | `/api/risk-exceptions` | 예외 등록 | Admin+ |
| DELETE | `/api/risk-exceptions/:id` | 예외 삭제 | Admin+ |

### 성숙도 & 리포트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/maturity/:userId` | 유저 현재 성숙도 |
| GET | `/api/reports` | 리포트 목록 |
| GET | `/api/reports/:id` | 리포트 상세 |

### 파일 공유

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/files` | 파일 목록 (?team=&status=) |
| POST | `/api/files/upload` | 파일 업로드 (multipart/form-data) |
| GET | `/api/files/:id/download` | 파일 다운로드 |
| PUT | `/api/files/:id` | 메타데이터 수정 |
| DELETE | `/api/files/:id` | 파일 삭제 |

### 감사 로그 (Super Admin)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/audit-logs` | 감사 로그 조회 (?actor_id=&action=&from=&to=) |

### 팀장 권한 설정 (Admin)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/org/team-lead-permissions` | 현재 권한 설정 조회 |
| PUT | `/api/org/team-lead-permissions` | 권한 설정 변경 |

---

## 6. 입력 검증 (Zod 스키마)

프론트엔드의 `lib/validations.ts`에 정의된 스키마. **백엔드에서도 동일한 검증을 적용**해야 합니다.

### loginSchema
```
email: string, email format
password: string, min 6
```

### createUserSchema
```
name: string, min 1, max 50
email: string, email format
team_id: string, required
role: enum ["member", "team_lead", "admin"]
ai_tools: array of enum ["chatgpt", "claude_web", "gemini_web", "claude_code", "cursor"]
temp_password: string, min 6
```

### riskRuleSchema
```
name: string, min 1
description: string, optional
category: enum ["confidential", "non_work", "security", "compliance", "custom"]
severity: enum ["info", "warning", "critical"]
match_field: enum ["prompt", "response", "both"]
patterns: array of string, min 1 item
```

### logIngestBulkSchema
```
logs: array (min 1, max 100) of:
  user_id: string
  channel: enum ["anthropic", "openai", "gemini", "extension", "crawler"]
  model: string
  prompt: string
  response: string
  input_tokens: integer, min 0
  output_tokens: integer, min 0
  cost_usd: number, min 0
  latency_ms: integer, min 0
  mode: optional enum ["chat", "agent"]
  agent_detail: optional object (AgentDetail 구조)
api_key: string, min 1
```

전체 스키마는 `lib/validations.ts` 참조.

---

## 7. 로그 수집 파이프라인

### 채널별 수집 방식

| AI 도구 | 수집 방식 | 채널값 | 비용 |
|---------|----------|--------|------|
| ChatGPT (웹) | 공유 계정 + OpenAI Admin API 폴링 (5분) | `openai` | 토큰 × 단가 |
| Claude (웹) | Chrome Extension (DOM 캡처) | `anthropic` | 0 (구독) |
| Gemini (웹) | Chrome Extension (DOM 캡처) | `gemini` | 0 (구독) |
| Claude Code | 로컬 프록시 (localhost:8080) | `anthropic` | 토큰 × 단가 |
| Cursor | 로컬 프록시 (localhost:8080) | `extension` | 토큰 × 단가 |

### Ingest API 처리 순서

```
1. API Key 인증 (ingest_api_keys 테이블)
2. Zod 스키마 검증 (logIngestBulkSchema)
3. Rate Limiting (100 req/min per API Key)
4. Bull Queue에 비동기 적재
5. 즉시 202 Accepted 반환
6. 워커:
   a. logs 테이블 INSERT
   b. users.ai_used_usd += cost_usd
   c. 한도 초과 체크 → 초과 시 ai_enabled=false + admin 알림
   d. scanned_at=NULL로 마킹 (보안 스캔 대기)
```

### 에이전트 모드 감지 (프록시 측)

```
연속 API 호출 간격 < 10초 + tool_result 포함 → agent 모드
→ 호출들을 session으로 묶어 AgentDetail 구조 생성
→ steps[]: phase(plan/execute/verify/iterate), tool_calls, description
→ files_changed[]: 변경된 파일 목록
→ code_artifacts[]: 생성된 코드 스니펫
```

### 토큰 단가 테이블

```json
{
  "claude-sonnet-4": { "input": 0.003, "output": 0.015 },
  "claude-haiku-4":  { "input": 0.0008, "output": 0.004 },
  "gpt-4o":          { "input": 0.005, "output": 0.015 },
  "gemini-1.5-pro":  { "input": 0.00125, "output": 0.005 }
}
```

---

## 8. 보안 스캔 배치

```
스케줄: node-cron, 10분 간격
대상: SELECT * FROM logs WHERE scanned_at IS NULL

처리:
1. risk_rules WHERE enabled=true 로드
2. 각 로그에 대해:
   a. match_field에 따라 prompt/response/both 선택
   b. 각 rule의 patterns[]에 대해 정규식 매칭
   c. 매칭 시:
      - risk_exceptions 확인 (content_based → 패스, role_based → 유저 역할 체크)
      - 예외 아니면 → risk_alerts INSERT
      - severity=critical → admin에게 즉시 알림
   d. logs.scanned_at = NOW() 업데이트
```

---

## 9. 성숙도 평가 엔진

```
스케줄: node-cron, 매월 1일
대상: 전월 로그가 있는 모든 유저

평가 축:
- Prompt Engineering 역량 (프롬프트 구조화 정도)
- Context Engineering 역량 (맥락 제공 수준)
- 효율성 (토큰/비용 최적화)
- 도구 활용도 (agent mode, tool calls 다양성)
- 코드 품질 기여도 (파일 변경 규모/품질)

코칭 코멘트:
- 그릿지 자체 AI API 키로 LLM 호출 (유저 API 아님)
- 유저 로그 요약 → LLM → 개인화된 코칭 코멘트 생성
- 실패 시 → 규칙 기반 템플릿 폴백

결과: maturity_assessments 테이블에 INSERT
```

---

## 10. 인프라 & 환경변수

### 필수 환경변수

```bash
# DB
DATABASE_URL=postgresql://user:pass@localhost:5432/gridge_db

# Redis
REDIS_URL=redis://localhost:6379

# 인증
SESSION_SECRET=<32자 이상 랜덤 시크릿>
SESSION_MAX_AGE=86400

# OpenAI (ChatGPT 폴링용)
OPENAI_ORG_ID=<org ID>
OPENAI_API_KEY=<admin API key>

# 파일 저장
STORAGE_TYPE=local
STORAGE_PATH=/var/gridge/uploads

# 보안
CORS_ORIGIN=http://localhost:3001
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# 스캔
SECURITY_SCAN_INTERVAL=600000

# 프론트엔드 연동
NEXT_PUBLIC_API_MODE=real
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Docker Compose (백엔드 담당)

```yaml
services:
  api:
    build: ./backend
    ports: ["4000:4000"]
    depends_on: [postgres, redis]
    env_file: .env

  postgres:
    image: postgres:15-alpine
    volumes: ["pgdata:/var/lib/postgresql/data"]
    environment:
      POSTGRES_DB: gridge_db
      POSTGRES_USER: gridge
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes: ["redisdata:/data"]

  frontend:
    build: .
    ports: ["3001:3001"]
    environment:
      NEXT_PUBLIC_API_MODE: real
      NEXT_PUBLIC_API_URL: http://api:4000

volumes:
  pgdata:
  redisdata:
```

---

## 11. 프론트엔드 연동 포인트

프론트엔드 `lib/api/` 디렉토리에 이미 구현된 API 클라이언트:

| 파일 | 메서드 | 엔드포인트 | 비고 |
|------|--------|-----------|------|
| `auth.ts` | `authApi.login()` | `POST /api/auth/login` | 쿠키 설정 필요 |
| `auth.ts` | `authApi.me()` | `GET /api/auth/me` | |
| `auth.ts` | `authApi.logout()` | `POST /api/auth/logout` | 쿠키 삭제 |
| `users.ts` | `usersApi.list()` | `GET /api/users` | ?team_id=&status= |
| `users.ts` | `usersApi.create()` | `POST /api/users` | |
| `users.ts` | `usersApi.update()` | `PUT /api/users/:id` | |
| `users.ts` | `usersApi.remove()` | `DELETE /api/users/:id` | |
| `teams.ts` | `teamsApi.list()` | `GET /api/teams` | member_count 집계 포함 |
| `teams.ts` | `teamsApi.create()` | `POST /api/teams` | |
| `org.ts` | `orgApi.listOrgs()` | `GET /api/orgs` | super_admin용 |
| `org.ts` | `orgApi.getSettings()` | `GET /api/org/settings` | |
| `org.ts` | `orgApi.getCostSummary()` | `GET /api/org/cost-summary` | |
| `org.ts` | `orgApi.getQuotaRequests()` | `GET /api/quota-requests` | |
| `logs.ts` | `logsApi.list()` | `GET /api/logs` | 필터 다수 |
| `logs.ts` | `logsApi.getById()` | `GET /api/logs/:id` | agent_detail 포함 |
| `logs.ts` | `logsApi.ingest()` | `POST /api/logs/ingest` | 벌크 수집 |
| `risk.ts` | `riskApi.listRules()` | `GET /api/risk-rules` | |
| `risk.ts` | `riskApi.listAlerts()` | `GET /api/risk-alerts` | |
| `risk.ts` | `riskApi.dismissAlert()` | `PUT /api/risk-alerts/:id/dismiss` | |
| `risk.ts` | `riskApi.createException()` | `POST /api/risk-exceptions` | |
| `files.ts` | `filesApi.list()` | `GET /api/files` | |
| `files.ts` | `filesApi.upload()` | `POST /api/files/upload` | multipart |
| `reports.ts` | `reportsApi.getMaturity()` | `GET /api/maturity/:userId` | |

**모든 API 클라이언트**는 `isMockMode()` 분기가 있어, `NEXT_PUBLIC_API_MODE=real`로 전환하면 자동으로 실제 fetch가 실행됩니다. Mock 코드를 수정할 필요 없습니다.

**응답 포맷**: 모든 API는 `{ data: T }` 또는 `{ error: { code: string, message: string } }` 형태.

**인증 전달**: `credentials: "include"` (쿠키 자동 전송). 백엔드는 `Set-Cookie` + CORS `Access-Control-Allow-Credentials: true` 설정 필요.
