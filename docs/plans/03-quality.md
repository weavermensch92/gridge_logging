# Phase 3: 품질 & 안정성 (Quality) — P1

> 전역 규칙: [00-global.md](./00-global.md) 참조
> 이 문서 범위: Phase 3 — 에러처리 + 상태관리 + 성능최적화 + 테스트 + 보안강화

---

## 3-1. 에러 처리 & 로딩 상태

- [ ] Next.js Error Boundary (`error.tsx`) 각 라우트에 추가
- [ ] Loading UI (`loading.tsx`) 각 라우트에 추가
- [ ] Suspense + Skeleton UI 패턴 적용
- [ ] API 호출 실패 시 사용자 친화적 에러 메시지
- [ ] Toast/Notification 시스템 도입

---

## 3-2. 상태 관리 고도화

- [ ] 서버 상태: **TanStack Query (React Query)** 도입
  - 로그 목록 캐싱, 자동 재검증
  - Optimistic Updates (알림 dismiss 등)
  - Infinite scroll / cursor-based pagination
- [ ] 클라이언트 상태: 필터/UI 상태는 URL searchParams 활용
  - 필터 상태를 URL에 반영 → 공유/북마크 가능
- [ ] 전역 상태 (필요 시): Zustand (유저 세션, 테마 등 최소한만)

---

## 3-3. 성능 최적화

- [ ] **SSR/SSG 전략 재설계**:
  - 현재 모든 페이지가 `"use client"` → 서버 컴포넌트 활용 가능 부분 분리
  - 대시보드 집계 데이터 → Server Component로 초기 렌더
  - 인터랙티브 부분 (필터, 모달) → Client Component로 유지
- [ ] **코드 스플리팅**:
  - Recharts 컴포넌트 → dynamic import
  - Admin 탭별 lazy loading
- [ ] **DB 쿼리 최적화** (백엔드 전달 사항):
  - `logs` 테이블 인덱스: (user_id, timestamp), (team, timestamp), (channel), (mode)
  - Cursor-based pagination (현재 offset 기반 → 대량 데이터 시 비효율)
  - 집계 쿼리 캐싱 (Redis)
- [ ] **대량 데이터 대응**:
  - 로그가 수만~수십만 건일 때 테이블 가상화 (react-window 또는 TanStack Virtual)
  - 차트 데이터 서버 사이드 집계 (클라이언트에서 raw 데이터 처리 X)

---

## 3-4. 테스트

- [ ] **테스트 프레임워크 셋업**: Vitest + React Testing Library + Playwright
- [ ] **단위 테스트**: 유틸리티 함수, 타입 가드, 점수 계산 로직
- [ ] **컴포넌트 테스트**: 핵심 UI 컴포넌트 (LogTable, RiskAlertCard, RadarChart)
- [ ] **API 통합 테스트**: 각 엔드포인트 CRUD 검증
- [ ] **E2E 테스트**: 로그인 → 대시보드 → 로그 조회 → 필터 → 상세 보기 흐름

---

## 3-5. 보안 강화

- [ ] 환경 변수 관리 (`.env.local`, `.env.production`)
  - DB 접속 정보, AI API 키, Auth Secret
- [ ] 입력 검증: Zod 스키마로 모든 API 입력 검증
- [ ] CORS 설정 (API Routes)
- [ ] Rate Limiting (로그 수집 API, 로그인 시도)
- [ ] XSS 방지: prompt/response 텍스트 렌더링 시 sanitize
- [ ] SQL Injection 방지: ORM 사용으로 기본 방어, raw query 지양
