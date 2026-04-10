# Phase 4: 운영 & 배포 (Operations) — P0~P1

> 전역 규칙: [00-global.md](./00-global.md) 참조
> 이 문서 범위: Phase 4 — 온프레미스 + CI/CD + 모니터링 + UX + 실시간

---

## 4-1. 온프레미스 대응 — 프론트엔드 측 필수 작업 (P0)

- [x] `next.config.ts`에 `output: "standalone"` 설정 (Vercel 종속 제거)
- [ ] **Vercel 전용 기능 사용 금지**: Edge Runtime, Vercel Cron, Vercel Analytics 등 사용 X
- [x] **Dockerfile** (프론트엔드 빌드용, 멀티스테이지):
  - Stage 1: `node:20-alpine` — 빌드 (npm run build)
  - Stage 2: `node:20-alpine` — standalone output만 복사, 포트 3001
- [x] **환경변수 템플릿**: `.env.example` (NEXT_PUBLIC_API_URL, NEXT_PUBLIC_API_MODE 등)
- [ ] **백엔드 개발자에게 전달**: Docker Compose 전체 스택 (postgres, redis, nginx, minio) 구성은 백엔드 담당
- [ ] **SSL 가이드 문서**: 고객 자체 인증서 + Let's Encrypt 두 방식 모두 안내

---

## 4-2. CI/CD (P1)

- [ ] **GitHub Actions**: lint → typecheck → test → build → docker image push
- [ ] **온프레미스 배포 프로세스**: Docker 이미지 pull → `docker compose up -d`
- [ ] **환경 분리**: dev (로컬) / staging (테스트 서버) / production (고객 서버)

---

## 4-3. 모니터링 (P1)

- [ ] **Sentry**: 에러 추적 (셀프호스팅 Sentry도 온프레미스 가능)
- [ ] **헬스체크 대시보드**: DB 커넥션, Redis 상태, 디스크/메모리
- [ ] **감사 로그 뷰어**: audit_logs 테이블 조회 UI (관리자용)

---

## 4-4. UX 개선 (P1)

- [ ] 반응형 디자인 점검 (모바일 로그 테이블 → 카드 레이아웃)
- [x] 접근성: `<html lang="ko">` 수정 완료
- [ ] ARIA 레이블, 모달 포커스 트래핑
- [ ] 데이터 내보내기: CSV 로그 다운로드, PDF 리포트 생성

---

## 4-5. 실시간 기능 (P2)

- [ ] SSE 또는 TanStack Query `refetchInterval` 로 실시간 로그 피드
- [ ] 보안 알림 실시간 노티피케이션
