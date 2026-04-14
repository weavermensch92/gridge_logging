# Gridge Logging — 전역 규칙 & 프로젝트 개요

> 이 문서는 모든 기획 문서의 상위 컨텍스트입니다. **작업 시작 전 반드시 참조하세요.**

## 문서 구조

| 문서 | 범위 | 우선도 |
|------|------|--------|
| **이 문서** | 전역 규칙, 프로젝트 개요, 의사결정, 구현순서 | — |
| [01-foundation.md](./01-foundation.md) | Phase 1: 리팩토링 + API 스펙 + 인증/유저관리 | P0 |
| [02-core-features.md](./02-core-features.md) | Phase 2: 로그수집 + 보안 + 성숙도 + 파일공유 | P0~P1 |
| [03-quality.md](./03-quality.md) | Phase 3: 에러처리 + 상태관리 + 테스트 + 보안 | P1 |
| [04-operations.md](./04-operations.md) | Phase 4: 온프레미스 + CI/CD + 모니터링 + UX | P0~P1 |

---

## 프로젝트 개요

**프로젝트**: Gridge AI Usage Monitoring & Coaching Platform (Softsquared Inc.)
**현재 상태**: Next.js 16 + React 19 + TypeScript 기반 데모 프로토타입 (v0.1)
**목표**: Mock 데이터 기반 데모를 실제 데이터와 연동되는 프로덕션 모델로 전환

---

## 핵심 비즈니스 요구사항

1. **배포 방식**: 온프레미스 설치형 필수 대응 (고객사 서버에 DB + 솔루션 직접 설치)
2. **BM**: AI 비용 대납 모델 — 추가 과금 없이, 조직의 AI API 비용을 플랫폼이 대납
3. **관리자 권한**: 어드민이 유저에게 AI 사용 권한을 부여/회수하는 방식
4. **유저 관리**: 관리자 페이지에서 신규 유저 추가, 기존 유저 삭제/비활성화 가능해야 함
5. **백엔드**: 별도 개발자가 담당 — 프론트엔드에서는 API 스펙 문서만 정의

---

## 조직 계층 구조 & 역할

### 계층: Super Admin → Organization → Team → Member

```
Super Admin (그릿지 플랫폼 관리자)
└── Organization (기업) ← super_admin이 생성/삭제
    └── Admin (기업 관리자) ← super_admin이 지정
        ├── Team A (팀) ← admin이 생성/삭제
        │   ├── Team Lead (팀장) ← admin이 지정
        │   ├── Member 1
        │   └── Member 2
        └── Team B (팀)
            ├── Team Lead (팀장)
            └── Member 3
```

### 역할 정의

| 역할 | 범위 | 권한 |
|------|------|------|
| `super_admin` | **플랫폼 전체** | 기업(Organization) 생성/삭제, 기업별 admin 지정, 전체 현황 |
| `admin` | **소속 기업** | 팀 생성/삭제, 팀장 지정, 전체 유저 관리, AI 예산/보안 설정 |
| `team_lead` | **소속 팀** | 팀원 추가/삭제, AI 권한 토글, 팀 로그/성숙도/위험 로그 열람 |
| `member` | **본인** | 본인 로그 열람, 코칭 리포트 확인, 한도 연장 요청 |

### 프로덕션 라우트 (역할별)

| URL | 역할 | 내용 |
|-----|------|------|
| `/production/super-admin` | super_admin | 기업 목록, 기업 추가/삭제, admin 지정 |
| `/production/admin` | admin | 기업 대시보드 (통계+팀관리+로그+한도요청) |
| `/production/admin/users` | admin | 유저 관리 CRUD |
| `/production/admin/settings` | admin | AI 비용/예산 관리 |
| `/production/login` | 전체 | 로그인 → 역할별 자동 리다이렉트 |

### 멤버 온보딩 플로우 (신규 가입 시)

1. **관리자(admin)가 유저를 팀에 추가** → 이름, 이메일, 팀, AI 도구 선택
2. **임시 비밀번호 발급** (관리자가 직접 전달, SMTP 불필요)
3. **첫 로그인** → `onboarding_step: "password_change"` → 비밀번호 변경 강제
4. **도구 설치 안내** → `onboarding_step: "tool_install"` → 선택한 AI 도구별 설치 가이드:
   - ChatGPT → 그릿지 공유 계정 할당 안내
   - Claude/Gemini 웹 → Chrome Extension 설치 안내
   - Claude Code/Cursor → 로컬 프록시 인터셉터 설치 안내
5. **온보딩 완료** → `onboarding_step: "complete"` → AI 사용 활성화

---

## 개발 환경 & 브랜치 전략

- **개발 브랜치**: `claude/frontend-production-planning-YH9l8` (main에 직접 머지 X)
- **별도 서비스 환경**에서 진행 → 검증 완료 후 PR을 통해 main에 머지
- 기존 데모(main)는 그대로 유지하면서 프로덕션 코드를 병행 개발
- 프로덕션 페이지는 `/production/` 라우트 하위에 배치

---

## 현재 산출물 요약

| 파일 | 라인수 | 역할 |
|------|--------|------|
| `app/page.tsx` | 105 | 랜딩 (역할 선택) |
| `app/admin/page.tsx` | 1,798 | 어드민 대시보드 (로그/성숙도/파일/보안) |
| `app/developer/page.tsx` | 829 | 개발자 대시보드 (내 로그/에이전트 상세) |
| `app/developer/reports/page.tsx` | 300 | 코칭 리포트 목록 |
| `app/developer/report/page.tsx` | 690 | 상세 성숙도 리포트 |
| `lib/mockData.ts` | 1,672 | 전체 타입 정의 + Mock 데이터 |
| `app/production/login/page.tsx` | 138 | 프로덕션 로그인 |
| `app/production/admin/users/page.tsx` | 431 | 유저 관리 |
| `app/production/admin/settings/page.tsx` | 264 | AI 비용 관리 |
| **합계** | **~6,200+** | |

---

## 핵심 Gap 분석

- **백엔드 없음**: API Route 0개, DB 없음, 전부 하드코딩 Mock 데이터
- **인증 없음**: 로그인/세션/권한 없음, 유저 하드코딩
- **유저 관리 없음**: 유저 추가/삭제/권한 관리 페이지 미존재 → **/production/admin/users 생성 완료 (Mock)**
- **AI 비용 관리 없음**: 비용 대납 모델에 필요한 예산/한도 시스템 부재 → **/production/admin/settings 생성 완료 (Mock)**
- **온프레미스 배포 없음**: Docker, 셀프호스팅 설정 없음 → **Dockerfile 생성 완료**
- **테스트 없음**: 단위/통합/E2E 테스트 파일 0개
- **CI/CD 없음**: GitHub Actions 미구현
- **미들웨어 없음**: Next.js middleware 미구현
- **에러/로딩 처리 없음**: Error Boundary, Suspense, Skeleton 없음

---

## 기획 의사결정 완료 사항

| # | 질문 | 결정 |
|---|------|------|
| Q1 | AI 로그 수집 방식 | **혼합**: ChatGPT=공유계정, Claude/Gemini웹=Chrome Extension, Claude Code/Cursor=로컬 프록시 |
| Q2 | 지원 에이전트 도구 | **Claude Code + Cursor** |
| Q3 | 보안 감지 타이밍 | **배치** (node-cron, 10분~1시간 간격) |
| Q4 | 성숙도 평가 주기 | **월간 자동** (매월 1일 node-cron) |
| Q5 | 코칭 인사이트 LLM | **그릿지 제공 API로 LLM 자동 생성** (유저 API 아님) |
| Q6 | 파일 공유 우선순위 | **핵심 기능** (1차 배포 포함) |
| Q7 | 인맥맵 | **제거** (PeopleMap.tsx 삭제 완료) |
| Q8 | 유저 초대 방식 | **임시 비밀번호 발급** (SMTP 불필요, 관리자 직접 전달) |
| Q9 | AI 한도 초과 정책 | **즉시 차단 → 관리자 승인 후 연장** |
| Q10 | SSL 인증서 | **둘 다 지원** (고객 자체 인증서 + Let's Encrypt 폴백) |

---

## 권장 구현 순서

| 순서 | Phase | 핵심 내용 | 담당 | 우선도 |
|------|-------|----------|------|--------|
| 1 | 1-1 | 타입 분리, 컴포넌트 분해, 에러 바운더리, **인맥맵 제거** | FE | P0 |
| 2 | 1-2 | **API 스펙 문서 작성** + API 서비스 레이어 (Mock 모드) | FE+BE | P0 |
| 3 | 1-3 | **로그인 + 유저관리 UI + AI 비용 한도 UI + 한도 승인 UI** | FE | P0 |
| 4 | 2-1 | 로그 수집 관련 UI (유저 온보딩 플로우, AI 도구 등록) | FE | P0 |
| 5 | 2-4 | **파일 공유 UI** (업로드/다운로드/목록/메타데이터) | FE | P0 |
| 6 | 4-1 | **Dockerfile + standalone 설정** (Vercel 종속 제거) | FE | P0 |
| 7 | 2-2 | 보안 감지 규칙 관리 UI + 알림 대시보드 (API 연동) | FE | P0 |
| 8 | 3-4 | 테스트 (Vitest + Playwright) | FE | P0 |
| 9 | 2-3 | 성숙도 리포트 뷰 (API 연동) | FE | P1 |
| 10 | 3-3 | 성능 최적화 (코드 스플리팅, SSR, 가상 스크롤) | FE | P1 |
| 11 | 4-4 | UX/접근성 개선 | FE | P1 |

---

## 신규 개발 필요 파일

| 파일 | 설명 |
|------|------|
| `app/production/admin/users/page.tsx` | 유저 관리 CRUD (추가/삭제/권한/AI도구등록/한도승인) |
| `app/production/admin/settings/page.tsx` | 조직 설정, AI 예산 한도 관리 |
| `app/production/login/page.tsx` | 로그인 페이지 (첫 로그인 시 비밀번호 변경) |
| `middleware.ts` | 인증 라우트 보호 |
| `lib/api/` | API 서비스 레이어 (auth, users, logs, risk, reports, files, org) |
| `types/` | 타입 정의 (log, user, risk, report, file 등) |
| `docs/api-spec.md` | 백엔드 개발자용 API 스펙 문서 |

## 수정 필요 기존 파일

| 파일 | 작업 |
|------|------|
| `lib/mockData.ts` | 타입 추출 → `/types/` (완료), 목데이터 정리 |
| `app/admin/page.tsx` | 컴포넌트 분해 (완료), 인맥맵 탭 제거 (완료) |
| `app/developer/page.tsx` | 공유 컴포넌트로 리팩터링 |
| `app/layout.tsx` | `lang="ko"` 수정 (완료) |
| `next.config.ts` | `output: "standalone"` (완료) |

---

## 검증 방법

1. `docker build -t gridge . && docker run -p 3001:3001 gridge` → 전체 스택 기동 확인
2. `npm run build` 성공 확인
3. 유저 생성 → 로그인 → 역할별 페이지 접근 테스트
4. 관리자: 유저 추가 → AI 권한 부여 → 프록시 호출 확인
5. 보안 규칙 매칭 → 알림 생성 확인
6. AI 사용 한도 초과 → 차단/경고 동작 확인
7. `pnpm test` 전체 통과
