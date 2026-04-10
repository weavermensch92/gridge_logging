# Phase 2: 핵심 기능 실동작 (Core Features) — P0~P1

> 전역 규칙: [00-global.md](./00-global.md) 참조
> 이 문서 범위: Phase 2 — 로그수집 + 보안감지 + 성숙도코칭 + 파일공유

---

## 2-1. 로그 수집 파이프라인 (가장 중요)

**결정사항**: 혼합 방식 (프록시 + SDK + 익스텐션)
**지원 도구**: Claude Code + Cursor (에이전트), ChatGPT/Claude/Gemini (웹)

### 채널별 수집 전략 (확정)

| AI 도구 | 수집 방식 | 채널값 | 구현 내용 |
|---------|----------|--------|----------|
| **ChatGPT (웹)** | 팀 스페이스 공유 계정 → 사용 내역 수집 | `openai` | 공유 계정 관리 + API 폴링 |
| **Claude (웹)** | Chrome Extension 로그 인터셉트 | `anthropic` | 익스텐션 → `/api/logs/ingest` |
| **Gemini (웹)** | Chrome Extension 로그 인터셉트 | `gemini` | 익스텐션 → `/api/logs/ingest` |
| **Claude Code** | 로컬 프록시 인터셉트 | `anthropic` | 프록시 → 자동 로깅 |
| **Cursor API** | 로컬 프록시 인터셉트 | `extension` | 프록시 → 자동 로깅 |

### 유저 온보딩 플로우

1. 관리자가 유저 추가 (이름, 이메일, 팀 배정)
2. 유저별 **활용 중인 AI 계정 종류 등록** (복수 선택)
3. AI 종류에 따라 수집 방법 자동 안내:
   - ChatGPT → 공유 계정 할당
   - Claude/Gemini 웹 → Chrome Extension 설치 안내
   - Claude Code/Cursor → 로컬 프록시 인터셉터 설치 안내
4. 임시 비밀번호 발급 (관리자가 직접 전달)
5. 첫 로그인 시 비밀번호 변경 강제

### 로그 수집 API 설계

- [ ] `POST /api/logs/ingest` — 벌크 로그 수입 (익스텐션/프록시 공통)
- [ ] API Key 인증 (유저별 또는 채널별)
- [ ] 입력 검증 (Zod 스키마)
- [ ] Rate limiting

### 에이전트 모드 로그 수집 (Claude Code + Cursor)

- [ ] 로컬 프록시가 AgentDetail 구조 (session, steps, tool_calls, file_changes) 캡처
- [ ] Claude Code: 세션 로그 파싱 (plan→execute→verify→iterate 단계)
- [ ] Cursor: Composer 세션 로그 파싱 (각 도구 고유 포맷 → 공통 포맷 변환)

### Chrome Extension 개발 범위

- [ ] Claude.ai / Gemini 웹 UI에서 프롬프트/응답 캡처
- [ ] 캡처 데이터 → Gridge 서버 `/api/logs/ingest`로 전송
- [ ] 유저 인증 토큰 포함
- [ ] 민감정보 마스킹 옵션 (로컬에서 사전 필터링)

---

## 2-2. 보안 감지 엔진 실동작

**현재**: 하드코딩된 8개 규칙 + 40개 알림
**목표**: 배치 기반 주기적 패턴 매칭 엔진

- [ ] **배치 스캔 엔진**:
  - **node-cron** 으로 10분~1시간 간격 스캔 (온프레미스, Vercel Cron X)
  - 미검사 로그(`scanned_at IS NULL`)를 대상으로 정규식 패턴 매칭
  - match_field ("prompt" | "response" | "both") 지원
  - 매칭 결과 → `risk_alerts` 테이블에 자동 저장
  - 심각도별 분류 (critical → 관리자 즉시 알림)

- [ ] **관리자 규칙 편집 UI 실동작**:
  - 현재 UI에 규칙 CRUD 모달 존재 → API 연동
  - 정규식 패턴 유효성 검증
  - 규칙 활성/비활성 토글

---

## 2-3. 성숙도 코칭 시스템 실동작

**현재**: 하드코딩된 리포트 데이터 (Lv.1~4)
**목표**: 실제 사용 데이터 기반 자동 평가

- [ ] **성숙도 평가 알고리즘 설계**:
  - 평가 축: Prompt Engineering, Context Engineering, 효율성, 도구 활용도, 코드 품질 기여도
  - 각 축의 점수 산출 공식 정의 필요

- [ ] **리포트 자동 생성** (월간 자동):
  - **node-cron**으로 매월 1일 자동 실행
  - 이전 한 달간 로그 집계 → 점수 계산 → `maturity_assessments` 저장

- [ ] **코칭 인사이트 엔진** (LLM 자동 생성):
  - **그릿지 자체 AI API 키**로 LLM 호출 (유저 API 아님)
  - 유저 로그 요약 → 개인화된 코칭 코멘트 생성
  - LLM 호출 실패 시 → 규칙 기반 템플릿 폴백

---

## 2-4. 파일 공유 시스템 (핵심 기능, 1차 배포 포함)

- [ ] **파일 스토리지**: 온프레미스 로컬 디스크 or MinIO (S3 호환, 셀프호스팅)
- [ ] **파일 업로드/다운로드 UI**: `lib/api/files.ts` 서비스 레이어로 API 호출
- [ ] **파일 메타데이터 관리**: SharedFile 타입 기반 (title, fileType, tags, status)
- [ ] **접근 권한**: 팀별/전체 공유 범위 설정
- [ ] **파일 뷰어**: PDF/이미지 인라인 프리뷰, 기타는 다운로드
- [ ] **용량 관리**: 조직별 스토리지 한도 설정

---

## ~~2-5. 인맥맵 / 협업 네트워크~~ → 제거 완료

- `app/admin/PeopleMap.tsx` (567줄) 삭제 완료
- `lib/mockData.ts`의 관련 데이터 제거 완료
- Admin 대시보드에서 "인맥맵" 탭 제거 완료
