# Phase 1: 기반 구조 (Foundation) — P0 필수

> 전역 규칙: [00-global.md](./00-global.md) 참조
> 이 문서 범위: Phase 1 — 리팩토링 + API 스펙 + 인증/유저관리

---

## 1-1. 코드 아키텍처 리팩토링

**문제**: admin/page.tsx (1,798줄), developer/page.tsx (829줄) 모놀리식 파일
**목표**: 유지보수/테스트 가능한 컴포넌트 구조

- [ ] **타입 분리**: `lib/mockData.ts`에서 타입 정의를 `types/` 디렉토리로 분리
  - `types/log.ts` — Log, AgentDetail, AgentStep, ToolCall, FileChange
  - `types/risk.ts` — RiskRule, RiskAlert, RiskSeverity, RiskCategory
  - `types/user.ts` — User, Team, Organization
  - `types/report.ts` — ReportSummary, MaturityData
  - `types/file.ts` — SharedFile, FileType, FileStatus
  - ~~`types/network.ts`~~ — 인맥맵 제거로 불필요

- [ ] **공통 컴포넌트 추출**: `components/` 디렉토리 생성
  - `components/ui/` — Glass Card, Badge, StatusDot, Modal, Pagination, DateRangeFilter
  - `components/charts/` — RadarChart wrapper, TrendLineChart, PieChart wrapper
  - `components/layout/` — PageHeader, Sidebar, TabNavigation
  - `components/log/` — LogTable, LogRow, AgentDetailPanel, ToolCallTimeline
  - `components/risk/` — RiskAlertCard, RiskRuleEditor, SeverityBadge

- [ ] **Admin 페이지 분해**: 현재 탭별로 단일 파일 → 각 탭을 별도 컴포넌트로
  - `app/admin/components/LogsTab.tsx`
  - `app/admin/components/MaturityTab.tsx`
  - `app/admin/components/FilesTab.tsx`
  - `app/admin/components/SecurityTab.tsx`

- [ ] **Developer 페이지 분해**:
  - `app/developer/components/StatsCards.tsx`
  - `app/developer/components/LogViewer.tsx`
  - `app/developer/components/CoachingSection.tsx`

---

## 1-2. 백엔드 API 인터페이스 정의 (백엔드 개발자에게 전달용)

> **참고**: 백엔드는 별도 개발자가 구현. 프론트엔드 팀은 API 스펙만 정의하고, 해당 스펙에 맞춰 프론트를 개발한다.
> 상세 API 스펙: [docs/api-spec.md](../api-spec.md) 참조

**기술 스택 권장** (백엔드 개발자 참고):

| 항목 | 권장 | 이유 |
|------|------|------|
| DB | **PostgreSQL** (온프레미스 직접 설치) | 클라우드 BaaS 사용 불가 |
| ORM | **Prisma** | 마이그레이션 성숙, TypeScript 친화 |
| 캐시 | **Redis** (온프레미스 설치) | 세션 + 집계 캐시 |

- [ ] **DB 스키마 설계안** (백엔드 개발자에게 전달):
  - `organizations` (id, name, **ai_budget_usd**, **billing_cycle**, created_at)
  - `teams` (id, org_id, name)
  - `users` (id, org_id, team_id, name, email, **password_hash**, role, **ai_enabled**, **ai_quota_usd**, **ai_used_usd**, **status**[active|suspended|invited], **ai_tools**[chatgpt|claude_web|gemini_web|claude_code|cursor], created_at)
  - `logs` (id, user_id, channel, model, prompt, response, input_tokens, output_tokens, cost_usd, latency_ms, mode, agent_detail:**JSONB**, scanned_at, timestamp)
  - `risk_rules` (id, org_id, name, category, severity, enabled, patterns[], match_field)
  - `risk_alerts` (id, rule_id, log_id, severity, matched_pattern, dismissed)
  - `maturity_assessments` (id, user_id, period, level, scores:**JSONB**, coaching_comment, created_at)
  - `shared_files` (id, org_id, title, file_type, creator_id, status, tags[], storage_key)
  - `audit_logs` (id, actor_id, action, target_type, target_id, details:**JSONB**, timestamp)
  - `quota_requests` (id, user_id, requested_amount, status[pending|approved|rejected], approved_by, created_at)

- [ ] **API 엔드포인트 스펙 요약**:

  | 도메인 | 엔드포인트 | 설명 |
  |--------|-----------|------|
  | 인증 | `POST /api/auth/login` | 로그인 → 세션 토큰 |
  | 인증 | `POST /api/auth/change-password` | 비밀번호 변경 |
  | 인증 | `GET /api/auth/me` | 현재 유저 정보 |
  | 유저 | `GET/POST /api/users` | 유저 목록/추가 |
  | 유저 | `PUT/DELETE /api/users/:id` | 유저 수정/비활성화 |
  | 비용 | `GET/PUT /api/org/settings` | 조직 설정 |
  | 비용 | `GET /api/org/cost-summary` | 비용 현황 |
  | 비용 | `GET/POST/PUT /api/quota-requests` | 한도 연장 요청 |
  | 로그 | `GET /api/logs`, `GET /api/logs/:id` | 로그 조회 |
  | 로그 | `GET /api/logs/stats` | 대시보드 집계 |
  | 로그 | `POST /api/logs/ingest` | 로그 수집 |
  | 보안 | `GET/POST/PUT/DELETE /api/risk-rules` | 규칙 CRUD |
  | 보안 | `GET /api/risk-alerts` | 알림 목록 |
  | 리포트 | `GET /api/maturity/:userId` | 성숙도 |
  | 리포트 | `GET /api/reports` | 리포트 목록 |
  | 파일 | `GET/POST/PUT/DELETE /api/files` | 파일 CRUD |
  | 감사 | `GET /api/audit-logs` | 감사 로그 |

- [ ] **프론트엔드 API 서비스 레이어 구현** (`lib/api/`):
  - `lib/api/client.ts` — fetch wrapper (base URL, auth header, error handling)
  - `lib/api/auth.ts`, `lib/api/users.ts`, `lib/api/logs.ts`, `lib/api/risk.ts`, `lib/api/reports.ts`, `lib/api/files.ts`, `lib/api/org.ts`
  - **Mock 모드 지원**: `NEXT_PUBLIC_API_MODE=mock|real`로 스위칭

---

## 1-3. 인증 & 권한 & 유저 관리 (프론트엔드 구현 범위)

- [ ] **로그인 페이지** (`app/production/login/page.tsx`):
  - 이메일 + 비밀번호 폼
  - 첫 로그인 감지 → 비밀번호 변경 페이지로 리다이렉트
  - `POST /api/auth/login` 호출 → 세션 토큰 저장

- [ ] **인증 상태 관리**:
  - 세션 토큰을 HttpOnly Cookie 또는 Authorization header로 관리
  - `GET /api/auth/me`로 현재 유저 정보 fetch
  - `middleware.ts` 추가: 미인증 → `/production/login` 리다이렉트
  - 인증 컨텍스트 (`AuthProvider`) → 유저 정보/역할을 앱 전체에서 접근

- [ ] **역할 기반 접근 제어 (RBAC)**:

  | 역할 | 권한 |
  |------|------|
  | `super_admin` | 조직 설정, AI 예산 총괄, 관리자 지정 |
  | `admin` | **유저 추가/삭제**, 권한 부여/회수, 팀 로그 열람, 보안 규칙 관리 |
  | `member` | 본인 로그 열람, 코칭 리포트 확인 |

- [ ] **유저 관리 페이지** (`app/production/admin/users/page.tsx`):
  - 유저 목록 테이블: 이름, 팀, 역할, AI 사용 상태, 비용 한도/사용량, 등록된 AI 도구 종류
  - **신규 유저 추가 플로우**: 이름/이메일/팀 → AI 도구 선택 → 임시 비밀번호 발급
  - 유저 비활성화/삭제, 역할 변경, AI 사용 권한 토글, 팀 배정/변경

- [ ] **AI 비용 관리 페이지** (`app/production/admin/settings/page.tsx`):
  - 조직 전체 AI 월예산 설정
  - 유저별 개인 AI 사용 한도 설정
  - 비용 현황 대시보드: 조직 전체 / 팀별 / 유저별 AI 비용 추이

- [ ] **AI 비용 대납 모델**:
  - AI API 프록시가 **조직의 API 키**를 사용하여 호출 대행
  - 한도 초과 시 → 즉시 차단 → 관리자 승인 후 연장
  - 월 초 비용 리셋 (billing_cycle 기반)

- [ ] **온프레미스 멀티테넌시**: 고객사당 1 인스턴스 = 단일 조직
  - DB에 org_id는 유지하되, 현실적으로 1:1 매핑
