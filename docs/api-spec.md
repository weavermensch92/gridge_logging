# Gridge Logging API Specification

> 백엔드 개발자를 위한 API 인터페이스 문서입니다.
> 프론트엔드는 이 스펙에 맞춰 개발되며, 백엔드 미완성 시 Mock 모드로 동작합니다.

## Base URL

```
{NEXT_PUBLIC_API_URL}/api
```

## 인증 방식

- 세션 기반 인증 (HttpOnly Cookie)
- 로그인 후 세션 토큰 발급
- 모든 API 요청에 쿠키 자동 포함

---

## 1. 인증 (Auth)

### POST /api/auth/login

이메일 + 비밀번호 로그인.

**Request Body:**
```json
{
  "email": "admin@softsquared.com",
  "password": "temp1234"
}
```

**Response 200:**
```json
{
  "user": {
    "id": "u-001",
    "name": "김태영",
    "email": "taeyoung@softsquared.com",
    "role": "admin",
    "team": "개발팀",
    "ai_enabled": true,
    "ai_tools": ["claude_code", "cursor"],
    "must_change_password": false
  },
  "token": "session-token-xxx"
}
```

**Response 401:**
```json
{ "error": "INVALID_CREDENTIALS", "message": "이메일 또는 비밀번호가 올바르지 않습니다." }
```

### POST /api/auth/change-password

비밀번호 변경 (첫 로그인 시 강제).

**Request Body:**
```json
{
  "current_password": "temp1234",
  "new_password": "NewSecure!123"
}
```

**Response 200:**
```json
{ "success": true }
```

### GET /api/auth/me

현재 로그인된 유저 정보.

**Response 200:**
```json
{
  "id": "u-001",
  "name": "김태영",
  "email": "taeyoung@softsquared.com",
  "role": "admin",
  "team": "개발팀",
  "ai_enabled": true,
  "ai_quota_usd": 100.00,
  "ai_used_usd": 42.50,
  "ai_tools": ["claude_code", "cursor"],
  "status": "active"
}
```

**Response 401:**
```json
{ "error": "UNAUTHORIZED", "message": "로그인이 필요합니다." }
```

### POST /api/auth/logout

세션 종료.

**Response 200:**
```json
{ "success": true }
```

---

## 2. 유저 관리 (Users) — admin 이상

### GET /api/users

유저 목록 조회.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| team | string | - | 팀 필터 |
| status | string | - | active, suspended, invited |
| page | number | 1 | 페이지 번호 |
| limit | number | 50 | 페이지 크기 |

**Response 200:**
```json
{
  "users": [
    {
      "id": "u-001",
      "name": "강지수",
      "email": "jisoo@softsquared.com",
      "team": "개발팀",
      "role": "member",
      "ai_enabled": true,
      "ai_quota_usd": 50.00,
      "ai_used_usd": 23.40,
      "ai_tools": ["claude_code", "cursor", "claude_web"],
      "status": "active",
      "created_at": "2024-03-10T00:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 50
}
```

### POST /api/users

신규 유저 추가.

**Request Body:**
```json
{
  "name": "홍길동",
  "email": "gildong@softsquared.com",
  "team": "개발팀",
  "role": "member",
  "ai_tools": ["chatgpt", "claude_web"],
  "temp_password": "TempPass!123"
}
```

**Response 201:**
```json
{
  "id": "u-006",
  "name": "홍길동",
  "email": "gildong@softsquared.com",
  "status": "invited",
  "must_change_password": true
}
```

### PUT /api/users/:id

유저 정보 수정.

**Request Body (partial update):**
```json
{
  "role": "admin",
  "ai_enabled": false,
  "team": "기획팀",
  "ai_tools": ["chatgpt"],
  "ai_quota_usd": 100.00
}
```

**Response 200:**
```json
{ "success": true, "user": { "id": "u-006", "...": "..." } }
```

### DELETE /api/users/:id

유저 비활성화 (soft delete, status -> suspended).

**Response 200:**
```json
{ "success": true }
```

---

## 3. 조직 설정 & AI 비용 (Org)

### GET /api/org/settings

조직 설정 조회.

**Response 200:**
```json
{
  "id": "org-001",
  "name": "Softsquared Inc.",
  "ai_budget_usd": 1000.00,
  "billing_cycle": "monthly",
  "billing_reset_day": 1
}
```

### PUT /api/org/settings

조직 설정 변경 (super_admin).

**Request Body:**
```json
{
  "ai_budget_usd": 1500.00,
  "billing_cycle": "monthly"
}
```

### GET /api/org/cost-summary

조직/팀/유저별 비용 현황.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| period | string | "current_month", "last_month", "custom" |
| from | string | ISO date (period=custom일 때) |
| to | string | ISO date (period=custom일 때) |

**Response 200:**
```json
{
  "total_budget_usd": 1000.00,
  "total_used_usd": 342.50,
  "by_team": [
    { "team": "개발팀", "used_usd": 210.30, "user_count": 3 },
    { "team": "디자인팀", "used_usd": 78.20, "user_count": 1 },
    { "team": "기획팀", "used_usd": 54.00, "user_count": 1 }
  ],
  "by_user": [
    { "user_id": "u-001", "name": "강지수", "team": "개발팀", "used_usd": 95.20, "quota_usd": 50.00 }
  ]
}
```

### GET /api/quota-requests

한도 연장 요청 목록 (admin).

**Response 200:**
```json
{
  "requests": [
    {
      "id": "qr-001",
      "user_id": "u-001",
      "user_name": "강지수",
      "requested_amount": 30.00,
      "current_quota": 50.00,
      "current_used": 48.50,
      "status": "pending",
      "created_at": "2026-04-08T14:00:00Z"
    }
  ]
}
```

### POST /api/quota-requests

한도 연장 요청 (member).

**Request Body:**
```json
{
  "requested_amount": 30.00,
  "reason": "이번 주 프로젝트 마감으로 추가 사용 필요"
}
```

### PUT /api/quota-requests/:id

승인/거절 (admin).

**Request Body:**
```json
{
  "status": "approved",
  "approved_amount": 25.00
}
```

---

## 4. 로그 (Logs)

### GET /api/logs

로그 조회 (페이지네이션, 필터).

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| team | string | 팀 필터 |
| user_id | string | 유저 필터 |
| channel | string | anthropic, openai, gemini, extension, crawler |
| model | string | 모델 필터 |
| mode | string | chat, agent |
| date_from | string | ISO date |
| date_to | string | ISO date |
| search | string | 프롬프트/유저명 검색 |
| page | number | 페이지 (default: 1) |
| limit | number | 페이지 크기 (default: 20) |
| sort | string | timestamp_desc (default), cost_desc |

**Response 200:**
```json
{
  "logs": [
    {
      "id": "log-001",
      "user_id": "u-001",
      "user_name": "강지수",
      "team": "개발팀",
      "channel": "anthropic",
      "model": "claude-sonnet-4",
      "prompt": "...",
      "response": "...",
      "input_tokens": 312,
      "output_tokens": 890,
      "cost_usd": 6.83,
      "latency_ms": 1823,
      "mode": "chat",
      "timestamp": "2025-12-01T09:12:00Z"
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 20
}
```

### GET /api/logs/:id

로그 상세 (agent_detail 포함).

**Response 200:**
```json
{
  "id": "log-050",
  "...": "...",
  "mode": "agent",
  "agent_detail": {
    "session_id": "sess-xxx",
    "session_duration_ms": 45000,
    "total_steps": 4,
    "total_tool_calls": 12,
    "files_changed": [...],
    "steps": [...],
    "code_artifacts": [...],
    "summary": "..."
  }
}
```

### GET /api/logs/stats

대시보드 집계 통계.

**Query Parameters:** (동일한 필터 지원)

**Response 200:**
```json
{
  "total_logs": 120,
  "total_cost_usd": 342.50,
  "active_users": 5,
  "avg_latency_ms": 1650,
  "by_channel": { "anthropic": 45, "openai": 30, "gemini": 15, "extension": 20, "crawler": 10 },
  "by_model": { "claude-sonnet-4": 40, "gpt-4o": 25, "claude-haiku": 15, "...": "..." }
}
```

### POST /api/logs/ingest

로그 벌크 수집 (프록시/익스텐션에서 호출).

**Headers:**
- `X-API-Key: <user-api-key>` 또는 `X-Channel-Key: <channel-key>`

**Request Body:**
```json
{
  "logs": [
    {
      "channel": "anthropic",
      "model": "claude-sonnet-4",
      "prompt": "...",
      "response": "...",
      "input_tokens": 312,
      "output_tokens": 890,
      "cost_usd": 6.83,
      "latency_ms": 1823,
      "mode": "agent",
      "agent_detail": { "...": "..." },
      "timestamp": "2025-12-01T09:12:00Z"
    }
  ]
}
```

**Response 201:**
```json
{ "ingested": 1, "errors": [] }
```

---

## 5. 보안 (Risk)

### GET /api/risk-rules

보안 규칙 목록.

**Response 200:**
```json
{
  "rules": [
    {
      "id": "rule-001",
      "name": "API 키 노출 감지",
      "description": "...",
      "category": "confidential",
      "severity": "critical",
      "enabled": true,
      "patterns": ["sk-proj-", "sk-ant-", "AKIA"],
      "match_field": "prompt",
      "created_at": "2026-03-01T00:00:00Z",
      "updated_at": "2026-03-15T00:00:00Z"
    }
  ]
}
```

### POST /api/risk-rules

규칙 추가.

### PUT /api/risk-rules/:id

규칙 수정 (활성/비활성 토글 포함).

### DELETE /api/risk-rules/:id

규칙 삭제.

### GET /api/risk-alerts

알림 목록.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| severity | string | critical, warning, info |
| dismissed | boolean | true/false |
| page | number | 페이지 |
| limit | number | 페이지 크기 |

**Response 200:**
```json
{
  "alerts": [
    {
      "id": "alert-001",
      "rule_id": "rule-001",
      "log_id": "log-050",
      "severity": "critical",
      "matched_pattern": "sk-proj-",
      "matched_text_preview": "...sk-proj-abc123...",
      "timestamp": "2026-03-25T10:00:00Z",
      "dismissed": false
    }
  ],
  "total": 40
}
```

### PUT /api/risk-alerts/:id/dismiss

알림 해제.

**Response 200:**
```json
{ "success": true }
```

---

## 6. 성숙도 & 리포트 (Maturity/Reports)

### GET /api/maturity/:userId

유저 현재 성숙도.

**Response 200:**
```json
{
  "user_id": "u-001",
  "level": 3,
  "level_label": "Architect",
  "scores": {
    "prompt_quality": 78,
    "context": 85,
    "validation": 62,
    "strategy": 70,
    "reuse": 55
  },
  "coaching_comment": "컨텍스트 엔지니어링이 뛰어나지만, 검증 단계 강화가 필요합니다."
}
```

### GET /api/reports

리포트 목록.

**Response 200:**
```json
{
  "reports": [
    {
      "id": "report-001",
      "seq": 1,
      "date": "2025.10.25",
      "period": "2025.10.01 ~ 10.31",
      "level": "Lv.1~2",
      "level_label": "Reviewer",
      "has_detail": true
    }
  ]
}
```

### GET /api/reports/:id

리포트 상세.

---

## 7. 파일 공유 (Files)

### GET /api/files

파일 목록.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| team | string | 팀 필터 |
| status | string | 공유중, 초안, 만료 |
| file_type | string | PDF, XLSX, PPTX, DOCX, CSV |
| search | string | 파일명 검색 |
| page | number | 페이지 |
| limit | number | 페이지 크기 |

### POST /api/files/upload

파일 업로드 (multipart/form-data).

**Form Fields:**
- `file`: 파일 바이너리
- `title`: 파일 제목
- `shared_to`: 공유 대상 (전체, 개발팀, 기획팀, ...)
- `tags`: 태그 (JSON array)

**Response 201:**
```json
{
  "id": "file-020",
  "title": "...",
  "file_type": "PDF",
  "size_mb": 2.1,
  "status": "공유중"
}
```

### GET /api/files/:id/download

파일 다운로드 (바이너리 스트림).

### PUT /api/files/:id

파일 메타데이터 수정.

### DELETE /api/files/:id

파일 삭제.

---

## 8. 감사 로그 (Audit Logs) — super_admin

### GET /api/audit-logs

감사 로그 조회.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| actor_id | string | 행위자 필터 |
| action | string | user_created, user_updated, quota_approved, ... |
| date_from | string | ISO date |
| date_to | string | ISO date |
| page | number | 페이지 |
| limit | number | 페이지 크기 |

**Response 200:**
```json
{
  "logs": [
    {
      "id": "audit-001",
      "actor_id": "u-005",
      "actor_name": "김태영",
      "action": "user_created",
      "target_type": "user",
      "target_id": "u-006",
      "details": { "name": "홍길동", "team": "개발팀" },
      "timestamp": "2026-04-08T10:00:00Z"
    }
  ],
  "total": 50
}
```

---

## 에러 응답 형식

모든 에러는 동일한 형식을 따릅니다:

```json
{
  "error": "ERROR_CODE",
  "message": "사용자에게 표시할 메시지"
}
```

**공통 에러 코드:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | 미인증 |
| FORBIDDEN | 403 | 권한 부족 |
| NOT_FOUND | 404 | 리소스 없음 |
| VALIDATION_ERROR | 422 | 입력 검증 실패 |
| QUOTA_EXCEEDED | 429 | AI 사용 한도 초과 |
| INTERNAL_ERROR | 500 | 서버 내부 오류 |

---

## DB 스키마 설계안

백엔드 개발자가 참고할 DB 테이블 구조입니다.

```sql
-- 조직
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  ai_budget_usd DECIMAL(10,2) DEFAULT 0,
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  billing_reset_day INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 팀
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  name VARCHAR(100) NOT NULL
);

-- 유저
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  team_id UUID REFERENCES teams(id),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'member', -- super_admin, admin, member
  ai_enabled BOOLEAN DEFAULT false,
  ai_quota_usd DECIMAL(10,2) DEFAULT 0,
  ai_used_usd DECIMAL(10,2) DEFAULT 0,
  ai_tools TEXT[] DEFAULT '{}', -- chatgpt, claude_web, gemini_web, claude_code, cursor
  status VARCHAR(20) DEFAULT 'invited', -- active, suspended, invited
  must_change_password BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 로그
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  channel VARCHAR(20) NOT NULL,
  model VARCHAR(100) NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  input_tokens INT NOT NULL,
  output_tokens INT NOT NULL,
  cost_usd DECIMAL(10,5) NOT NULL,
  latency_ms INT NOT NULL,
  mode VARCHAR(10) DEFAULT 'chat', -- chat, agent
  agent_detail JSONB,
  scanned_at TIMESTAMPTZ, -- 보안 스캔 완료 시각
  timestamp TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_logs_user_time ON logs(user_id, timestamp DESC);
CREATE INDEX idx_logs_channel ON logs(channel);
CREATE INDEX idx_logs_scanned ON logs(scanned_at) WHERE scanned_at IS NULL;

-- 보안 규칙
CREATE TABLE risk_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(20) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  patterns TEXT[] NOT NULL,
  match_field VARCHAR(10) DEFAULT 'prompt',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 보안 알림
CREATE TABLE risk_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES risk_rules(id),
  log_id UUID REFERENCES logs(id),
  severity VARCHAR(20) NOT NULL,
  matched_pattern TEXT NOT NULL,
  matched_text_preview TEXT,
  dismissed BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_severity ON risk_alerts(severity) WHERE dismissed = false;

-- 성숙도 평가
CREATE TABLE maturity_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  period VARCHAR(50) NOT NULL,
  level INT NOT NULL,
  scores JSONB NOT NULL,
  coaching_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 공유 파일
CREATE TABLE shared_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  title VARCHAR(500) NOT NULL,
  file_type VARCHAR(10) NOT NULL,
  size_mb DECIMAL(10,2),
  creator_id UUID REFERENCES users(id),
  shared_to VARCHAR(100) DEFAULT '전체',
  status VARCHAR(20) DEFAULT '공유중',
  tags TEXT[] DEFAULT '{}',
  storage_key VARCHAR(500), -- MinIO/로컬 스토리지 경로
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INT DEFAULT 0,
  download_count INT DEFAULT 0,
  comment_count INT DEFAULT 0
);

-- 감사 로그
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id, timestamp DESC);

-- 한도 연장 요청
CREATE TABLE quota_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  requested_amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  approved_amount DECIMAL(10,2),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
