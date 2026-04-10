import type {
  Log, AgentDetail, AgentStep, ToolCall, FileChange, ToolCallType,
  RiskRule, RiskAlert, RiskSeverity, RiskCategory,
  ReportSummary, SharedFile, FileType, FileStatus,
} from "@/types";

// Re-export types for backward compatibility
export type { Log, AgentDetail, AgentStep, ToolCall, FileChange, ToolCallType } from "@/types";
export type { RiskRule, RiskAlert, RiskSeverity, RiskCategory } from "@/types";
export type { ReportSummary } from "@/types";
export type { SharedFile, FileType, FileStatus } from "@/types";

// ================================
// 조직 / 팀 / 유저
// ================================
export const MOCK_ORG = {
  id: "org-001",
  name: "Softsquared Inc.",
};

export const MOCK_TEAMS = ["개발팀", "디자인팀", "기획팀"];

export const MOCK_USERS = [
  { id: "u-001", name: "강지수", team: "개발팀", role: "member", email: "jisoo@softsquared.com" },
  { id: "u-002", name: "이민준", team: "개발팀", role: "member", email: "minjun@softsquared.com" },
  { id: "u-003", name: "박서연", team: "디자인팀", role: "member", email: "seoyeon@softsquared.com" },
  { id: "u-004", name: "최현우", team: "기획팀", role: "member", email: "hyunwoo@softsquared.com" },
  { id: "u-005", name: "김태영", team: "개발팀", role: "admin", email: "taeyoung@softsquared.com" },
];

// ================================
// 로그 데이터
// ================================
// (타입 정의는 @/types/ 로 분리됨)

export const MOCK_LOGS: Log[] = [
  // ── 2025-12-01 ──────────────────────────────
  { id: "log-001", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Next.js App Router에서 middleware로 인증 처리하는 방법을 알려줘. JWT 토큰 검증 포함해서.", response: "Next.js App Router에서 middleware를 사용한 인증 처리 방법을 설명드리겠습니다...", input_tokens: 312, output_tokens: 890, cost_usd: 6.83, latency_ms: 1823, timestamp: "2025-12-01T09:12:00Z" },
  { id: "log-002", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "openai", model: "gpt-4o", prompt: "Supabase RLS 정책 설정할 때 자주 하는 실수와 디버깅 방법", response: "Supabase Row Level Security 설정 시 주의사항을 정리했습니다...", input_tokens: 189, output_tokens: 640, cost_usd: 6.35, latency_ms: 2100, timestamp: "2025-12-01T10:05:00Z" },
  { id: "log-003", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "extension", model: "gpt-4o", prompt: "글래스모피즘 디자인 시스템을 Tailwind CSS로 구현할 때 backdrop-filter 브라우저 호환성 이슈", response: "글래스모피즘 구현 시 backdrop-filter 호환성 해결 방법입니다...", input_tokens: 201, output_tokens: 510, cost_usd: 4.39, latency_ms: 1320, timestamp: "2025-12-01T11:22:00Z" },
  { id: "log-004", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "claude-sonnet-4", prompt: "SaaS 제품의 온보딩 플로우 설계할 때 고려해야 할 UX 체크리스트 만들어줘", response: "SaaS 온보딩 UX 체크리스트를 작성했습니다...", input_tokens: 178, output_tokens: 890, cost_usd: 5.86, latency_ms: 1750, timestamp: "2025-12-01T13:10:00Z" },
  { id: "log-005", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "팀 코드 리뷰 프로세스를 개선하기 위한 GitHub PR 템플릿 초안 작성해줘", response: "효과적인 PR 템플릿 예시를 작성했습니다...", input_tokens: 198, output_tokens: 670, cost_usd: 5.86, latency_ms: 1730, timestamp: "2025-12-01T14:30:00Z" },
  { id: "log-006", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "Express 프록시 서버에서 비동기 로그 저장할 때 메인 응답 latency에 영향 안 주는 패턴", response: "비동기 로그 저장으로 응답 지연 최소화하는 방법입니다...", input_tokens: 289, output_tokens: 610, cost_usd: 1.46, latency_ms: 890, timestamp: "2025-12-01T15:45:00Z" },
  { id: "log-007", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Playwright로 ChatGPT 공유 링크 크롤링할 때 동적 컨텐츠 로딩 완료 감지 방법", response: "Playwright에서 동적 컨텐츠 로딩 완료를 감지하는 방법들...", input_tokens: 334, output_tokens: 780, cost_usd: 6.83, latency_ms: 2240, timestamp: "2025-12-01T16:30:00Z" },

  // ── 2025-12-02 ──────────────────────────────
  { id: "log-008", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "React에서 복잡한 폼 상태 관리할 때 useReducer vs Zustand 선택 기준", response: "폼 상태 관리 라이브러리 선택 기준을 정리했습니다...", input_tokens: 267, output_tokens: 650, cost_usd: 5.86, latency_ms: 1680, timestamp: "2025-12-02T09:30:00Z" },
  { id: "log-009", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "openai", model: "gpt-4o", prompt: "Figma 컴포넌트를 React로 변환할 때 auto layout을 flexbox로 매핑하는 규칙 정리해줘", response: "Figma Auto Layout → CSS Flexbox 매핑 규칙을 정리했습니다...", input_tokens: 223, output_tokens: 580, cost_usd: 4.88, latency_ms: 1410, timestamp: "2025-12-02T10:20:00Z" },
  { id: "log-010", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "claude-sonnet-4", prompt: "경쟁사 분석 보고서 작성할 때 사용할 수 있는 프레임워크 추천해줘 (SWOT 말고)", response: "다양한 경쟁사 분석 프레임워크를 소개합니다...", input_tokens: 156, output_tokens: 740, cost_usd: 5.37, latency_ms: 1920, timestamp: "2025-12-02T11:05:00Z" },
  { id: "log-011", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Node.js에서 Bull queue를 사용해 재시도 로직과 dead letter queue 구현하는 방법", response: "Bull queue 재시도 로직 및 DLQ 구현 방법입니다...", input_tokens: 301, output_tokens: 820, cost_usd: 7.32, latency_ms: 2050, timestamp: "2025-12-02T13:30:00Z" },
  { id: "log-012", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "prisma schema에서 복합 unique 제약조건 설정하는 방법", response: "Prisma에서 복합 unique 제약 설정 방법입니다...", input_tokens: 134, output_tokens: 290, cost_usd: 0.98, latency_ms: 620, timestamp: "2025-12-02T15:10:00Z" },
  { id: "log-013", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "openai", model: "gpt-4o", prompt: "신입 개발자 온보딩 체크리스트 — 첫 2주 커리큘럼 구성해줘", response: "신입 개발자 2주 온보딩 커리큘럼을 작성했습니다...", input_tokens: 172, output_tokens: 950, cost_usd: 7.81, latency_ms: 2180, timestamp: "2025-12-02T16:00:00Z" },

  // ── 2025-12-03 ──────────────────────────────
  { id: "log-014", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "extension", model: "gpt-4o", prompt: "다크모드 색상 팔레트 설계할 때 접근성(WCAG AA) 기준을 유지하면서 브랜드 컬러 적용하는 방법", response: "다크모드 접근성 색상 팔레트 설계 가이드입니다...", input_tokens: 245, output_tokens: 630, cost_usd: 5.37, latency_ms: 1560, timestamp: "2025-12-03T09:15:00Z" },
  { id: "log-015", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Vercel Edge Runtime에서 실행할 수 없는 Node.js API 목록과 대안 정리해줘", response: "Edge Runtime 미지원 Node.js API 및 대안 방법입니다...", input_tokens: 278, output_tokens: 700, cost_usd: 6.35, latency_ms: 1800, timestamp: "2025-12-03T10:00:00Z" },
  { id: "log-016", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "gemini", model: "gemini-1.5-pro", prompt: "B2B SaaS 가격 정책 설계 시 freemium vs trial 모델의 장단점 비교 분석", response: "B2B SaaS 가격 모델 비교 분석 결과입니다...", input_tokens: 210, output_tokens: 880, cost_usd: 3.91, latency_ms: 2300, timestamp: "2025-12-03T11:45:00Z" },
  { id: "log-017", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Redis Cluster 모드에서 multi-key 명령어 사용 시 CROSSSLOT 에러 해결 방법", response: "Redis Cluster CROSSSLOT 에러 원인과 해결 방법입니다...", input_tokens: 256, output_tokens: 590, cost_usd: 5.37, latency_ms: 1470, timestamp: "2025-12-03T13:30:00Z" },
  { id: "log-018", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "OpenTelemetry를 Next.js에 붙여서 트레이싱 데이터 수집하는 설정 방법", response: "Next.js OpenTelemetry 트레이싱 설정 방법입니다...", input_tokens: 310, output_tokens: 860, cost_usd: 7.32, latency_ms: 2010, timestamp: "2025-12-03T14:20:00Z" },
  { id: "log-019", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "extension", model: "claude-sonnet-4", prompt: "모바일 앱 온보딩 스크린 3종 세트 카피라이팅 — 생산성 도구 컨셉", response: "생산성 도구 온보딩 카피라이팅 3종을 작성했습니다...", input_tokens: 189, output_tokens: 520, cost_usd: 4.39, latency_ms: 1350, timestamp: "2025-12-03T15:00:00Z" },

  // ── 2025-12-04 ──────────────────────────────
  { id: "log-020", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "crawler", model: "claude-sonnet-4", prompt: "Puppeteer로 SPA 크롤링 시 React hydration 완료 시점 감지하는 신뢰성 높은 방법", response: "SPA hydration 완료 감지 방법을 정리했습니다...", input_tokens: 318, output_tokens: 740, cost_usd: 6.35, latency_ms: 1920, timestamp: "2025-12-04T09:00:00Z" },
  { id: "log-021", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "gpt-4o", prompt: "사용자 인터뷰 질문지 작성 — 협업 툴 사용 경험 및 페인포인트 파악 목적", response: "협업 툴 사용자 인터뷰 질문지를 작성했습니다...", input_tokens: 163, output_tokens: 610, cost_usd: 4.88, latency_ms: 1640, timestamp: "2025-12-04T10:10:00Z" },
  { id: "log-022", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "zod로 환경변수 유효성 검사 스키마 작성하는 패턴", response: "Zod 환경변수 검증 스키마 패턴입니다...", input_tokens: 118, output_tokens: 310, cost_usd: 0.98, latency_ms: 570, timestamp: "2025-12-04T10:50:00Z" },
  { id: "log-023", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "분기별 팀 회고 진행 방법론 — Start/Stop/Continue 외에 더 효과적인 포맷 추천", response: "팀 회고 방법론 비교 및 추천안을 정리했습니다...", input_tokens: 182, output_tokens: 700, cost_usd: 5.86, latency_ms: 1760, timestamp: "2025-12-04T11:30:00Z" },
  { id: "log-024", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "openai", model: "gpt-4o-mini", prompt: "GitHub Actions CI/CD 파이프라인에서 Docker 레이어 캐시 최적화하는 방법", response: "GitHub Actions Docker 레이어 캐시 최적화 방법입니다...", input_tokens: 234, output_tokens: 680, cost_usd: 2.44, latency_ms: 1230, timestamp: "2025-12-04T13:15:00Z" },
  { id: "log-025", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "gemini", model: "gemini-1.5-flash", prompt: "아이콘 라이브러리 선택 기준 — Lucide vs Heroicons vs Phosphor 비교", response: "아이콘 라이브러리 비교 분석 결과입니다...", input_tokens: 178, output_tokens: 490, cost_usd: 1.46, latency_ms: 980, timestamp: "2025-12-04T14:00:00Z" },
  { id: "log-026", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Turborepo 모노레포에서 패키지간 타입 공유할 때 tsconfig paths 설정 방법", response: "Turborepo 타입 공유 설정 방법을 설명드립니다...", input_tokens: 292, output_tokens: 730, cost_usd: 6.35, latency_ms: 1840, timestamp: "2025-12-04T15:00:00Z" },

  // ── 2025-12-05 ──────────────────────────────
  { id: "log-027", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "claude-sonnet-4", prompt: "MVP 출시 후 PMF 측정 지표 설계 — 어떤 데이터를 어떻게 수집해야 하나", response: "PMF 측정 지표 및 데이터 수집 방법을 정리했습니다...", input_tokens: 201, output_tokens: 810, cost_usd: 6.35, latency_ms: 2080, timestamp: "2025-12-05T09:30:00Z" },
  { id: "log-028", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "PostgreSQL에서 JSONB 컬럼 인덱싱 전략 — GIN vs GiST 선택 기준", response: "PostgreSQL JSONB 인덱스 전략 비교입니다...", input_tokens: 267, output_tokens: 660, cost_usd: 5.86, latency_ms: 1590, timestamp: "2025-12-05T10:20:00Z" },
  { id: "log-029", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "openai", model: "gpt-4o", prompt: "개발팀 OKR 설정 예시 — AI 도구 활용 생산성 향상 목표 기준으로", response: "AI 도구 활용 개발팀 OKR 예시를 작성했습니다...", input_tokens: 194, output_tokens: 760, cost_usd: 6.83, latency_ms: 1870, timestamp: "2025-12-05T11:10:00Z" },
  { id: "log-030", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "tRPC와 React Query를 함께 사용할 때 optimistic update 구현 패턴", response: "tRPC + React Query optimistic update 구현 방법입니다...", input_tokens: 288, output_tokens: 790, cost_usd: 6.83, latency_ms: 1950, timestamp: "2025-12-05T13:00:00Z" },
  { id: "log-031", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "extension", model: "gpt-4o", prompt: "대시보드 UI에서 데이터 시각화 컴포넌트 배치 원칙 — 정보 위계 설계 방법", response: "대시보드 데이터 시각화 배치 원칙을 정리했습니다...", input_tokens: 219, output_tokens: 570, cost_usd: 4.88, latency_ms: 1430, timestamp: "2025-12-05T14:15:00Z" },
  { id: "log-032", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "ESLint 커스텀 룰 작성하는 방법 — import 순서 강제하는 룰 예시로", response: "ESLint 커스텀 룰 작성 방법 및 예시입니다...", input_tokens: 155, output_tokens: 380, cost_usd: 1.46, latency_ms: 710, timestamp: "2025-12-05T15:30:00Z" },

  // ── 2025-12-08 ──────────────────────────────
  { id: "log-033", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "crawler", model: "claude-sonnet-4", prompt: "Claude 공유 링크 아티팩트 컨텐츠를 크롤링할 때 iframe sandbox 우회 가능한지", response: "Claude 아티팩트 크롤링 기술적 접근 방법을 분석했습니다...", input_tokens: 342, output_tokens: 810, cost_usd: 7.32, latency_ms: 2290, timestamp: "2025-12-08T09:00:00Z" },
  { id: "log-034", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "gemini", model: "gemini-1.5-pro", prompt: "스타트업 시드 투자 IR 덱 구성 요소와 각 슬라이드에 들어갈 핵심 내용 정리", response: "시드 투자 IR 덱 구성 가이드를 작성했습니다...", input_tokens: 228, output_tokens: 920, cost_usd: 4.39, latency_ms: 2450, timestamp: "2025-12-08T10:30:00Z" },
  { id: "log-035", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Storybook 8 + Next.js 15 App Router 조합으로 컴포넌트 문서화 환경 구축 방법", response: "Storybook 8 + Next.js 15 셋업 가이드입니다...", input_tokens: 305, output_tokens: 870, cost_usd: 7.81, latency_ms: 2120, timestamp: "2025-12-08T11:00:00Z" },
  { id: "log-036", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "소규모 팀의 기술 부채 관리 전략 — 리팩토링 시간을 스프린트에 반영하는 방법", response: "기술 부채 관리 전략 및 스프린트 반영 방법입니다...", input_tokens: 210, output_tokens: 720, cost_usd: 6.35, latency_ms: 1810, timestamp: "2025-12-08T13:30:00Z" },
  { id: "log-037", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "openai", model: "gpt-4o", prompt: "사용자 테스트 결과 리포트를 디자인 팀 내부 공유용으로 정리하는 템플릿 만들어줘", response: "사용자 테스트 결과 리포트 템플릿을 작성했습니다...", input_tokens: 176, output_tokens: 640, cost_usd: 5.37, latency_ms: 1660, timestamp: "2025-12-08T14:15:00Z" },
  { id: "log-038", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "AWS Lambda cold start 줄이기 위한 실전 최적화 기법 — Node.js 런타임 기준", response: "Lambda cold start 최적화 방법을 정리했습니다...", input_tokens: 274, output_tokens: 750, cost_usd: 6.83, latency_ms: 1980, timestamp: "2025-12-08T15:00:00Z" },
  { id: "log-039", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "서버 컴포넌트와 클라이언트 컴포넌트 경계를 잘 설계하는 기준 — 실무 예시 포함", response: "Next.js Server/Client 컴포넌트 경계 설계 기준입니다...", input_tokens: 321, output_tokens: 900, cost_usd: 7.81, latency_ms: 2060, timestamp: "2025-12-08T16:00:00Z" },

  // ── 2025-12-09 ──────────────────────────────
  { id: "log-040", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "claude-sonnet-4", prompt: "고객 여정 지도(Customer Journey Map) 작성 워크숍 진행 방법", response: "CJM 워크숍 진행 가이드를 작성했습니다...", input_tokens: 195, output_tokens: 780, cost_usd: 5.86, latency_ms: 1870, timestamp: "2025-12-09T09:30:00Z" },
  { id: "log-041", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "useTransition과 useDeferredValue의 차이와 각각 적합한 사용 시나리오 설명해줘", response: "useTransition과 useDeferredValue 비교 설명입니다...", input_tokens: 241, output_tokens: 710, cost_usd: 6.35, latency_ms: 1720, timestamp: "2025-12-09T10:00:00Z" },
  { id: "log-042", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "gemini", model: "gemini-1.5-flash", prompt: "모션 디자인에서 easing curve 선택 기준 — 각 커브별 심리적 느낌 차이", response: "easing curve별 심리적 효과 및 적용 가이드입니다...", input_tokens: 183, output_tokens: 560, cost_usd: 1.46, latency_ms: 1010, timestamp: "2025-12-09T11:00:00Z" },
  { id: "log-043", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Kafka consumer group rebalancing 중 메시지 중복 처리 방지하는 idempotent consumer 구현", response: "Kafka idempotent consumer 구현 방법입니다...", input_tokens: 358, output_tokens: 830, cost_usd: 7.32, latency_ms: 2180, timestamp: "2025-12-09T13:00:00Z" },
  { id: "log-044", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "openai", model: "gpt-4o", prompt: "주니어 개발자 1:1 미팅에서 성장 피드백 주는 효과적인 방법", response: "주니어 개발자 성장 피드백 방법론을 정리했습니다...", input_tokens: 167, output_tokens: 690, cost_usd: 6.35, latency_ms: 1650, timestamp: "2025-12-09T14:30:00Z" },
  { id: "log-045", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "TypeScript satisfies 연산자와 as const의 차이점", response: "satisfies와 as const 비교 설명입니다...", input_tokens: 126, output_tokens: 320, cost_usd: 0.98, latency_ms: 590, timestamp: "2025-12-09T15:30:00Z" },

  // ── 2025-12-10 ──────────────────────────────
  { id: "log-046", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "gpt-4o", prompt: "린 캔버스 작성 예시 — B2B 협업 SaaS 제품 기준으로", response: "린 캔버스 작성 예시를 제공합니다...", input_tokens: 212, output_tokens: 870, cost_usd: 6.83, latency_ms: 2030, timestamp: "2025-12-10T09:00:00Z" },
  { id: "log-047", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Terraform으로 AWS ECS Fargate 서비스 배포 자동화하는 모듈 구조", response: "Terraform ECS Fargate 모듈 구조 가이드입니다...", input_tokens: 315, output_tokens: 790, cost_usd: 6.83, latency_ms: 2000, timestamp: "2025-12-10T10:30:00Z" },
  { id: "log-048", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "extension", model: "claude-sonnet-4", prompt: "컬러 시스템 설계 — semantic token 레이어를 어떻게 구성하면 좋을까", response: "Semantic color token 레이어 설계 방법입니다...", input_tokens: 230, output_tokens: 610, cost_usd: 4.88, latency_ms: 1480, timestamp: "2025-12-10T11:30:00Z" },
  { id: "log-049", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Next.js ISR과 on-demand revalidation 조합해서 캐시 전략 최적화하는 방법", response: "Next.js ISR + on-demand revalidation 전략입니다...", input_tokens: 299, output_tokens: 820, cost_usd: 7.32, latency_ms: 1930, timestamp: "2025-12-10T13:15:00Z" },
  { id: "log-050", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "팀 빌딩 행사 기획 — 원격 근무자 포함한 하이브리드 팀 대상", response: "하이브리드 팀 빌딩 행사 기획안을 작성했습니다...", input_tokens: 173, output_tokens: 650, cost_usd: 5.37, latency_ms: 1680, timestamp: "2025-12-10T15:00:00Z" },

  // ── 2025-12-11 ──────────────────────────────
  { id: "log-051", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Zustand persist middleware로 로컬스토리지 동기화할 때 hydration mismatch 해결 방법", response: "Zustand persist hydration mismatch 해결 방법입니다...", input_tokens: 276, output_tokens: 680, cost_usd: 5.86, latency_ms: 1760, timestamp: "2025-12-11T09:00:00Z" },
  { id: "log-052", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "crawler", model: "claude-sonnet-4", prompt: "ChatGPT conversation 크롤링 시 rate limit 우회 없이 안정적으로 수집하는 방법", response: "안정적인 ChatGPT conversation 크롤링 전략입니다...", input_tokens: 328, output_tokens: 760, cost_usd: 6.83, latency_ms: 2150, timestamp: "2025-12-11T10:30:00Z" },
  { id: "log-053", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "gemini", model: "gemini-1.5-pro", prompt: "제품 로드맵 우선순위 산정 RICE 스코어링 실전 적용 예시", response: "RICE 스코어링 실전 적용 예시를 제공합니다...", input_tokens: 206, output_tokens: 840, cost_usd: 3.91, latency_ms: 2270, timestamp: "2025-12-11T11:00:00Z" },
  { id: "log-054", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "openai", model: "gpt-4o", prompt: "반응형 타이포그래피 스케일 설계 — clamp() 활용한 fluid type scale", response: "fluid typography scale 설계 방법입니다...", input_tokens: 198, output_tokens: 520, cost_usd: 4.39, latency_ms: 1300, timestamp: "2025-12-11T13:00:00Z" },
  { id: "log-055", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "package.json exports 필드로 조건부 exports 설정하는 방법", response: "package.json conditional exports 설정 방법입니다...", input_tokens: 143, output_tokens: 350, cost_usd: 0.98, latency_ms: 650, timestamp: "2025-12-11T14:30:00Z" },
  { id: "log-056", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "개발자 채용 기술 과제 설계 원칙 — 적절한 난이도와 평가 기준", response: "기술 과제 설계 및 평가 기준을 정리했습니다...", input_tokens: 215, output_tokens: 730, cost_usd: 6.35, latency_ms: 1790, timestamp: "2025-12-11T15:30:00Z" },

  // ── 2025-12-12 ──────────────────────────────
  { id: "log-057", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "WebSocket 서버를 Kubernetes에서 sticky session 없이 운영하는 방법", response: "K8s WebSocket sticky session 없는 운영 방법입니다...", input_tokens: 302, output_tokens: 770, cost_usd: 6.83, latency_ms: 1990, timestamp: "2025-12-12T09:30:00Z" },
  { id: "log-058", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "React 19 actions와 useOptimistic 조합으로 폼 제출 UX 개선하는 방법", response: "React 19 actions + useOptimistic 활용법입니다...", input_tokens: 289, output_tokens: 810, cost_usd: 7.32, latency_ms: 1870, timestamp: "2025-12-12T10:15:00Z" },
  { id: "log-059", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "claude-sonnet-4", prompt: "스프린트 리뷰와 회고를 합친 효율적인 회의 포맷 설계", response: "스프린트 리뷰+회고 통합 포맷을 제안합니다...", input_tokens: 168, output_tokens: 620, cost_usd: 4.88, latency_ms: 1550, timestamp: "2025-12-12T11:00:00Z" },
  { id: "log-060", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "extension", model: "gpt-4o", prompt: "스켈레톤 UI 패턴 설계 가이드 — 로딩 상태별 적합한 스켈레톤 형태", response: "스켈레톤 UI 패턴 설계 가이드입니다...", input_tokens: 209, output_tokens: 540, cost_usd: 4.39, latency_ms: 1380, timestamp: "2025-12-12T13:30:00Z" },
  { id: "log-061", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "openai", model: "gpt-4o", prompt: "엔지니어링 매니저로 전환할 때 가장 많이 겪는 어려움과 극복 방법", response: "EM 전환 시 주요 어려움과 극복 방법을 정리했습니다...", input_tokens: 184, output_tokens: 780, cost_usd: 6.83, latency_ms: 1920, timestamp: "2025-12-12T14:00:00Z" },
  { id: "log-062", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "Dockerfile COPY --chown 옵션과 USER 지시자 함께 사용하는 방법", response: "Dockerfile 권한 설정 방법을 설명드립니다...", input_tokens: 131, output_tokens: 290, cost_usd: 0.98, latency_ms: 560, timestamp: "2025-12-12T15:30:00Z" },

  // ── 2025-12-15 ──────────────────────────────
  { id: "log-063", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "gRPC streaming vs REST long polling 성능 비교 — 실시간 데이터 전송 시나리오", response: "gRPC streaming vs REST long polling 비교 분석입니다...", input_tokens: 311, output_tokens: 800, cost_usd: 7.32, latency_ms: 2040, timestamp: "2025-12-15T09:00:00Z" },
  { id: "log-064", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "gemini", model: "gemini-1.5-pro", prompt: "북극성 지표(North Star Metric) 설정 방법과 팀에 공유하는 방법", response: "North Star Metric 설정 및 공유 방법입니다...", input_tokens: 220, output_tokens: 860, cost_usd: 3.91, latency_ms: 2350, timestamp: "2025-12-15T10:30:00Z" },
  { id: "log-065", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Drizzle ORM과 Prisma 비교 — Next.js 프로젝트에서 선택 기준", response: "Drizzle ORM vs Prisma 비교 분석입니다...", input_tokens: 264, output_tokens: 720, cost_usd: 6.35, latency_ms: 1810, timestamp: "2025-12-15T11:00:00Z" },
  { id: "log-066", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "extension", model: "claude-sonnet-4", prompt: "B2B 대시보드에서 테이블 UI 컴포넌트 설계 — 정렬/필터/페이지네이션 UX", response: "B2B 대시보드 테이블 UI 설계 가이드입니다...", input_tokens: 241, output_tokens: 630, cost_usd: 5.37, latency_ms: 1580, timestamp: "2025-12-15T13:30:00Z" },
  { id: "log-067", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "개발팀 문서화 문화 정착시키기 — ADR, 런북, 위키 운영 방법", response: "개발팀 문서화 문화 정착 방법을 정리했습니다...", input_tokens: 196, output_tokens: 740, cost_usd: 6.35, latency_ms: 1850, timestamp: "2025-12-15T14:15:00Z" },
  { id: "log-068", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "openai", model: "gpt-4o-mini", prompt: "Nginx rate limiting 설정 — burst와 nodelay 파라미터 의미와 활용법", response: "Nginx rate limit 설정 방법을 설명드립니다...", input_tokens: 218, output_tokens: 580, cost_usd: 1.95, latency_ms: 1050, timestamp: "2025-12-15T15:30:00Z" },

  // ── 2025-12-16 ──────────────────────────────
  { id: "log-069", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Suspense boundary를 활용해서 스트리밍 SSR 구현하는 방법 — 실제 코드 예시", response: "Suspense boundary 스트리밍 SSR 구현 예시입니다...", input_tokens: 307, output_tokens: 880, cost_usd: 7.81, latency_ms: 2090, timestamp: "2025-12-16T09:00:00Z" },
  { id: "log-070", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "gpt-4o", prompt: "사용자 리텐션 향상을 위한 gamification 요소 설계 — 적절한 보상 시스템", response: "gamification 기반 리텐션 전략을 정리했습니다...", input_tokens: 188, output_tokens: 790, cost_usd: 6.35, latency_ms: 1990, timestamp: "2025-12-16T10:00:00Z" },
  { id: "log-071", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "openai", model: "gpt-4o", prompt: "마이크로인터랙션 설계 원칙 — 버튼 클릭, 스와이프, hover 상태 애니메이션", response: "마이크로인터랙션 설계 원칙을 정리했습니다...", input_tokens: 214, output_tokens: 590, cost_usd: 4.88, latency_ms: 1450, timestamp: "2025-12-16T11:30:00Z" },
  { id: "log-072", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "MSA에서 distributed tracing 구현 — Jaeger + OpenTelemetry 연동", response: "Jaeger + OpenTelemetry 분산 추적 구현 방법입니다...", input_tokens: 333, output_tokens: 820, cost_usd: 7.32, latency_ms: 2200, timestamp: "2025-12-16T13:00:00Z" },
  { id: "log-073", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "Winston logger에서 로그 레벨별 색상 출력 커스터마이징", response: "Winston 로그 레벨 색상 커스터마이징 방법입니다...", input_tokens: 138, output_tokens: 310, cost_usd: 0.98, latency_ms: 600, timestamp: "2025-12-16T15:00:00Z" },
  { id: "log-074", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "성과 측정 어려운 개발팀 KPI 설계 방법 — 정성적 지표 포함", response: "개발팀 KPI 설계 방법 및 사례를 정리했습니다...", input_tokens: 202, output_tokens: 710, cost_usd: 5.86, latency_ms: 1770, timestamp: "2025-12-16T16:00:00Z" },

  // ── 2025-12-17 ──────────────────────────────
  { id: "log-075", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "pnpm workspace 설정하고 공통 패키지 local link 하는 방법", response: "pnpm workspace 설정 및 local link 방법입니다...", input_tokens: 265, output_tokens: 700, cost_usd: 5.86, latency_ms: 1740, timestamp: "2025-12-17T09:30:00Z" },
  { id: "log-076", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "gemini", model: "gemini-1.5-flash", prompt: "UI 컴포넌트 라이브러리 평가 기준 — shadcn/ui vs Radix vs MUI 비교", response: "UI 컴포넌트 라이브러리 비교 분석입니다...", input_tokens: 193, output_tokens: 570, cost_usd: 1.46, latency_ms: 1020, timestamp: "2025-12-17T10:30:00Z" },
  { id: "log-077", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "claude-sonnet-4", prompt: "콘텐츠 마케팅 전략 수립 — AI 개발 도구 타겟 개발자 커뮤니티 공략 방법", response: "AI 도구 대상 콘텐츠 마케팅 전략을 수립했습니다...", input_tokens: 222, output_tokens: 860, cost_usd: 6.83, latency_ms: 2050, timestamp: "2025-12-17T11:00:00Z" },
  { id: "log-078", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Elasticsearch에서 한국어 형태소 분석기 nori 설정 및 검색 품질 개선 방법", response: "Elasticsearch nori 형태소 분석기 설정 방법입니다...", input_tokens: 288, output_tokens: 760, cost_usd: 6.83, latency_ms: 1970, timestamp: "2025-12-17T13:00:00Z" },
  { id: "log-079", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "middleware chain 패턴으로 Express 요청 처리 파이프라인 구성하는 방법", response: "Express middleware chain 패턴 구현 방법입니다...", input_tokens: 274, output_tokens: 720, cost_usd: 6.35, latency_ms: 1810, timestamp: "2025-12-17T14:30:00Z" },
  { id: "log-080", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "openai", model: "gpt-4o", prompt: "리모트 팀 비동기 소통 규칙 설계 — Slack 채널 구조와 응답 SLA 기준", response: "리모트 팀 비동기 소통 규칙 설계안을 제시합니다...", input_tokens: 178, output_tokens: 680, cost_usd: 5.86, latency_ms: 1710, timestamp: "2025-12-17T15:30:00Z" },

  // ── 2025-12-18 ──────────────────────────────
  { id: "log-081", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "SWR과 React Query 비교 — 프로젝트 규모별 선택 기준과 마이그레이션 전략", response: "SWR vs React Query 비교 및 선택 기준입니다...", input_tokens: 258, output_tokens: 730, cost_usd: 6.35, latency_ms: 1760, timestamp: "2025-12-18T09:00:00Z" },
  { id: "log-082", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "extension", model: "gpt-4o", prompt: "피그마에서 컴포넌트 variants와 interactive components 설계 모범 사례", response: "Figma 컴포넌트 variants 설계 모범 사례입니다...", input_tokens: 225, output_tokens: 590, cost_usd: 4.88, latency_ms: 1470, timestamp: "2025-12-18T10:30:00Z" },
  { id: "log-083", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "crawler", model: "claude-sonnet-4", prompt: "Gemini API 응답 크롤링 시 SSE 스트림 파싱 방법 — fetch vs eventsource", response: "Gemini SSE 스트림 파싱 방법을 정리했습니다...", input_tokens: 325, output_tokens: 790, cost_usd: 6.83, latency_ms: 2120, timestamp: "2025-12-18T11:00:00Z" },
  { id: "log-084", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "gemini", model: "gemini-1.5-pro", prompt: "Notion AI와 Claude를 업무에서 함께 사용하는 워크플로우 설계", response: "Notion AI + Claude 업무 워크플로우를 설계했습니다...", input_tokens: 196, output_tokens: 810, cost_usd: 3.91, latency_ms: 2230, timestamp: "2025-12-18T13:30:00Z" },
  { id: "log-085", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "AI 코딩 도구 도입 시 보안 리스크와 코드 유출 방지 정책 설계", response: "AI 코딩 도구 보안 정책 설계 가이드입니다...", input_tokens: 231, output_tokens: 760, cost_usd: 6.83, latency_ms: 1900, timestamp: "2025-12-18T14:30:00Z" },
  { id: "log-086", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "Git rebase interactive로 커밋 히스토리 정리하는 방법", response: "Git interactive rebase 사용법입니다...", input_tokens: 142, output_tokens: 340, cost_usd: 0.98, latency_ms: 630, timestamp: "2025-12-18T15:30:00Z" },

  // ── 2025-12-19 ──────────────────────────────
  { id: "log-087", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "OpenAI API 스트리밍 응답을 Next.js App Router에서 처리하는 방법", response: "Next.js App Router OpenAI 스트리밍 처리 방법입니다...", input_tokens: 295, output_tokens: 800, cost_usd: 7.32, latency_ms: 2010, timestamp: "2025-12-19T09:00:00Z" },
  { id: "log-088", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "모노레포에서 Changesets로 패키지 버전 관리 및 changelog 자동화", response: "Changesets 패키지 버전 관리 방법입니다...", input_tokens: 271, output_tokens: 710, cost_usd: 6.35, latency_ms: 1780, timestamp: "2025-12-19T10:00:00Z" },
  { id: "log-089", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "openai", model: "gpt-4o", prompt: "empty state 디자인 패턴 — 첫 방문자 vs 데이터 없음 vs 에러 상황별 분기", response: "empty state 디자인 패턴 가이드입니다...", input_tokens: 208, output_tokens: 560, cost_usd: 4.39, latency_ms: 1390, timestamp: "2025-12-19T11:00:00Z" },
  { id: "log-090", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "claude-sonnet-4", prompt: "AI 제품 윤리 가이드라인 — 사용자 데이터 활용 투명성 확보 방법", response: "AI 제품 윤리 가이드라인을 작성했습니다...", input_tokens: 214, output_tokens: 890, cost_usd: 6.83, latency_ms: 2080, timestamp: "2025-12-19T13:00:00Z" },
  { id: "log-091", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "개발팀 스프린트 속도(velocity) 측정과 안정화하는 방법 — 추정 오차 줄이기", response: "스프린트 velocity 측정 및 안정화 방법입니다...", input_tokens: 219, output_tokens: 700, cost_usd: 5.86, latency_ms: 1760, timestamp: "2025-12-19T14:30:00Z" },
  { id: "log-092", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "CSS container query 브라우저 지원 현황과 실전 활용 패턴", response: "CSS container query 활용 방법입니다...", input_tokens: 148, output_tokens: 360, cost_usd: 0.98, latency_ms: 670, timestamp: "2025-12-19T15:30:00Z" },

  // ── 2025-12-20 ──────────────────────────────
  { id: "log-093", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Circuit breaker 패턴을 Node.js 서비스에 구현하는 방법 — opossum 라이브러리 활용", response: "Circuit breaker 패턴 구현 방법입니다...", input_tokens: 312, output_tokens: 840, cost_usd: 7.32, latency_ms: 2070, timestamp: "2025-12-20T09:00:00Z" },
  { id: "log-094", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "TypeScript에서 제네릭 타입을 활용해서 API 응답 타입을 안전하게 처리하는 패턴 알려줘", response: "TypeScript 제네릭을 활용한 API 응답 타입 처리 패턴을 소개합니다...", input_tokens: 245, output_tokens: 720, cost_usd: 5.37, latency_ms: 1540, timestamp: "2025-12-20T10:34:00Z" },
  { id: "log-095", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "extension", model: "gpt-4o", prompt: "접근성 감사(Accessibility Audit) 체크리스트 — ARIA 패턴 적용 기준", response: "접근성 감사 체크리스트를 작성했습니다...", input_tokens: 233, output_tokens: 620, cost_usd: 5.37, latency_ms: 1510, timestamp: "2025-12-20T11:00:00Z" },
  { id: "log-096", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "gemini", model: "gemini-1.5-pro", prompt: "경쟁사 벤치마킹 보고서 작성 — AI 로그 분석 도구 시장 기준", response: "AI 로그 분석 도구 경쟁사 벤치마킹 보고서를 작성했습니다...", input_tokens: 240, output_tokens: 930, cost_usd: 4.39, latency_ms: 2510, timestamp: "2025-12-20T13:00:00Z" },
  { id: "log-097", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "openai", model: "gpt-4o", prompt: "Claude API와 OpenAI API 비용 비교 — 토큰 효율성 기준 실제 사용 시나리오 분석", response: "Claude vs OpenAI API 비용 비교 분석입니다...", input_tokens: 225, output_tokens: 810, cost_usd: 7.32, latency_ms: 2000, timestamp: "2025-12-20T14:00:00Z" },
  { id: "log-098", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Next.js App Router에서 middleware로 인증 처리하는 방법을 알려줘. JWT 토큰 검증 포함해서.", response: "Next.js App Router에서 middleware를 사용한 인증 처리 방법을 설명드리겠습니다...", input_tokens: 312, output_tokens: 890, cost_usd: 6.83, latency_ms: 1823, timestamp: "2025-12-20T15:12:00Z" },

  // ── 2025-12-21 ──────────────────────────────
  { id: "log-099", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Playwright로 ChatGPT 공유 링크 크롤링할 때 동적 컨텐츠 로딩 완료 감지 방법", response: "Playwright에서 동적 컨텐츠 로딩 완료를 감지하는 방법들...", input_tokens: 334, output_tokens: 780, cost_usd: 6.83, latency_ms: 2240, timestamp: "2025-12-21T09:30:00Z" },
  { id: "log-100", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "React에서 복잡한 폼 상태 관리할 때 useReducer vs Zustand 선택 기준", response: "폼 상태 관리 라이브러리 선택 기준을 정리했습니다...", input_tokens: 267, output_tokens: 650, cost_usd: 5.86, latency_ms: 1680, timestamp: "2025-12-21T10:55:00Z" },
  { id: "log-101", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "openai", model: "gpt-4o", prompt: "디자인 시스템 문서화 도구 비교 — Zeroheight vs Supernova vs Storybook", response: "디자인 시스템 문서화 도구 비교 분석입니다...", input_tokens: 198, output_tokens: 550, cost_usd: 4.39, latency_ms: 1360, timestamp: "2025-12-21T11:30:00Z" },
  { id: "log-102", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "claude-sonnet-4", prompt: "제품 출시 체크리스트 — 법적 검토, 보안 심사, QA 포함 종합 가이드", response: "제품 출시 전 종합 체크리스트를 작성했습니다...", input_tokens: 204, output_tokens: 880, cost_usd: 6.83, latency_ms: 2110, timestamp: "2025-12-21T13:00:00Z" },
  { id: "log-103", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "사내 AI 도구 활용 가이드라인 초안 작성 — 보안 정책과 생산성 균형", response: "사내 AI 도구 활용 가이드라인을 작성했습니다...", input_tokens: 238, output_tokens: 790, cost_usd: 6.83, latency_ms: 1930, timestamp: "2025-12-21T14:30:00Z" },
  { id: "log-104", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "Next.js dynamic import에서 ssr:false 옵션 사용 시 주의사항", response: "Next.js dynamic import ssr:false 주의사항입니다...", input_tokens: 139, output_tokens: 300, cost_usd: 0.98, latency_ms: 580, timestamp: "2025-12-21T15:30:00Z" },

  // ── 2025-12-22 ──────────────────────────────
  { id: "log-105", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Anthropic API function calling으로 구조화된 데이터 추출하는 방법", response: "Anthropic API function calling 활용법입니다...", input_tokens: 308, output_tokens: 810, cost_usd: 7.32, latency_ms: 2030, timestamp: "2025-12-22T09:00:00Z" },
  { id: "log-106", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Vercel Edge Runtime에서 실행할 수 없는 Node.js API 목록과 대안 정리해줘", response: "Edge Runtime 미지원 Node.js API 및 대안 방법입니다...", input_tokens: 278, output_tokens: 700, cost_usd: 6.35, latency_ms: 1800, timestamp: "2025-12-22T10:00:00Z" },
  { id: "log-107", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "gemini", model: "gemini-1.5-flash", prompt: "AI 생성 이미지를 제품에 활용할 때 저작권 이슈 체크포인트", response: "AI 생성 이미지 저작권 체크포인트입니다...", input_tokens: 176, output_tokens: 510, cost_usd: 1.46, latency_ms: 970, timestamp: "2025-12-22T11:00:00Z" },
  { id: "log-108", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "gpt-4o", prompt: "사용자 행동 데이터 기반 피쳐 우선순위 결정 방법 — Mixpanel 데이터 활용", response: "Mixpanel 기반 피쳐 우선순위 결정 방법입니다...", input_tokens: 210, output_tokens: 790, cost_usd: 6.35, latency_ms: 1980, timestamp: "2025-12-22T13:30:00Z" },
  { id: "log-109", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "openai", model: "gpt-4o", prompt: "Claude API와 OpenAI API를 팀에서 함께 사용할 때 비용 최적화 전략", response: "멀티 AI API 비용 최적화 전략을 제안합니다...", input_tokens: 207, output_tokens: 720, cost_usd: 6.35, latency_ms: 1840, timestamp: "2025-12-22T14:30:00Z" },
  { id: "log-110", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "서버 컴포넌트와 클라이언트 컴포넌트 경계를 잘 설계하는 기준 — 실무 예시 포함", response: "Next.js Server/Client 컴포넌트 경계 설계 기준입니다...", input_tokens: 321, output_tokens: 900, cost_usd: 7.81, latency_ms: 2060, timestamp: "2025-12-22T15:30:00Z" },

  // ── 2026-01-02 ──────────────────────────────
  { id: "log-111", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "2026년 프론트엔드 트렌드 — React 19 주요 변경점 정리", response: "React 19 주요 변경점 및 2026 프론트엔드 트렌드입니다...", input_tokens: 268, output_tokens: 790, cost_usd: 6.83, latency_ms: 1880, timestamp: "2026-01-02T09:10:00Z" },
  { id: "log-112", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "gRPC-web을 Next.js 클라이언트에서 사용하는 방법 — protobuf 설정 포함", response: "gRPC-web Next.js 설정 방법입니다...", input_tokens: 331, output_tokens: 810, cost_usd: 7.32, latency_ms: 2090, timestamp: "2026-01-02T10:20:00Z" },
  { id: "log-113", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "extension", model: "gpt-4o", prompt: "2026 UI 디자인 트렌드 — 글래스모피즘 이후의 흐름", response: "2026 UI 디자인 트렌드를 정리했습니다...", input_tokens: 195, output_tokens: 570, cost_usd: 4.88, latency_ms: 1410, timestamp: "2026-01-02T11:00:00Z" },
  { id: "log-114", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "claude-sonnet-4", prompt: "신년 제품 로드맵 작성 — Q1 목표 설정 및 우선순위 프레임워크", response: "Q1 제품 로드맵 작성 가이드입니다...", input_tokens: 214, output_tokens: 860, cost_usd: 6.83, latency_ms: 2020, timestamp: "2026-01-02T13:30:00Z" },
  { id: "log-115", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "openai", model: "gpt-4o", prompt: "2026년 개발팀 채용 계획 — 시니어 풀스택 포지션 JD 초안", response: "시니어 풀스택 개발자 JD 초안을 작성했습니다...", input_tokens: 201, output_tokens: 830, cost_usd: 7.32, latency_ms: 2010, timestamp: "2026-01-02T14:30:00Z" },

  // ── 2026-01-03 ──────────────────────────────
  { id: "log-116", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "TypeScript 5.7 새로운 기능 정리 — satisfies, const 타입 파라미터", response: "TypeScript 5.7 신규 기능 요약입니다...", input_tokens: 148, output_tokens: 370, cost_usd: 0.98, latency_ms: 640, timestamp: "2026-01-03T09:30:00Z" },
  { id: "log-117", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "crawler", model: "claude-sonnet-4", prompt: "Perplexity AI 응답 크롤링 시 streaming SSE 데이터 파싱 방법", response: "Perplexity SSE 스트림 파싱 방법입니다...", input_tokens: 318, output_tokens: 760, cost_usd: 6.83, latency_ms: 2100, timestamp: "2026-01-03T10:30:00Z" },
  { id: "log-118", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "gemini", model: "gemini-1.5-pro", prompt: "OKR vs SMART 목표 설정 방식 비교 — AI 스타트업 적용 사례", response: "OKR vs SMART 비교 분석을 정리했습니다...", input_tokens: 223, output_tokens: 890, cost_usd: 4.39, latency_ms: 2380, timestamp: "2026-01-03T11:30:00Z" },
  { id: "log-119", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "openai", model: "gpt-4o", prompt: "Framer Motion v11 animation API 변경사항 — layout animation 최적화", response: "Framer Motion v11 변경사항 정리입니다...", input_tokens: 209, output_tokens: 600, cost_usd: 4.88, latency_ms: 1480, timestamp: "2026-01-03T13:00:00Z" },
  { id: "log-120", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Next.js 16 주요 변경사항 마이그레이션 가이드 — App Router 개선점", response: "Next.js 16 마이그레이션 가이드입니다...", input_tokens: 289, output_tokens: 820, cost_usd: 7.32, latency_ms: 1950, timestamp: "2026-01-03T14:30:00Z" },
  { id: "log-121", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "스타트업 개발팀 온보딩 프로세스 자동화 — Notion + GitHub 연동", response: "온보딩 자동화 프로세스 설계안입니다...", input_tokens: 226, output_tokens: 740, cost_usd: 6.35, latency_ms: 1820, timestamp: "2026-01-03T15:30:00Z" },

  // ── 2026-01-06 ──────────────────────────────
  { id: "log-122", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Bun 런타임 vs Node.js — 실무 프로젝트 전환 시 고려사항", response: "Bun vs Node.js 실무 전환 고려사항입니다...", input_tokens: 274, output_tokens: 730, cost_usd: 6.35, latency_ms: 1790, timestamp: "2026-01-06T09:00:00Z" },
  { id: "log-123", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "React Query v5 스타일로 서버 상태 관리 리팩토링하는 방법", response: "React Query v5 마이그레이션 방법입니다...", input_tokens: 295, output_tokens: 780, cost_usd: 6.83, latency_ms: 1860, timestamp: "2026-01-06T10:00:00Z" },
  { id: "log-124", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "extension", model: "claude-sonnet-4", prompt: "AI 생성 UI 컴포넌트의 품질 기준 — 디자이너 리뷰 체크리스트", response: "AI 생성 UI 품질 기준 체크리스트입니다...", input_tokens: 218, output_tokens: 580, cost_usd: 4.88, latency_ms: 1440, timestamp: "2026-01-06T11:00:00Z" },
  { id: "log-125", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "gpt-4o", prompt: "AI 도구 도입 ROI 측정 방법 — 팀 생산성 지표 설계", response: "AI 도입 ROI 측정 방법을 정리했습니다...", input_tokens: 196, output_tokens: 810, cost_usd: 6.35, latency_ms: 1990, timestamp: "2026-01-06T13:00:00Z" },
  { id: "log-126", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "Tailwind v4 CSS-first 설정 방식으로 마이그레이션하는 방법", response: "Tailwind v4 마이그레이션 가이드입니다...", input_tokens: 152, output_tokens: 390, cost_usd: 1.46, latency_ms: 680, timestamp: "2026-01-06T14:30:00Z" },
  { id: "log-127", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "openai", model: "gpt-4o-mini", prompt: "Vitest로 React 컴포넌트 테스트 환경 구성하는 방법 — jsdom 설정 포함", response: "Vitest React 테스트 환경 구성 방법입니다...", input_tokens: 238, output_tokens: 690, cost_usd: 2.44, latency_ms: 1240, timestamp: "2026-01-06T15:30:00Z" },

  // ── 2026-01-07 ──────────────────────────────
  { id: "log-128", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "개발팀 주간 업무 공유 포맷 설계 — AI 도구 활용 현황 포함", response: "주간 업무 공유 포맷 설계안입니다...", input_tokens: 193, output_tokens: 680, cost_usd: 5.86, latency_ms: 1700, timestamp: "2026-01-07T09:30:00Z" },
  { id: "log-129", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Zod v4 새로운 기능 — recursive schema, brand 타입 활용법", response: "Zod v4 신규 기능 활용 방법입니다...", input_tokens: 271, output_tokens: 700, cost_usd: 6.35, latency_ms: 1740, timestamp: "2026-01-07T10:00:00Z" },
  { id: "log-130", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "gemini", model: "gemini-1.5-flash", prompt: "Lottie 애니메이션을 React에서 최적화하는 방법 — 번들 사이즈 줄이기", response: "Lottie 최적화 방법을 정리했습니다...", input_tokens: 181, output_tokens: 510, cost_usd: 1.46, latency_ms: 990, timestamp: "2026-01-07T11:00:00Z" },
  { id: "log-131", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "ClickHouse를 로그 분석 DB로 도입할 때 스키마 설계 모범 사례", response: "ClickHouse 로그 분석 스키마 설계 가이드입니다...", input_tokens: 308, output_tokens: 800, cost_usd: 7.32, latency_ms: 2030, timestamp: "2026-01-07T13:30:00Z" },
  { id: "log-132", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "claude-sonnet-4", prompt: "사용자 인터뷰 분석 결과를 팀에 공유하는 효과적인 방법 — Affinity Diagram", response: "사용자 인터뷰 결과 공유 방법을 정리했습니다...", input_tokens: 204, output_tokens: 760, cost_usd: 6.35, latency_ms: 1870, timestamp: "2026-01-07T14:30:00Z" },
  { id: "log-133", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "pnpm dlx vs npx 차이점과 적합한 사용 케이스", response: "pnpm dlx vs npx 비교 설명입니다...", input_tokens: 131, output_tokens: 300, cost_usd: 0.98, latency_ms: 570, timestamp: "2026-01-07T15:30:00Z" },

  // ── 2026-01-08 ──────────────────────────────
  { id: "log-134", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Anthropic Claude API tool use 기능으로 멀티스텝 에이전트 구현하는 방법", response: "Claude API tool use 에이전트 구현 방법입니다...", input_tokens: 342, output_tokens: 850, cost_usd: 7.81, latency_ms: 2180, timestamp: "2026-01-08T09:00:00Z" },
  { id: "log-135", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "shadcn/ui 컴포넌트 커스터마이징 — 디자인 시스템 토큰 연동 방법", response: "shadcn/ui 커스터마이징 방법을 설명드립니다...", input_tokens: 276, output_tokens: 710, cost_usd: 6.35, latency_ms: 1780, timestamp: "2026-01-08T10:30:00Z" },
  { id: "log-136", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "extension", model: "gpt-4o", prompt: "AI 어시스턴트 UI 패턴 — 채팅 인터페이스 최적 사용자 경험 설계", response: "AI 채팅 UI 패턴 설계 가이드입니다...", input_tokens: 231, output_tokens: 620, cost_usd: 5.37, latency_ms: 1500, timestamp: "2026-01-08T11:00:00Z" },
  { id: "log-137", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "openai", model: "gpt-4o", prompt: "AI 코딩 도구 사용 가이드라인 v2 — Claude Code vs Cursor 비교 내부 문서", response: "AI 코딩 도구 비교 가이드라인 v2입니다...", input_tokens: 245, output_tokens: 820, cost_usd: 7.32, latency_ms: 2000, timestamp: "2026-01-08T13:00:00Z" },
  { id: "log-138", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "gemini", model: "gemini-1.5-pro", prompt: "AI 로그 분석 서비스 타깃 시장 규모 추정 — TAM/SAM/SOM 계산법", response: "AI 로그 분석 서비스 시장 규모 추정 방법입니다...", input_tokens: 237, output_tokens: 910, cost_usd: 4.39, latency_ms: 2420, timestamp: "2026-01-08T14:30:00Z" },
  { id: "log-139", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Prometheus + Grafana로 Node.js 앱 메트릭 수집 및 대시보드 구성", response: "Prometheus Grafana 모니터링 구성 방법입니다...", input_tokens: 298, output_tokens: 770, cost_usd: 6.83, latency_ms: 1960, timestamp: "2026-01-08T15:30:00Z" },

  // ── 2026-01-09 ──────────────────────────────
  { id: "log-140", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "React Compiler 도입 시 기존 useMemo useCallback 제거 전략", response: "React Compiler 도입 마이그레이션 전략입니다...", input_tokens: 284, output_tokens: 730, cost_usd: 6.35, latency_ms: 1810, timestamp: "2026-01-09T09:00:00Z" },
  { id: "log-141", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "openai", model: "gpt-4o", prompt: "토스 디자인 시스템 분석 — semantic token 구조와 컴포넌트 구성 방식", response: "토스 디자인 시스템 구조 분석 결과입니다...", input_tokens: 218, output_tokens: 600, cost_usd: 4.88, latency_ms: 1450, timestamp: "2026-01-09T10:30:00Z" },
  { id: "log-142", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "crawler", model: "claude-sonnet-4", prompt: "AI 챗봇 공유 대화 링크 대량 수집 시 rate limit 준수하며 크롤링하는 방법", response: "대량 크롤링 rate limit 준수 방법입니다...", input_tokens: 336, output_tokens: 790, cost_usd: 6.83, latency_ms: 2160, timestamp: "2026-01-09T11:30:00Z" },
  { id: "log-143", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "claude-sonnet-4", prompt: "제품 프라이싱 전략 — per-seat vs usage-based 모델 전환 시점 판단 기준", response: "프라이싱 모델 전환 시점 판단 기준입니다...", input_tokens: 211, output_tokens: 840, cost_usd: 6.83, latency_ms: 2060, timestamp: "2026-01-09T13:00:00Z" },
  { id: "log-144", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "개발자 번아웃 예방 — 지속 가능한 팀 페이스 유지 방법", response: "개발자 번아웃 예방 방법을 정리했습니다...", input_tokens: 183, output_tokens: 690, cost_usd: 5.86, latency_ms: 1730, timestamp: "2026-01-09T14:30:00Z" },
  { id: "log-145", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "CSS @layer를 활용한 스타일 우선순위 관리 방법", response: "CSS @layer 활용법을 설명드립니다...", input_tokens: 139, output_tokens: 330, cost_usd: 0.98, latency_ms: 610, timestamp: "2026-01-09T15:30:00Z" },

  // ── 2026-01-13 ──────────────────────────────
  { id: "log-146", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Next.js parallel routes와 intercepting routes로 모달 패턴 구현하는 방법", response: "Next.js parallel/intercepting routes 모달 패턴입니다...", input_tokens: 303, output_tokens: 850, cost_usd: 7.32, latency_ms: 2010, timestamp: "2026-01-13T09:00:00Z" },
  { id: "log-147", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Drizzle ORM migration 자동화 — CI/CD 파이프라인에 통합하는 방법", response: "Drizzle ORM CI/CD 마이그레이션 통합 방법입니다...", input_tokens: 309, output_tokens: 790, cost_usd: 6.83, latency_ms: 1990, timestamp: "2026-01-13T10:30:00Z" },
  { id: "log-148", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "extension", model: "gpt-4o", prompt: "PWA 설치 프롬프트 UI 설계 — 거절 후 재노출 타이밍 전략", response: "PWA 설치 프롬프트 UX 설계 가이드입니다...", input_tokens: 207, output_tokens: 560, cost_usd: 4.39, latency_ms: 1380, timestamp: "2026-01-13T11:00:00Z" },
  { id: "log-149", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "gemini", model: "gemini-1.5-pro", prompt: "고객 세그먼트별 맞춤 온보딩 플로우 설계 — 개발자 vs 비개발자 차별화", response: "세그먼트별 온보딩 플로우 설계 방법입니다...", input_tokens: 229, output_tokens: 870, cost_usd: 3.91, latency_ms: 2360, timestamp: "2026-01-13T13:00:00Z" },
  { id: "log-150", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "openai", model: "gpt-4o", prompt: "팀 코드 품질 지표 자동 수집 — SonarQube + GitHub Actions 연동", response: "코드 품질 지표 자동화 설정 방법입니다...", input_tokens: 214, output_tokens: 750, cost_usd: 6.83, latency_ms: 1850, timestamp: "2026-01-13T14:30:00Z" },

  // ── 2026-01-14 ──────────────────────────────
  { id: "log-151", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Server Actions에서 파일 업로드 처리하는 방법 — multipart/form-data", response: "Server Actions 파일 업로드 처리 방법입니다...", input_tokens: 281, output_tokens: 720, cost_usd: 6.35, latency_ms: 1810, timestamp: "2026-01-14T09:30:00Z" },
  { id: "log-152", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Kafka Streams vs Apache Flink — 실시간 로그 집계 처리 선택 기준", response: "Kafka Streams vs Flink 비교 분석입니다...", input_tokens: 315, output_tokens: 810, cost_usd: 7.32, latency_ms: 2080, timestamp: "2026-01-14T10:30:00Z" },
  { id: "log-153", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "openai", model: "gpt-4o", prompt: "데이터 테이블에서 대용량 데이터 표시하는 UX — 가상 스크롤 vs 페이지네이션", response: "대용량 데이터 테이블 UX 비교 분석입니다...", input_tokens: 222, output_tokens: 590, cost_usd: 4.88, latency_ms: 1460, timestamp: "2026-01-14T11:30:00Z" },
  { id: "log-154", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "claude-sonnet-4", prompt: "B2B 영업 덱 구성 — AI 모니터링 솔루션 가치 제안 슬라이드", response: "B2B 영업 덱 가치 제안 구성 방법입니다...", input_tokens: 219, output_tokens: 870, cost_usd: 6.83, latency_ms: 2040, timestamp: "2026-01-14T13:30:00Z" },
  { id: "log-155", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "Node.js --watch 플래그로 개발 서버 자동 재시작 설정", response: "Node.js --watch 플래그 사용법입니다...", input_tokens: 126, output_tokens: 280, cost_usd: 0.98, latency_ms: 540, timestamp: "2026-01-14T14:30:00Z" },
  { id: "log-156", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "사내 AI 활용 교육 커리큘럼 설계 — 직무별 맞춤 교육 트랙", response: "AI 활용 교육 커리큘럼을 설계했습니다...", input_tokens: 228, output_tokens: 760, cost_usd: 6.35, latency_ms: 1860, timestamp: "2026-01-14T15:30:00Z" },

  // ── 2026-01-15 ──────────────────────────────
  { id: "log-157", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "crawler", model: "claude-sonnet-4", prompt: "Gemini 2.0 Flash 응답 수집 시 새로운 스트리밍 포맷 파싱 방법", response: "Gemini 2.0 Flash 응답 파싱 방법입니다...", input_tokens: 324, output_tokens: 780, cost_usd: 6.83, latency_ms: 2130, timestamp: "2026-01-15T09:00:00Z" },
  { id: "log-158", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Prisma와 Drizzle을 동시에 사용하는 마이그레이션 전략 — 점진적 전환", response: "Prisma → Drizzle 점진적 전환 전략입니다...", input_tokens: 292, output_tokens: 760, cost_usd: 6.83, latency_ms: 1870, timestamp: "2026-01-15T10:30:00Z" },
  { id: "log-159", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "extension", model: "claude-sonnet-4", prompt: "AI 로그 대시보드 UX 개선 — 데이터 밀도와 가독성 균형 잡기", response: "AI 로그 대시보드 UX 개선안을 제안합니다...", input_tokens: 235, output_tokens: 650, cost_usd: 5.86, latency_ms: 1590, timestamp: "2026-01-15T11:30:00Z" },
  { id: "log-160", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "gemini", model: "gemini-1.5-pro", prompt: "SaaS 계약 협상 전략 — 엔터프라이즈 고객 대상 custom pricing 접근법", response: "엔터프라이즈 SaaS 계약 협상 전략입니다...", input_tokens: 241, output_tokens: 900, cost_usd: 4.39, latency_ms: 2440, timestamp: "2026-01-15T13:00:00Z" },
  { id: "log-161", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "openai", model: "gpt-4o", prompt: "개발팀 성과 리뷰 프레임워크 — 360도 평가와 OKR 결과 통합 방법", response: "개발팀 성과 리뷰 프레임워크를 설계했습니다...", input_tokens: 207, output_tokens: 780, cost_usd: 6.83, latency_ms: 1920, timestamp: "2026-01-15T14:30:00Z" },
  { id: "log-162", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "React forwardRef를 useImperativeHandle과 함께 사용하는 패턴", response: "forwardRef + useImperativeHandle 패턴입니다...", input_tokens: 147, output_tokens: 360, cost_usd: 0.98, latency_ms: 660, timestamp: "2026-01-15T15:30:00Z" },

  // ── 2026-02-03 ──────────────────────────────
  { id: "log-163", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "use cache directive와 revalidate 태그로 세밀한 캐시 제어하는 방법", response: "Next.js use cache 세밀한 제어 방법입니다...", input_tokens: 287, output_tokens: 750, cost_usd: 6.83, latency_ms: 1830, timestamp: "2026-02-03T09:00:00Z" },
  { id: "log-164", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "AI 프록시 서버 아키텍처 설계 — 멀티 LLM 라우팅 및 fallback 전략", response: "멀티 LLM 프록시 아키텍처 설계안입니다...", input_tokens: 329, output_tokens: 840, cost_usd: 7.81, latency_ms: 2110, timestamp: "2026-02-03T10:30:00Z" },
  { id: "log-165", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "extension", model: "gpt-4o", prompt: "인터랙티브 데이터 시각화 컴포넌트 설계 — D3.js vs Recharts 선택 기준", response: "D3.js vs Recharts 비교 및 선택 기준입니다...", input_tokens: 220, output_tokens: 590, cost_usd: 4.88, latency_ms: 1430, timestamp: "2026-02-03T11:00:00Z" },
  { id: "log-166", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "claude-sonnet-4", prompt: "제품 베타 출시 전략 — 클로즈드 베타에서 오픈 베타로 전환 기준", response: "베타 출시 전략 및 전환 기준을 정리했습니다...", input_tokens: 208, output_tokens: 830, cost_usd: 6.35, latency_ms: 2000, timestamp: "2026-02-03T13:30:00Z" },
  { id: "log-167", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "AI 시대 개발자 커리어 로드맵 — 어떤 스킬을 키워야 하나", response: "AI 시대 개발자 커리어 로드맵을 제시합니다...", input_tokens: 199, output_tokens: 770, cost_usd: 6.35, latency_ms: 1870, timestamp: "2026-02-03T14:30:00Z" },
  { id: "log-168", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "Biome vs ESLint+Prettier — 린터/포매터 도구 선택 기준 2026", response: "Biome vs ESLint+Prettier 비교입니다...", input_tokens: 154, output_tokens: 380, cost_usd: 1.46, latency_ms: 690, timestamp: "2026-02-03T15:30:00Z" },

  // ── 2026-02-04 ──────────────────────────────
  { id: "log-169", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "AI 토큰 사용량 실시간 모니터링 시스템 아키텍처 — 비용 알림 포함", response: "AI 토큰 모니터링 시스템 설계안입니다...", input_tokens: 318, output_tokens: 820, cost_usd: 7.32, latency_ms: 2050, timestamp: "2026-02-04T09:00:00Z" },
  { id: "log-170", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Tanstack Router v2 도입 — 타입 안전한 라우팅 마이그레이션 가이드", response: "Tanstack Router v2 마이그레이션 가이드입니다...", input_tokens: 276, output_tokens: 720, cost_usd: 6.35, latency_ms: 1800, timestamp: "2026-02-04T10:30:00Z" },
  { id: "log-171", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "openai", model: "gpt-4o", prompt: "AI 생성 컨텐츠 품질 검수 UX — 사람 검토 워크플로우 설계", response: "AI 컨텐츠 검수 워크플로우 설계안입니다...", input_tokens: 213, output_tokens: 580, cost_usd: 4.88, latency_ms: 1440, timestamp: "2026-02-04T11:30:00Z" },
  { id: "log-172", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "gemini", model: "gemini-1.5-pro", prompt: "경쟁사 AI 모니터링 도구 기능 비교표 — Datadog AI Observability 분석", response: "AI 모니터링 도구 경쟁사 비교표를 작성했습니다...", input_tokens: 252, output_tokens: 940, cost_usd: 4.39, latency_ms: 2480, timestamp: "2026-02-04T13:00:00Z" },
  { id: "log-173", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Edge Config와 KV Store를 활용한 feature flag 시스템 구현", response: "Vercel Edge Config 기반 feature flag 구현 방법입니다...", input_tokens: 294, output_tokens: 760, cost_usd: 6.83, latency_ms: 1870, timestamp: "2026-02-04T14:30:00Z" },
  { id: "log-174", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "openai", model: "gpt-4o", prompt: "팀 AI 사용 데이터를 기반한 생산성 보고서 작성 방법", response: "AI 사용 데이터 기반 생산성 보고서 작성 방법입니다...", input_tokens: 218, output_tokens: 790, cost_usd: 6.83, latency_ms: 1940, timestamp: "2026-02-04T15:30:00Z" },

  // ── 2026-02-05 ──────────────────────────────
  { id: "log-175", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "crawler", model: "claude-sonnet-4", prompt: "Claude 3.7 Sonnet extended thinking 응답 파싱 — thinking 블록 처리 방법", response: "Claude extended thinking 응답 파싱 방법입니다...", input_tokens: 338, output_tokens: 800, cost_usd: 7.32, latency_ms: 2200, timestamp: "2026-02-05T09:00:00Z" },
  { id: "log-176", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "extension", model: "claude-sonnet-4", prompt: "SaaS 대시보드 네비게이션 패턴 — 사이드바 vs 탑바 UX 비교", response: "SaaS 네비게이션 패턴 비교 분석입니다...", input_tokens: 224, output_tokens: 610, cost_usd: 5.37, latency_ms: 1500, timestamp: "2026-02-05T10:30:00Z" },
  { id: "log-177", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "React Server Components에서 데이터 fetching 패턴 — waterfall 방지 방법", response: "RSC 데이터 fetching 최적화 패턴입니다...", input_tokens: 301, output_tokens: 800, cost_usd: 7.32, latency_ms: 1940, timestamp: "2026-02-05T11:00:00Z" },
  { id: "log-178", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "gpt-4o", prompt: "파트너십 제안서 작성 — 개발 도구 플랫폼과의 인테그레이션 협력 제안", response: "파트너십 제안서 초안을 작성했습니다...", input_tokens: 209, output_tokens: 850, cost_usd: 6.83, latency_ms: 2030, timestamp: "2026-02-05T13:30:00Z" },
  { id: "log-179", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Claude API 비용 최적화 — prompt caching 적용으로 반복 요청 비용 절감", response: "Claude API prompt caching 활용 방법입니다...", input_tokens: 244, output_tokens: 740, cost_usd: 6.35, latency_ms: 1800, timestamp: "2026-02-05T14:30:00Z" },
  { id: "log-180", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "useActionState 훅 사용법 — React 19 폼 액션 상태 관리", response: "useActionState 훅 사용법입니다...", input_tokens: 143, output_tokens: 340, cost_usd: 0.98, latency_ms: 620, timestamp: "2026-02-05T15:30:00Z" },

  // ── 2026-02-10 ──────────────────────────────
  { id: "log-181", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Vector DB 비교 — Pinecone vs Weaviate vs pgvector 실무 선택 기준", response: "Vector DB 비교 및 선택 기준입니다...", input_tokens: 316, output_tokens: 820, cost_usd: 7.32, latency_ms: 2080, timestamp: "2026-02-10T09:00:00Z" },
  { id: "log-182", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "AI SDK(Vercel) stream 응답을 커스텀 UI로 렌더링하는 방법", response: "Vercel AI SDK stream 커스텀 렌더링 방법입니다...", input_tokens: 282, output_tokens: 750, cost_usd: 6.35, latency_ms: 1840, timestamp: "2026-02-10T10:30:00Z" },
  { id: "log-183", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "gemini", model: "gemini-1.5-flash", prompt: "타이포그래피 가독성 개선 — line-height와 letter-spacing 최적값 찾기", response: "타이포그래피 가독성 최적화 가이드입니다...", input_tokens: 189, output_tokens: 530, cost_usd: 1.46, latency_ms: 1010, timestamp: "2026-02-10T11:00:00Z" },
  { id: "log-184", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "gemini", model: "gemini-1.5-pro", prompt: "AI 서비스 개인정보처리방침 작성 — GDPR 및 국내 개인정보보호법 준수", response: "AI 서비스 개인정보처리방침 초안을 작성했습니다...", input_tokens: 257, output_tokens: 960, cost_usd: 4.88, latency_ms: 2510, timestamp: "2026-02-10T13:00:00Z" },
  { id: "log-185", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "openai", model: "gpt-4o", prompt: "개발팀 AI 사용 월간 리포트 템플릿 — 비용 효율성 및 생산성 지표 포함", response: "개발팀 AI 사용 월간 리포트 템플릿입니다...", input_tokens: 224, output_tokens: 800, cost_usd: 7.32, latency_ms: 1950, timestamp: "2026-02-10T14:30:00Z" },
  { id: "log-186", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "TypeScript declaration merging으로 서드파티 타입 확장하는 방법", response: "TypeScript declaration merging 활용법입니다...", input_tokens: 146, output_tokens: 350, cost_usd: 0.98, latency_ms: 650, timestamp: "2026-02-10T15:30:00Z" },

  // ── 2026-02-17 ──────────────────────────────
  { id: "log-187", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Claude 3.7 Sonnet 새로운 기능 — extended thinking 활용 모범 사례", response: "Claude 3.7 Sonnet extended thinking 활용법입니다...", input_tokens: 297, output_tokens: 790, cost_usd: 6.83, latency_ms: 1970, timestamp: "2026-02-17T09:00:00Z" },
  { id: "log-188", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Gridge AI 로그 수집 SDK 설계 — 브라우저 익스텐션 통신 프로토콜", response: "AI 로그 수집 SDK 설계 방안입니다...", input_tokens: 335, output_tokens: 880, cost_usd: 7.81, latency_ms: 2150, timestamp: "2026-02-17T10:30:00Z" },
  { id: "log-189", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "extension", model: "gpt-4o", prompt: "복잡한 데이터 테이블에서 행 선택 + 일괄 작업 UX 패턴", response: "데이터 테이블 일괄 작업 UX 패턴입니다...", input_tokens: 215, output_tokens: 570, cost_usd: 4.88, latency_ms: 1420, timestamp: "2026-02-17T11:30:00Z" },
  { id: "log-190", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "claude-sonnet-4", prompt: "Gridge 서비스 베타 테스터 모집 공고 — 개발팀 대상 타겟 메시지", response: "베타 테스터 모집 공고문을 작성했습니다...", input_tokens: 211, output_tokens: 790, cost_usd: 6.35, latency_ms: 1960, timestamp: "2026-02-17T13:00:00Z" },
  { id: "log-191", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Gridge 팀 로드맵 Q2 2026 — 기능 우선순위 및 리소스 배분", response: "Q2 2026 팀 로드맵을 작성했습니다...", input_tokens: 231, output_tokens: 760, cost_usd: 6.35, latency_ms: 1820, timestamp: "2026-02-17T14:30:00Z" },
  { id: "log-192", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "Suspense fallback을 nested 구조로 설계하는 패턴", response: "Nested Suspense 설계 패턴입니다...", input_tokens: 138, output_tokens: 320, cost_usd: 0.98, latency_ms: 590, timestamp: "2026-02-17T15:30:00Z" },

  // ── 2026-02-24 ──────────────────────────────
  { id: "log-193", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "AI 응답 로그 벡터화 및 유사도 검색으로 중복 질문 탐지하는 방법", response: "AI 로그 벡터 유사도 기반 중복 탐지 방법입니다...", input_tokens: 321, output_tokens: 830, cost_usd: 7.32, latency_ms: 2060, timestamp: "2026-02-24T09:00:00Z" },
  { id: "log-194", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Gridge 대시보드 성능 최적화 — 대용량 로그 테이블 가상화 렌더링", response: "대시보드 성능 최적화 방법을 정리했습니다...", input_tokens: 308, output_tokens: 800, cost_usd: 7.32, latency_ms: 1980, timestamp: "2026-02-24T10:30:00Z" },
  { id: "log-195", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "openai", model: "gpt-4o", prompt: "AI Maturity Report 시각화 개선 — 레이더 차트 vs 히트맵 비교", response: "AI Maturity 시각화 개선안을 제안합니다...", input_tokens: 226, output_tokens: 610, cost_usd: 4.88, latency_ms: 1480, timestamp: "2026-02-24T11:00:00Z" },
  { id: "log-196", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "gemini", model: "gemini-1.5-pro", prompt: "Gridge 가격 정책 최종안 — 스타터/팀/엔터프라이즈 티어 설계", response: "Gridge 가격 정책 티어 설계안입니다...", input_tokens: 247, output_tokens: 920, cost_usd: 4.39, latency_ms: 2460, timestamp: "2026-02-24T13:30:00Z" },
  { id: "log-197", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Gridge 런칭 준비 체크리스트 — 인프라, 보안, 모니터링 점검 항목", response: "런칭 준비 체크리스트를 작성했습니다...", input_tokens: 243, output_tokens: 790, cost_usd: 6.83, latency_ms: 1900, timestamp: "2026-02-24T14:30:00Z" },
  { id: "log-198", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "vercel.json route rewrite 설정으로 API 프록시 구성하는 방법", response: "Vercel route rewrite 프록시 설정 방법입니다...", input_tokens: 141, output_tokens: 330, cost_usd: 0.98, latency_ms: 600, timestamp: "2026-02-24T15:30:00Z" },

  // ── 2026-03-03 ──────────────────────────────
  { id: "log-199", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "AI 사용 이상 탐지 알고리즘 — 비용 급증 및 비정상 패턴 실시간 감지", response: "AI 사용 이상 탐지 알고리즘 설계 방법입니다...", input_tokens: 312, output_tokens: 820, cost_usd: 7.32, latency_ms: 2040, timestamp: "2026-03-03T09:00:00Z" },
  { id: "log-200", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Gridge 로그 수집 Chrome Extension manifest v3 마이그레이션 가이드", response: "Chrome Extension MV3 마이그레이션 가이드입니다...", input_tokens: 315, output_tokens: 860, cost_usd: 7.81, latency_ms: 2020, timestamp: "2026-03-03T10:30:00Z" },
  { id: "log-201", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "extension", model: "claude-sonnet-4", prompt: "Gridge 랜딩 페이지 히어로 섹션 카피 — 개발팀 AI 모니터링 가치 전달", response: "Gridge 랜딩 히어로 카피를 작성했습니다...", input_tokens: 222, output_tokens: 580, cost_usd: 4.88, latency_ms: 1440, timestamp: "2026-03-03T11:00:00Z" },
  { id: "log-202", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "gpt-4o", prompt: "Gridge 첫 번째 고객 인터뷰 질문지 — 초기 사용자 페인포인트 발굴", response: "첫 번째 고객 인터뷰 질문지를 작성했습니다...", input_tokens: 196, output_tokens: 760, cost_usd: 6.35, latency_ms: 1880, timestamp: "2026-03-03T13:30:00Z" },
  { id: "log-203", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "openai", model: "gpt-4o", prompt: "Gridge 베타 피드백 수집 프로세스 — 정성/정량 데이터 통합 분석법", response: "베타 피드백 수집 및 분석 프로세스입니다...", input_tokens: 219, output_tokens: 790, cost_usd: 6.83, latency_ms: 1930, timestamp: "2026-03-03T14:30:00Z" },
  { id: "log-204", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "Web Workers와 SharedArrayBuffer로 무거운 데이터 처리 오프로딩", response: "Web Workers 데이터 처리 방법입니다...", input_tokens: 148, output_tokens: 360, cost_usd: 0.98, latency_ms: 650, timestamp: "2026-03-03T15:30:00Z" },

  // ── 2026-03-10 ──────────────────────────────
  { id: "log-205", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "LLM 응답 품질 자동 평가 파이프라인 — faithfulness, relevance 스코어 계산", response: "LLM 응답 품질 자동 평가 파이프라인입니다...", input_tokens: 327, output_tokens: 840, cost_usd: 7.81, latency_ms: 2140, timestamp: "2026-03-10T09:00:00Z" },
  { id: "log-206", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Gridge 로그 대시보드에 실시간 업데이트 추가 — SSE vs WebSocket 선택", response: "실시간 대시보드 업데이트 구현 방법입니다...", input_tokens: 294, output_tokens: 780, cost_usd: 6.83, latency_ms: 1900, timestamp: "2026-03-10T10:30:00Z" },
  { id: "log-207", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "gemini", model: "gemini-1.5-flash", prompt: "Gridge 모바일 반응형 대시보드 — 테이블 레이아웃 모바일 최적화 방법", response: "모바일 대시보드 테이블 최적화 방법입니다...", input_tokens: 204, output_tokens: 560, cost_usd: 1.46, latency_ms: 1020, timestamp: "2026-03-10T11:00:00Z" },
  { id: "log-208", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "gemini", model: "gemini-1.5-pro", prompt: "Gridge Q1 성과 분석 및 Q2 목표 조정 — 베타 지표 기반 전략 수정", response: "Q1 성과 분석 및 Q2 목표 조정안입니다...", input_tokens: 253, output_tokens: 930, cost_usd: 4.88, latency_ms: 2490, timestamp: "2026-03-10T13:30:00Z" },
  { id: "log-209", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Gridge 팀 AI 사용 현황 분석 — 3개월 트렌드 리포트 작성", response: "3개월 AI 사용 트렌드 리포트를 작성했습니다...", input_tokens: 237, output_tokens: 780, cost_usd: 6.83, latency_ms: 1870, timestamp: "2026-03-10T14:30:00Z" },
  { id: "log-210", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "React 19 use() 훅으로 비동기 데이터 처리하는 패턴", response: "React 19 use() 훅 활용 패턴입니다...", input_tokens: 144, output_tokens: 340, cost_usd: 0.98, latency_ms: 630, timestamp: "2026-03-10T15:30:00Z" },

  // ── 2026-03-24 ──────────────────────────────
  { id: "log-211", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "멀티 테넌트 아키텍처에서 AI 로그 데이터 격리 방법 — row-level security 적용", response: "멀티 테넌트 AI 로그 격리 방법입니다...", input_tokens: 330, output_tokens: 840, cost_usd: 7.81, latency_ms: 2120, timestamp: "2026-03-24T09:00:00Z" },
  { id: "log-212", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Gridge 대시보드 날짜 필터 + 페이지네이션 구현 — useMemo 최적화", response: "날짜 필터 + 페이지네이션 구현 방법입니다...", input_tokens: 286, output_tokens: 740, cost_usd: 6.35, latency_ms: 1810, timestamp: "2026-03-24T10:30:00Z" },
  { id: "log-213", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "extension", model: "gpt-4o", prompt: "Gridge AI Maturity Report 시각화 — 성장 인사이트 카드 UX 개선안", response: "AI Maturity Report UX 개선안을 제안합니다...", input_tokens: 228, output_tokens: 620, cost_usd: 5.37, latency_ms: 1510, timestamp: "2026-03-24T11:00:00Z" },
  { id: "log-214", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "extension", model: "claude-sonnet-4", prompt: "Gridge 정식 출시 PR 전략 — 개발자 커뮤니티 채널별 런칭 메시지", response: "정식 출시 PR 전략 및 메시지 초안입니다...", input_tokens: 217, output_tokens: 860, cost_usd: 6.83, latency_ms: 2050, timestamp: "2026-03-24T13:30:00Z" },
  { id: "log-215", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "openai", model: "gpt-4o", prompt: "Gridge 서비스 SLA 문서 작성 — 가용성, 응답시간, 지원 정책 정의", response: "Gridge 서비스 SLA 문서 초안입니다...", input_tokens: 223, output_tokens: 800, cost_usd: 7.32, latency_ms: 1950, timestamp: "2026-03-24T14:30:00Z" },
  { id: "log-216", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "Intersection Observer API로 무한 스크롤 구현하는 방법", response: "Intersection Observer 무한 스크롤 구현 방법입니다...", input_tokens: 140, output_tokens: 330, cost_usd: 0.98, latency_ms: 600, timestamp: "2026-03-24T15:30:00Z" },

  // ── 2026-03-29 ──────────────────────────────
  { id: "log-217", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Gridge 로그 수집 API rate limit 설계 — 테넌트별 quota 관리 방법", response: "API rate limit 및 quota 관리 설계 방법입니다...", input_tokens: 308, output_tokens: 800, cost_usd: 7.32, latency_ms: 2010, timestamp: "2026-03-29T09:00:00Z" },
  { id: "log-218", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "페이지네이션 + 날짜 필터 조합 시 URL state 동기화하는 방법", response: "URL state 동기화 구현 방법입니다...", input_tokens: 274, output_tokens: 720, cost_usd: 6.35, latency_ms: 1780, timestamp: "2026-03-29T10:00:00Z" },
  { id: "log-219", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "openai", model: "gpt-4o", prompt: "Gridge 빈 상태(empty state) 일러스트 방향성 — 기술적 무드보드 제안", response: "Gridge empty state 일러스트 방향성을 제안합니다...", input_tokens: 211, output_tokens: 570, cost_usd: 4.88, latency_ms: 1400, timestamp: "2026-03-29T10:30:00Z" },
  { id: "log-220", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "gemini", model: "gemini-1.5-pro", prompt: "오늘 팀 스탠드업 — Gridge 데모 준비 현황 및 블로커 정리", response: "오늘 스탠드업 내용을 정리했습니다...", input_tokens: 186, output_tokens: 680, cost_usd: 3.42, latency_ms: 1890, timestamp: "2026-03-29T11:00:00Z" },
  { id: "log-221", user_id: "u-005", user_name: "김태영", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "Gridge 팀 오늘의 AI 사용 요약 — 비용 효율성 및 주요 활용 사례", response: "오늘의 AI 사용 요약 리포트입니다...", input_tokens: 228, output_tokens: 750, cost_usd: 6.35, latency_ms: 1820, timestamp: "2026-03-29T11:30:00Z" },
  { id: "log-222", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-haiku", prompt: "CSS scroll-timeline API로 스크롤 연동 애니메이션 구현하는 방법", response: "CSS scroll-timeline 애니메이션 구현 방법입니다...", input_tokens: 148, output_tokens: 350, cost_usd: 0.98, latency_ms: 640, timestamp: "2026-03-29T14:00:00Z" },

  // ── Agent Mode Logs ──────────────────────────────
  {
    id: "log-agent-001", user_id: "u-001", user_name: "강지수", team: "개발팀",
    channel: "anthropic", model: "claude-sonnet-4",
    prompt: "사용자 알림 설정 페이지를 만들어줘. API 라우트 + UI 컴포넌트 + Zustand 스토어까지 전부.",
    response: "알림 설정 기능을 구현 완료했습니다. 총 6개 파일을 생성/수정했습니다. API 라우트에서 알림 CRUD를 처리하고, Zustand 스토어로 클라이언트 상태를 관리합니다.",
    input_tokens: 4820, output_tokens: 12400, cost_usd: 48.32, latency_ms: 142000,
    timestamp: "2026-03-20T09:30:00Z", mode: "agent",
    agent_detail: {
      session_id: "ses-001", session_duration_ms: 142000, total_steps: 5, total_tool_calls: 23,
      files_changed: [
        { path: "app/api/notifications/route.ts", action: "created", additions: 45, deletions: 0, language: "typescript" },
        { path: "app/settings/notifications/page.tsx", action: "created", additions: 128, deletions: 0, language: "tsx" },
        { path: "lib/stores/notificationStore.ts", action: "created", additions: 38, deletions: 0, language: "typescript" },
        { path: "components/NotificationToggle.tsx", action: "created", additions: 52, deletions: 0, language: "tsx" },
        { path: "lib/types/notification.ts", action: "created", additions: 22, deletions: 0, language: "typescript" },
        { path: "app/layout.tsx", action: "modified", additions: 4, deletions: 1, language: "tsx" },
      ],
      steps: [
        { step: 1, phase: "plan", description: "기존 설정 페이지 구조 분석 및 알림 기능 설계",
          tool_calls: [
            { id: "tc-001", type: "glob", input: "app/settings/**/*", output_summary: "Found 3 existing setting pages", timestamp: "2026-03-20T09:30:10Z", duration_ms: 120 },
            { id: "tc-002", type: "file_read", input: "app/settings/page.tsx", output_summary: "Read settings layout (62 lines)", timestamp: "2026-03-20T09:30:15Z", duration_ms: 80 },
            { id: "tc-003", type: "file_read", input: "lib/types/index.ts", output_summary: "Read existing type definitions", timestamp: "2026-03-20T09:30:20Z", duration_ms: 65 },
          ], timestamp: "2026-03-20T09:30:10Z" },
        { step: 2, phase: "execute", description: "알림 타입 정의 및 Zustand 스토어 생성",
          tool_calls: [
            { id: "tc-004", type: "file_write", input: "lib/types/notification.ts", output_summary: "Created NotificationType, NotificationPreference types", timestamp: "2026-03-20T09:31:00Z", duration_ms: 200 },
            { id: "tc-005", type: "file_write", input: "lib/stores/notificationStore.ts", output_summary: "Created useNotificationStore with CRUD actions", timestamp: "2026-03-20T09:31:30Z", duration_ms: 350 },
          ], timestamp: "2026-03-20T09:31:00Z" },
        { step: 3, phase: "execute", description: "API 라우트 및 UI 컴포넌트 구현",
          tool_calls: [
            { id: "tc-006", type: "file_write", input: "app/api/notifications/route.ts", output_summary: "Created GET/POST/PATCH handlers", timestamp: "2026-03-20T09:32:00Z", duration_ms: 400 },
            { id: "tc-007", type: "file_write", input: "components/NotificationToggle.tsx", output_summary: "Created toggle component with category groups", timestamp: "2026-03-20T09:32:30Z", duration_ms: 300 },
            { id: "tc-008", type: "file_write", input: "app/settings/notifications/page.tsx", output_summary: "Created full settings page with form", timestamp: "2026-03-20T09:33:00Z", duration_ms: 500 },
            { id: "tc-009", type: "edit", input: "app/layout.tsx", output_summary: "Added NotificationProvider to root layout", timestamp: "2026-03-20T09:33:20Z", duration_ms: 150 },
          ], timestamp: "2026-03-20T09:32:00Z" },
        { step: 4, phase: "verify", description: "TypeScript 타입 체크 및 빌드 검증",
          tool_calls: [
            { id: "tc-010", type: "bash", input: "npx tsc --noEmit", output_summary: "No errors found", timestamp: "2026-03-20T09:34:00Z", duration_ms: 8500 },
            { id: "tc-011", type: "bash", input: "npm run build", output_summary: "Build succeeded — 12 pages generated", timestamp: "2026-03-20T09:34:30Z", duration_ms: 15000 },
          ], timestamp: "2026-03-20T09:34:00Z" },
        { step: 5, phase: "verify", description: "브라우저 렌더링 확인",
          tool_calls: [
            { id: "tc-012", type: "bash", input: "curl -s http://localhost:3000/settings/notifications | head -5", output_summary: "Page renders successfully — 200 OK", timestamp: "2026-03-20T09:35:00Z", duration_ms: 1200 },
          ], timestamp: "2026-03-20T09:35:00Z" },
      ],
      code_artifacts: [
        { filename: "app/api/notifications/route.ts", language: "typescript", snippet: "export async function GET() {\n  const prefs = await db.notification.findMany();\n  return NextResponse.json(prefs);\n}\n\nexport async function PATCH(req: Request) {\n  const body = await req.json();\n  const updated = await db.notification.update({ ... });\n  return NextResponse.json(updated);\n}" },
        { filename: "lib/stores/notificationStore.ts", language: "typescript", snippet: "export const useNotificationStore = create<NotificationState>((set) => ({\n  preferences: [],\n  loading: false,\n  toggleCategory: (cat) => set((s) => ({ ... })),\n  fetchPreferences: async () => { ... },\n}));" },
      ],
      summary: "알림 설정 풀스택 구현: API 라우트(CRUD) + Zustand 스토어 + 설정 UI 페이지 + 토글 컴포넌트. 6개 파일 생성/수정, 빌드 검증 완료.",
    },
  },
  {
    id: "log-agent-002", user_id: "u-002", user_name: "이민준", team: "개발팀",
    channel: "anthropic", model: "claude-sonnet-4",
    prompt: "프로덕션에서 /api/auth/callback 라우트가 간헐적으로 500 에러를 반환하고 있어. 원인 찾아서 수정해줘.",
    response: "버그를 찾아 수정했습니다. race condition으로 인해 세션 토큰이 만료된 상태에서 refresh가 동시에 호출되는 문제였습니다.",
    input_tokens: 3200, output_tokens: 8900, cost_usd: 34.15, latency_ms: 98000,
    timestamp: "2026-03-21T14:20:00Z", mode: "agent",
    agent_detail: {
      session_id: "ses-002", session_duration_ms: 98000, total_steps: 4, total_tool_calls: 18,
      files_changed: [
        { path: "app/api/auth/callback/route.ts", action: "modified", additions: 12, deletions: 5, language: "typescript" },
        { path: "lib/auth/session.ts", action: "modified", additions: 18, deletions: 8, language: "typescript" },
        { path: "lib/auth/__tests__/session.test.ts", action: "created", additions: 45, deletions: 0, language: "typescript" },
      ],
      steps: [
        { step: 1, phase: "plan", description: "에러 로그 및 라우트 코드 분석",
          tool_calls: [
            { id: "tc-101", type: "file_read", input: "app/api/auth/callback/route.ts", output_summary: "Read auth callback handler (78 lines)", timestamp: "2026-03-21T14:20:10Z", duration_ms: 90 },
            { id: "tc-102", type: "grep", input: "refreshToken", output_summary: "Found 8 references across 4 files", timestamp: "2026-03-21T14:20:20Z", duration_ms: 150 },
            { id: "tc-103", type: "file_read", input: "lib/auth/session.ts", output_summary: "Read session management module (120 lines)", timestamp: "2026-03-21T14:20:30Z", duration_ms: 85 },
          ], timestamp: "2026-03-21T14:20:10Z" },
        { step: 2, phase: "execute", description: "세션 refresh 로직에 mutex lock 추가",
          tool_calls: [
            { id: "tc-104", type: "edit", input: "lib/auth/session.ts", output_summary: "Added mutex lock around token refresh", timestamp: "2026-03-21T14:21:00Z", duration_ms: 280 },
            { id: "tc-105", type: "edit", input: "app/api/auth/callback/route.ts", output_summary: "Added error boundary and retry logic", timestamp: "2026-03-21T14:21:30Z", duration_ms: 220 },
          ], timestamp: "2026-03-21T14:21:00Z" },
        { step: 3, phase: "verify", description: "유닛 테스트 작성 및 실행",
          tool_calls: [
            { id: "tc-106", type: "file_write", input: "lib/auth/__tests__/session.test.ts", output_summary: "Created concurrent refresh test cases", timestamp: "2026-03-21T14:22:00Z", duration_ms: 400 },
            { id: "tc-107", type: "bash", input: "npx jest lib/auth/__tests__/session.test.ts", output_summary: "5 tests passed, 0 failed", timestamp: "2026-03-21T14:22:30Z", duration_ms: 4200 },
          ], timestamp: "2026-03-21T14:22:00Z" },
        { step: 4, phase: "verify", description: "통합 빌드 및 타입 검증",
          tool_calls: [
            { id: "tc-108", type: "bash", input: "npx tsc --noEmit", output_summary: "No errors", timestamp: "2026-03-21T14:23:00Z", duration_ms: 7800 },
          ], timestamp: "2026-03-21T14:23:00Z" },
      ],
      code_artifacts: [
        { filename: "lib/auth/session.ts", language: "typescript", snippet: "const refreshMutex = new Mutex();\n\nexport async function refreshSession(token: string) {\n  return refreshMutex.runExclusive(async () => {\n    const current = await getSession(token);\n    if (!current.isExpired()) return current;\n    return await requestNewToken(current.refreshToken);\n  });\n}" },
      ],
      summary: "인증 콜백 500 에러 수정: race condition으로 인한 동시 토큰 refresh 문제. mutex lock 추가 + 테스트 커버리지 확보.",
    },
  },
  {
    id: "log-agent-003", user_id: "u-005", user_name: "김태영", team: "개발팀",
    channel: "anthropic", model: "claude-sonnet-4",
    prompt: "lib/api 디렉토리의 클라이언트 코드를 리팩토링해줘. 중복된 fetch wrapper를 통합하고, 에러 핸들링을 표준화해.",
    response: "API 클라이언트 리팩토링을 완료했습니다. 4개의 중복 fetch wrapper를 하나의 통합 클라이언트로 교체하고, 표준 에러 핸들링 레이어를 추가했습니다.",
    input_tokens: 5100, output_tokens: 14200, cost_usd: 55.80, latency_ms: 185000,
    timestamp: "2026-03-22T10:00:00Z", mode: "agent",
    agent_detail: {
      session_id: "ses-003", session_duration_ms: 185000, total_steps: 6, total_tool_calls: 28,
      files_changed: [
        { path: "lib/api/client.ts", action: "created", additions: 85, deletions: 0, language: "typescript" },
        { path: "lib/api/errors.ts", action: "created", additions: 42, deletions: 0, language: "typescript" },
        { path: "lib/api/users.ts", action: "modified", additions: 12, deletions: 38, language: "typescript" },
        { path: "lib/api/projects.ts", action: "modified", additions: 10, deletions: 35, language: "typescript" },
        { path: "lib/api/notifications.ts", action: "modified", additions: 8, deletions: 30, language: "typescript" },
        { path: "lib/api/analytics.ts", action: "modified", additions: 9, deletions: 32, language: "typescript" },
        { path: "lib/api/fetchWrapper.ts", action: "deleted", additions: 0, deletions: 45, language: "typescript" },
      ],
      steps: [
        { step: 1, phase: "plan", description: "기존 API 클라이언트 구조 분석 및 중복 패턴 파악",
          tool_calls: [
            { id: "tc-201", type: "glob", input: "lib/api/**/*.ts", output_summary: "Found 6 API client files", timestamp: "2026-03-22T10:00:10Z", duration_ms: 100 },
            { id: "tc-202", type: "file_read", input: "lib/api/users.ts", output_summary: "Read users API (62 lines) — custom fetch wrapper", timestamp: "2026-03-22T10:00:15Z", duration_ms: 70 },
            { id: "tc-203", type: "file_read", input: "lib/api/projects.ts", output_summary: "Read projects API (58 lines) — duplicated fetch logic", timestamp: "2026-03-22T10:00:20Z", duration_ms: 70 },
            { id: "tc-204", type: "grep", input: "fetch\\(.*baseUrl", output_summary: "Found 12 duplicated fetch calls", timestamp: "2026-03-22T10:00:30Z", duration_ms: 200 },
          ], timestamp: "2026-03-22T10:00:10Z" },
        { step: 2, phase: "execute", description: "통합 API 클라이언트 및 에러 핸들러 생성",
          tool_calls: [
            { id: "tc-205", type: "file_write", input: "lib/api/errors.ts", output_summary: "Created ApiError class + error parser", timestamp: "2026-03-22T10:01:00Z", duration_ms: 300 },
            { id: "tc-206", type: "file_write", input: "lib/api/client.ts", output_summary: "Created unified apiClient with interceptors", timestamp: "2026-03-22T10:01:30Z", duration_ms: 500 },
          ], timestamp: "2026-03-22T10:01:00Z" },
        { step: 3, phase: "execute", description: "각 도메인 API 파일을 통합 클라이언트로 마이그레이션",
          tool_calls: [
            { id: "tc-207", type: "edit", input: "lib/api/users.ts", output_summary: "Replaced custom fetch with apiClient.get/post", timestamp: "2026-03-22T10:02:00Z", duration_ms: 250 },
            { id: "tc-208", type: "edit", input: "lib/api/projects.ts", output_summary: "Migrated to apiClient", timestamp: "2026-03-22T10:02:20Z", duration_ms: 220 },
            { id: "tc-209", type: "edit", input: "lib/api/notifications.ts", output_summary: "Migrated to apiClient", timestamp: "2026-03-22T10:02:40Z", duration_ms: 200 },
            { id: "tc-210", type: "edit", input: "lib/api/analytics.ts", output_summary: "Migrated to apiClient", timestamp: "2026-03-22T10:03:00Z", duration_ms: 210 },
          ], timestamp: "2026-03-22T10:02:00Z" },
        { step: 4, phase: "execute", description: "레거시 fetch wrapper 삭제",
          tool_calls: [
            { id: "tc-211", type: "bash", input: "rm lib/api/fetchWrapper.ts", output_summary: "Deleted legacy file", timestamp: "2026-03-22T10:03:20Z", duration_ms: 50 },
            { id: "tc-212", type: "grep", input: "fetchWrapper", output_summary: "No remaining references found", timestamp: "2026-03-22T10:03:25Z", duration_ms: 180 },
          ], timestamp: "2026-03-22T10:03:20Z" },
        { step: 5, phase: "verify", description: "TypeScript 검증",
          tool_calls: [
            { id: "tc-213", type: "bash", input: "npx tsc --noEmit", output_summary: "No errors", timestamp: "2026-03-22T10:04:00Z", duration_ms: 8200 },
          ], timestamp: "2026-03-22T10:04:00Z" },
        { step: 6, phase: "iterate", description: "에러 타입 가드 추가 (tsc에서 narrowing 경고 발견)",
          tool_calls: [
            { id: "tc-214", type: "edit", input: "lib/api/errors.ts", output_summary: "Added isApiError type guard", timestamp: "2026-03-22T10:04:30Z", duration_ms: 180 },
            { id: "tc-215", type: "bash", input: "npx tsc --noEmit", output_summary: "No errors", timestamp: "2026-03-22T10:04:45Z", duration_ms: 7900 },
          ], timestamp: "2026-03-22T10:04:30Z" },
      ],
      code_artifacts: [
        { filename: "lib/api/client.ts", language: "typescript", snippet: "class ApiClient {\n  private baseUrl: string;\n  private headers: HeadersInit;\n\n  async get<T>(path: string): Promise<T> {\n    const res = await fetch(`${this.baseUrl}${path}`, {\n      headers: this.headers,\n    });\n    if (!res.ok) throw ApiError.fromResponse(res);\n    return res.json();\n  }\n}\n\nexport const apiClient = new ApiClient({ baseUrl: process.env.API_URL! });" },
        { filename: "lib/api/errors.ts", language: "typescript", snippet: "export class ApiError extends Error {\n  constructor(\n    public status: number,\n    public code: string,\n    message: string,\n  ) { super(message); }\n\n  static fromResponse(res: Response) { ... }\n}\n\nexport function isApiError(e: unknown): e is ApiError {\n  return e instanceof ApiError;\n}" },
      ],
      summary: "API 클라이언트 리팩토링: 4개 중복 fetch wrapper → 1개 통합 클라이언트. 표준 에러 핸들링 추가. 7개 파일 변경, 레거시 코드 삭제.",
    },
  },
  {
    id: "log-agent-004", user_id: "u-001", user_name: "강지수", team: "개발팀",
    channel: "openai", model: "gpt-4o",
    prompt: "GitHub Actions CI/CD 파이프라인 세팅해줘. PR에 lint + test + build 체크, main 머지 시 Vercel 자동 배포.",
    response: "CI/CD 파이프라인 구성을 완료했습니다. PR 체크 워크플로우와 배포 워크플로우를 분리하여 생성했습니다.",
    input_tokens: 2800, output_tokens: 7500, cost_usd: 28.40, latency_ms: 76000,
    timestamp: "2026-03-23T11:00:00Z", mode: "agent",
    agent_detail: {
      session_id: "ses-004", session_duration_ms: 76000, total_steps: 4, total_tool_calls: 14,
      files_changed: [
        { path: ".github/workflows/ci.yml", action: "created", additions: 52, deletions: 0, language: "yaml" },
        { path: ".github/workflows/deploy.yml", action: "created", additions: 38, deletions: 0, language: "yaml" },
        { path: "package.json", action: "modified", additions: 3, deletions: 1, language: "json" },
      ],
      steps: [
        { step: 1, phase: "plan", description: "기존 프로젝트 설정 및 스크립트 분석",
          tool_calls: [
            { id: "tc-301", type: "file_read", input: "package.json", output_summary: "Read package.json — scripts: dev, build, lint, test", timestamp: "2026-03-23T11:00:10Z", duration_ms: 60 },
            { id: "tc-302", type: "glob", input: ".github/**/*", output_summary: "No existing workflows found", timestamp: "2026-03-23T11:00:15Z", duration_ms: 80 },
          ], timestamp: "2026-03-23T11:00:10Z" },
        { step: 2, phase: "execute", description: "CI 워크플로우 생성 (lint + test + build)",
          tool_calls: [
            { id: "tc-303", type: "bash", input: "mkdir -p .github/workflows", output_summary: "Created directory", timestamp: "2026-03-23T11:01:00Z", duration_ms: 40 },
            { id: "tc-304", type: "file_write", input: ".github/workflows/ci.yml", output_summary: "Created PR check workflow", timestamp: "2026-03-23T11:01:10Z", duration_ms: 350 },
          ], timestamp: "2026-03-23T11:01:00Z" },
        { step: 3, phase: "execute", description: "배포 워크플로우 생성",
          tool_calls: [
            { id: "tc-305", type: "file_write", input: ".github/workflows/deploy.yml", output_summary: "Created deploy workflow with Vercel CLI", timestamp: "2026-03-23T11:02:00Z", duration_ms: 300 },
            { id: "tc-306", type: "edit", input: "package.json", output_summary: "Added ci script combining lint+test+build", timestamp: "2026-03-23T11:02:20Z", duration_ms: 120 },
          ], timestamp: "2026-03-23T11:02:00Z" },
        { step: 4, phase: "verify", description: "YAML 문법 검증",
          tool_calls: [
            { id: "tc-307", type: "bash", input: "npx yaml-lint .github/workflows/*.yml", output_summary: "2 files validated, no errors", timestamp: "2026-03-23T11:03:00Z", duration_ms: 2100 },
          ], timestamp: "2026-03-23T11:03:00Z" },
      ],
      code_artifacts: [
        { filename: ".github/workflows/ci.yml", language: "yaml", snippet: "name: CI\non:\n  pull_request:\n    branches: [main]\njobs:\n  check:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n      - run: npm ci\n      - run: npm run lint\n      - run: npm test\n      - run: npm run build" },
      ],
      summary: "CI/CD 파이프라인 구성: PR 체크(lint+test+build) + main 머지 시 Vercel 자동 배포. 3개 파일 생성/수정.",
    },
  },
  {
    id: "log-agent-005", user_id: "u-002", user_name: "이민준", team: "개발팀",
    channel: "anthropic", model: "claude-sonnet-4",
    prompt: "lib/utils 디렉토리에 있는 유틸 함수들에 대해 테스트 코드를 자동으로 생성해줘. 커버리지 80% 이상 목표.",
    response: "lib/utils 내 5개 모듈에 대한 테스트 파일을 생성했습니다. 총 32개 테스트 케이스, 커버리지 87% 달성했습니다.",
    input_tokens: 3600, output_tokens: 11800, cost_usd: 42.50, latency_ms: 125000,
    timestamp: "2026-03-24T16:00:00Z", mode: "agent",
    agent_detail: {
      session_id: "ses-005", session_duration_ms: 125000, total_steps: 4, total_tool_calls: 20,
      files_changed: [
        { path: "lib/utils/__tests__/format.test.ts", action: "created", additions: 68, deletions: 0, language: "typescript" },
        { path: "lib/utils/__tests__/validate.test.ts", action: "created", additions: 55, deletions: 0, language: "typescript" },
        { path: "lib/utils/__tests__/date.test.ts", action: "created", additions: 42, deletions: 0, language: "typescript" },
        { path: "lib/utils/__tests__/transform.test.ts", action: "created", additions: 38, deletions: 0, language: "typescript" },
        { path: "lib/utils/__tests__/crypto.test.ts", action: "created", additions: 30, deletions: 0, language: "typescript" },
      ],
      steps: [
        { step: 1, phase: "plan", description: "유틸리티 모듈 스캔 및 함수 시그니처 분석",
          tool_calls: [
            { id: "tc-401", type: "glob", input: "lib/utils/*.ts", output_summary: "Found 5 utility modules", timestamp: "2026-03-24T16:00:10Z", duration_ms: 90 },
            { id: "tc-402", type: "file_read", input: "lib/utils/format.ts", output_summary: "8 exported functions (formatCurrency, formatDate, ...)", timestamp: "2026-03-24T16:00:15Z", duration_ms: 75 },
            { id: "tc-403", type: "file_read", input: "lib/utils/validate.ts", output_summary: "6 exported functions (isEmail, isPhone, ...)", timestamp: "2026-03-24T16:00:20Z", duration_ms: 70 },
            { id: "tc-404", type: "file_read", input: "lib/utils/date.ts", output_summary: "5 exported functions", timestamp: "2026-03-24T16:00:25Z", duration_ms: 65 },
            { id: "tc-405", type: "file_read", input: "lib/utils/transform.ts", output_summary: "4 exported functions", timestamp: "2026-03-24T16:00:30Z", duration_ms: 60 },
            { id: "tc-406", type: "file_read", input: "lib/utils/crypto.ts", output_summary: "3 exported functions", timestamp: "2026-03-24T16:00:35Z", duration_ms: 55 },
          ], timestamp: "2026-03-24T16:00:10Z" },
        { step: 2, phase: "execute", description: "5개 모듈 테스트 파일 생성",
          tool_calls: [
            { id: "tc-407", type: "file_write", input: "lib/utils/__tests__/format.test.ts", output_summary: "Created 10 test cases", timestamp: "2026-03-24T16:01:00Z", duration_ms: 600 },
            { id: "tc-408", type: "file_write", input: "lib/utils/__tests__/validate.test.ts", output_summary: "Created 8 test cases", timestamp: "2026-03-24T16:01:30Z", duration_ms: 500 },
            { id: "tc-409", type: "file_write", input: "lib/utils/__tests__/date.test.ts", output_summary: "Created 6 test cases", timestamp: "2026-03-24T16:02:00Z", duration_ms: 450 },
            { id: "tc-410", type: "file_write", input: "lib/utils/__tests__/transform.test.ts", output_summary: "Created 5 test cases", timestamp: "2026-03-24T16:02:30Z", duration_ms: 400 },
            { id: "tc-411", type: "file_write", input: "lib/utils/__tests__/crypto.test.ts", output_summary: "Created 3 test cases", timestamp: "2026-03-24T16:03:00Z", duration_ms: 350 },
          ], timestamp: "2026-03-24T16:01:00Z" },
        { step: 3, phase: "verify", description: "전체 테스트 실행",
          tool_calls: [
            { id: "tc-412", type: "bash", input: "npx jest lib/utils --coverage", output_summary: "32 tests passed, coverage: 87.3%", timestamp: "2026-03-24T16:04:00Z", duration_ms: 6800 },
          ], timestamp: "2026-03-24T16:04:00Z" },
        { step: 4, phase: "iterate", description: "커버리지 미달 함수 추가 테스트",
          tool_calls: [
            { id: "tc-413", type: "edit", input: "lib/utils/__tests__/crypto.test.ts", output_summary: "Added edge case tests for hash function", timestamp: "2026-03-24T16:04:30Z", duration_ms: 250 },
            { id: "tc-414", type: "bash", input: "npx jest lib/utils --coverage", output_summary: "34 tests passed, coverage: 91.2%", timestamp: "2026-03-24T16:05:00Z", duration_ms: 7100 },
          ], timestamp: "2026-03-24T16:04:30Z" },
      ],
      code_artifacts: [
        { filename: "lib/utils/__tests__/format.test.ts", language: "typescript", snippet: "describe('formatCurrency', () => {\n  it('formats KRW with comma separators', () => {\n    expect(formatCurrency(1234567)).toBe('₩1,234,567');\n  });\n  it('handles zero', () => {\n    expect(formatCurrency(0)).toBe('₩0');\n  });\n});" },
      ],
      summary: "lib/utils 테스트 자동 생성: 5개 모듈, 34개 테스트 케이스, 커버리지 91.2% 달성. edge case 보강 포함.",
    },
  },

  // ── 위험 로그 (보안 감지 대상) ──────────────────────────────
  { id: "log-risk-001", user_id: "u-001", user_name: "강지수", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "이 API 키를 사용해서 외부 서비스 연동 코드를 작성해줘: sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234", response: "API 키를 사용한 연동 코드를 작성했습니다. 하지만 API 키를 코드에 직접 포함하는 것은 보안상 위험합니다...", input_tokens: 280, output_tokens: 650, cost_usd: 5.12, latency_ms: 1450, timestamp: "2026-03-25T09:15:00Z" },
  { id: "log-risk-002", user_id: "u-004", user_name: "최현우", team: "기획팀", channel: "gemini", model: "gemini-1.5-pro", prompt: "요즘 재밌는 PC 게임 추천해줘. RPG 장르 위주로. 스팀에서 할인하는 것도 알려줘.", response: "최근 인기 RPG 게임을 추천해 드리겠습니다. 1. Baldur's Gate 3 2. Elden Ring...", input_tokens: 85, output_tokens: 420, cost_usd: 1.85, latency_ms: 980, timestamp: "2026-03-25T13:40:00Z" },
  { id: "log-risk-003", user_id: "u-002", user_name: "이민준", team: "개발팀", channel: "anthropic", model: "claude-sonnet-4", prompt: "ThinkTrace 프로젝트의 내부 아키텍처 다이어그램을 만들어줘. DB 비밀번호는 Prod_DB_p@ss2026! 이고 서버는 internal-api.softsquared.io:8443 에 있어.", response: "ThinkTrace 아키텍처 다이어그램을 생성하겠습니다...", input_tokens: 320, output_tokens: 780, cost_usd: 6.20, latency_ms: 1680, timestamp: "2026-03-26T10:20:00Z" },
  { id: "log-risk-004", user_id: "u-003", user_name: "박서연", team: "디자인팀", channel: "openai", model: "gpt-4o", prompt: "우리 회사 직원들 연봉 테이블을 정리해줘. 팀장급은 7000만원, 시니어는 5500만원, 주니어는 3800만원 기준으로.", response: "연봉 테이블을 정리해 드리겠습니다...", input_tokens: 150, output_tokens: 380, cost_usd: 2.95, latency_ms: 1100, timestamp: "2026-03-27T15:00:00Z" },
];

// ================================
// 내 로그만 필터 (개발자용 - 강지수 기준)
// ================================
export const MY_LOGS = MOCK_LOGS.filter(l => l.user_id === "u-001");

// ================================
// 평가 히스토리 (강지수 기준)
// ================================
// (ReportSummary 타입은 @/types/report.ts 로 분리됨)

export const PAST_REPORTS: ReportSummary[] = [
  {
    id: "report-001",
    seq: 1,
    date: "2025.12.20",
    period: "2025.11.01 – 2025.12.20",
    level: "Lv.1~2",
    levelLabel: "Starter",
    levelColor: "bg-gray-200 text-gray-600",
    project: "ThinkTrace Project #18",
    aiTaskCount: 12,
    totalTokens: 48200,
    totalCostUsd: 44.20,
    topGain: "Prompt 기초",
    bottleneck: "반복 질문 / 컨텍스트 미전달",
    keyInsight: "AI를 단순 검색 대체 수단으로 활용하는 단계. 컨텍스트 없이 짧은 프롬프트를 반복 입력하는 패턴이 지배적.",
    radarScores: [
      { axis: "Prompt Eng.", score: 2 },
      { axis: "Context Eng.", score: 1 },
      { axis: "효율성",       score: 2 },
      { axis: "기술 깊이",    score: 2 },
      { axis: "검증 성숙도",  score: 1 },
      { axis: "토큰 효율",    score: 2 },
    ],
    hasDetail: false,
  },
  {
    id: "report-002",
    seq: 2,
    date: "2026.01.17",
    period: "2025.12.21 – 2026.01.17",
    level: "Lv.2~3",
    levelLabel: "Reviewer",
    levelColor: "bg-amber-100 text-amber-700",
    project: "ThinkTrace Project #22",
    aiTaskCount: 31,
    totalTokens: 124800,
    totalCostUsd: 89.60,
    topGain: "Problem Framing",
    bottleneck: "검증/컨텍스트 부족",
    keyInsight: "구현 중심 빌드업 단계. 작업 단위가 커지고 AI와 반복 대화하는 흐름이 생겼으나, 결과 검증과 컨텍스트 설계는 아직 미흡.",
    radarScores: [
      { axis: "Prompt Eng.", score: 3 },
      { axis: "Context Eng.", score: 2 },
      { axis: "효율성",       score: 2 },
      { axis: "기술 깊이",    score: 3 },
      { axis: "검증 성숙도",  score: 2 },
      { axis: "토큰 효율",    score: 2 },
    ],
    hasDetail: false,
  },
  {
    id: "report-003",
    seq: 3,
    date: "2026.02.21",
    period: "2026.01.18 – 2026.02.21",
    level: "Lv.3",
    levelLabel: "Architect",
    levelColor: "bg-blue-100 text-blue-700",
    project: "ThinkTrace Project #25",
    aiTaskCount: 58,
    totalTokens: 312400,
    totalCostUsd: 168.40,
    topGain: "Problem Framing (+33%)",
    bottleneck: "커밋 품질 / 개인 규칙 의존",
    keyInsight: "설계·기획 → 컨펌 → 구현 흐름으로 전환 완료. AI를 협업 파트너로 활용하는 Architect 단계 진입. Lv.4 전환을 위한 팀 전파 역할 수행이 다음 과제.",
    radarScores: [
      { axis: "Prompt Eng.", score: 4 },
      { axis: "Context Eng.", score: 3 },
      { axis: "효율성",       score: 3 },
      { axis: "기술 깊이",    score: 4 },
      { axis: "검증 성숙도",  score: 3 },
      { axis: "토큰 효율",    score: 3 },
    ],
    hasDetail: true, // → /developer/report 상세 페이지 존재
  },
];

// ================================
// AI Maturity 데이터 (강지수 기준)
// ================================
export const MATURITY_DATA = {
  // ── 기본 정보 ────────────────────────────────────
  user: { name: "강지수", id: "2ss***", project: "ThinkTrace Project #25" },
  period: { first: "2026.01.17", second: "2026.02.21" },
  level: { first: "Lv.2~3", second: "Lv.3", label: "Architect 진환" },

  // ── 0. 변화 요약 ──────────────────────────────────
  changeSummary: {
    maturity: {
      firstLabel: "Lv.2~3", firstSub: "구현 중심",
      secondLabel: "Lv.3",  secondSub: "Architect 진환",
    },
    scale: {
      firstLabel: "N/A", firstSub: "로그 기반 추정",
      secondLabel: "AI 작업 58 / 파일 1,989", secondSub: "대규모 활용 확인",
    },
    bottleneck: {
      firstLabel: "검증/컨텍스트", firstSub: "기술 역변 단계",
      secondLabel: "커밋 품질",    secondSub: "운영 체계 단계",
    },
  },

  // ── 1. AI Agent 역량 변화 추이 ───────────────────
  skills: [
    { key: "Problem Framing",    first: 60, second: 80, pct: "+33%" },
    { key: "Prompt Engineering", first: 55, second: 75, pct: "+36%" },
    { key: "Context Engineering",first: 45, second: 65, pct: "+44%" },
    { key: "Validation & Review",first: 40, second: 60, pct: "+50%" },
    { key: "Tool Orchestration", first: 50, second: 70, pct: "+40%" },
  ],
  skillHighlights: {
    topGain: [
      { key: "Problem Framing",    detail: "+20점: 요구사항/제약을 더 명확히 고정" },
      { key: "Prompt Engineering", detail: "+20점: 목적/맥락 기반 선탠프으로 구조화 강화" },
    ],
    continuous: [
      { key: "Context Engineering", detail: "+20점: 큰 그림 →기능 빌드업 강화" },
      { key: "Validation & Review", detail: "+20점: 서버 실행/동작 확인 면시화" },
    ],
  },

  // ── 3. 개발 활동 정량 지표 ───────────────────────
  metrics: [
    {
      label: "AI 작업 수", first: "N/A", second: "58", secondFull: "58회",
      badge: "측정 가능", badgeColor: "green",
      systemMeaning: "AI가 단발성 도구가 아니라 개발 프로세스의 상시 구성 요소로 편입됨. 작업이 질문 단위가 아닌 기능/작업 단위로 구조화되기 시작한 단계.",
    },
    {
      label: "수정 파일", first: "N/A", second: "1,989", secondFull: "1,989개",
      badge: "측정 가능", badgeColor: "green",
      systemMeaning: "변경이 국소적이지 않고 전파형(Propagated Change)으로 발생하는 시스템 단계에 진입. 이 규모에서는 커밋·검증·컨텍스트 표준이 없으면 추적성과 품질이 급격히 붕괴됨.",
    },
    {
      label: "평균 소요시간", first: "N/A", second: "622", secondFull: "622초",
      badge: "측정 가능", badgeColor: "green",
      systemMeaning: "1회 상호작용이 짧은 주기로 반복되는 고속 수렴 패턴. 속도는 확보되었으며, 이제 병목은 실행이 아닌 운영 구조(재현성·검증)로 이동.",
    },
    {
      label: "산출물", first: "3묶음", second: "5", secondFull: "5그룹",
      badge: "구조화", badgeColor: "blue",
      systemMeaning: '"만드는 단계"를 넘어 운영·실행·협업 영역까지 개발 범위가 확장됨. 개인 생산성 중심에서 팀/시스템 생산성 관리가 필요한 단계로 진입.',
    },
  ],

  // ── 4. 작업 수행 방식 변화 ───────────────────────
  workStyleChange: {
    first: {
      title: "구현 중심 빌드업",
      positives: ["UI 컴포넌트 + API 모듈을 빠르게 생성/연동", "완료 작업을 요약하는 습관"],
      negatives: ["DoD/검증/계약 고정의 흔적이 약함", '"완성"과 "안정성" 간 간격 존재'],
    },
    second: {
      title: "설계/기획 → 컨펌 → 구현",
      positives: ["목적/제약/요구사항을 상세히 전달", "단계별 이해를 요약한 뒤 개발 착수", "큰 프롬프트로 요약 → 작은 기능 빌드업"],
      warnings: ["단, 커밋 품질이 운영 병목으로 부상"],
    },
    conclusion: '"무작정 구현"에서 "설계 후 구현"으로 중심축이 이동 → 성숙도 상승의 직접 증거. 이는 Lv.2~3에서 Lv.3 [Architect]로의 전환을 의미함.',
  },

  // ── 5. 레벨 변화 판정 ────────────────────────────
  levelChange: {
    first: { level: "Lv.2~3 (추정)", desc: "구현 속도/분배는 좋지만 컨텍스트 고정/검증 루프가 약해 상단 도약 신호 부족" },
    second: { level: "Lv.3 [Architect]", desc: '설계/기획/컨펌 후 개발 착수 → "심플 방지(사전기획)"가 강화된 상태' },
    evidences: [
      { title: "작업 단위 변화",   desc: '작업이 "질문" 단위에서 "기능/작업" 단위로 변화' },
      { title: "구조화 흐름 등장", desc: "큰 윤곽을 먼저 잡고 작은 기능을 붙이는 구조화 흐름 등장" },
      { title: "검증 행동 포함",   desc: "검증 행동(서버 실행/동작 확인)이 작업 단위로 포함" },
    ],
    lv4Blockers: [
      { title: "개인 규칙 의존",          desc: '프롬프트/컨텍스트/검증이 "개인 머릿속 규칙"에 의존' },
      { title: "재사용 가능한 표준 부족", desc: "팀이 재사용 가능한 표준(템플릿, 프로젝트 메모리, 검증 정의)이 부족" },
      { title: "재현성 부족",             desc: "커밋/검증이 재현성의 형태로 남지 않음" },
    ],
  },

  // ── 6. SFIA 책임수준 기반 판정 ──────────────────
  sfia: {
    l3: {
      label: "Level 3  Apply",
      items: [
        "명확히 정의된 문제를 독립적으로 해결",
        "정해진 표준·지침을 적용",
        "결과 책임은 있으나 방법론·표준 설계하지는 않음",
      ],
    },
    l4: {
      label: "Level 4  Enable",
      items: [
        "문제 해결 방식을 설계·개선",
        "타인의 작업을 가이드·지원",
        "재현 가능한 표준·템플릿·방법론을 통해 성과를 확장",
      ],
    },
    l4Conditions: ['"개인의 효율"을 "팀의 재현성"으로 바꾸는 작업이 필요', "표준화/템플릿", "프로젝트 메모리", "검증 정의"],
    transitionMap: [
      { condition: "문제 정의 방식",        first: "수어진 문제 해결",  second: "문제를 구조화·분해", status: "L3 안정화",   statusColor: "blue",   blocker: "정의 방식이 문서/표준으로 고정되지 않음" },
      { condition: "프롬프트 설계 책임",    first: "즉각적 요구 전달",  second: "설계 → 컨펌 → 구현", status: "L3 상단",     statusColor: "blue",   blocker: "개인 습관 의존, 템플릿 부재" },
      { condition: "컨텍스트 관리 방식",    first: "세션 의존",          second: "부분 고정 사용",      status: "L3 (전환 직전)", statusColor: "indigo", blocker: "프로젝트 메모리 미운영" },
      { condition: "검증 책임 위치",        first: "사후 확인",          second: "실행/동작 확인",       status: "L3 상단",     statusColor: "blue",   blocker: "사전 DoD 미고정" },
      { condition: "AI 활용의 영향 범위",   first: "개인 생산성",        second: "개인 효율 극대화",    status: "L3 한계",     statusColor: "blue",   blocker: "팀 재사용 불가" },
      { condition: "재현성 (핵심)",         first: "작업자 의존",         second: "임묵적 패턴 형성",    status: "미충족",      statusColor: "red",    blocker: "표준·문서·템플릿 부재" },
    ],
  },

  // ── 7. 핵심 병목 ─────────────────────────────────
  bottleneck: {
    title: '"커밋 품질"이 팀 생산성의 발목을 잡는 단계로 이동',
    detail: "12회 푸시 완료지만 목적/내용을 알 수 없어 버전 관리 목적 달성 실패",
    warning: "성숙도가 올라갈수록(특히 SFIA Level 4 Enable로 갈수록) 산출물의 추적 가능성과 품질 핵심이므로, 이 병목은 레벨 없음 막는 \"마지막 큰 문턱\"임",
  },

  // ── 8. ROI 기반 개선 권고안 ──────────────────────
  recommendations: [
    {
      priority: "최우선", leverageLabel: "최우선 레버리지 1",
      title: "커밋 표준화", roi: "ROI 최상",
      why: "2차 데이터에서 변경량(수정 파일 1,989개)이 급증했으나, 가장 명확한 손실 지점은 커밋 품질 저하로 인한 추적성 붕괴였다.",
      situationItems: ["구현 속도 ✗ 문제가 아님", "기술 이해도 ✗ 문제가 아님", '"무엇이 왜 바뀌었는지 알 수 없는 상태"가 가장 큰 비용을 만든다.'],
      keyMessage: '커밋은 이제 "저장 버튼"이 아니라 생산성의 바닥선을 결정하는 운영 장치가 된다.',
      before: ["이미 없는 커밋 메시지", "무분별한 푸시", "변경 의도·범위·검증 내용 추적 불가"],
      afterTemplate: "type(scope): summary\n\nwhy: 이 변경이 필요한 이유\ntest: 어떻게 검증했는지",
      afterRules: ["기능 단위로 scope 고정", "스타일/리팩터/기능 혼합 커밋 금지"],
      effects: ["리뷰·파악·협업 효율 30~40% 즉시 상승", "재작업 감소", "개인 생산성 → 팀 확장성 확보"],
      badge: '이 권고안은 "고치면 바로 좋아지는" 레버리지다.',
    },
    {
      priority: "중요", leverageLabel: "중요 레버리지 2",
      title: "UI/CSS 요구사항 고정", roi: "성공률 60% 구간 개선",
      why: "2차 작업 중 UI/CSS 영역에서 성공률 60% 구간이 반복 관찰됐다. 이는 기술 문제가 아니라, 초기 요구사항의 추상성이다.",
      situationItems: ["요구사항이 흐릿하면 → AI도, 사람도 → 반복 수정 루프에 빠지기 쉽다."],
      keyMessage: null,
      before: ['"예쁘게", "자연스럽게", "깔끔하게" 등 감각적 표현 중심', "번역형/즉시사항/완료 기준 미정"],
      afterTemplate: "Breakpoints: 모바일 / 태블릿 / 데스크탑\nVisual Rules: 패턴, 간격, 대비\nConstraints: 기존 컬러/성능/레이아웃 유지\nDone Criteria: 배점 없음, 스크롤/리사이즈 확인",
      afterRules: [],
      effects: ["UI 반복 수정 감소", "토큰/시간 낭비 축소", "성공률 상승 → 작업 수렴 가속"],
      badge: null,
    },
    {
      priority: "권장", leverageLabel: "권장 레버리지 3",
      title: "프로젝트 메모리를 \"운영 품질\"과 연결", roi: "토큰 20~30% 최적화",
      why: "컨텍스트/메모리는 \"답변을 잘 받기 위한 장치\"가 아니다. 이 단계에서는 규칙 위반 방지 + 상수 보장 + 일관성 유지와 직결된다.",
      situationItems: ["API 규칙이 요청마다 달라지고", "금지사항이 은근히 어겨지고", "재질문·재수정이 누적된다."],
      keyMessage: null,
      before: ["매 요청마다 API/규칙/제약을 다시 설명", "규칙이 파일마다 미세하게 어긋남"],
      afterTemplate: "Project Memory에 다음을 고정:\n• API Contracts\n• Coding Rules\n• Non-functional Requirements\n• 금지사항 / 실패 패턴",
      afterRules: [],
      effects: ["토큰 사용량 20~30% 절적화", "규칙 위반/실수 감소", "구현 일관성 상승 → 리뷰 비용 감소"],
      badge: null,
    },
  ],

  // ── 9. AI 컨설턴트 총평 ──────────────────────────
  consultantSummary: {
    fiveAxes: [
      { axis: "Prompt Engineering",  first: "3/5", second: "4/5", delta: "+1", insight: "요구사항 분해 → 설계-컨펌 구조로 진화" },
      { axis: "Context Engineering", first: "2/5", second: "3/5", delta: "+1", insight: "세션 의존 → 부분적 고정 컨텍스트 사용" },
      { axis: "프롬프트 효율성",     first: "2/5", second: "3/5", delta: "+1", insight: "왕복 감소, 작업 단위 요청 증가" },
      { axis: "기술적 깊이",         first: "3/5", second: "4/5", delta: "+1", insight: "UI·운영·실행까지 고려 확장" },
      { axis: "검증 성숙도",         first: "2/5", second: "3/5", delta: "+1", insight: "사후 확인 → 실행/동작 검증 포함" },
      { axis: "토큰 효율성",         first: "2/5", second: "3/5", delta: "+1", insight: "품질 대비 효율 개선, 구조 미고정 한계" },
    ],
    keyInsight: '모든 축이 동시에 +1 상승했다는 것은 "특정 스킬 향상"이 아니라 AI 협업 방식 자체가 한 단계 구조적으로 이동했음을 의미함.',
    axisDetails: [
      {
        axis: "입력(Input) 관점", sub: "Prompt & Context Engineering", color: "blue",
        first: ["목표 중심 요청이 많음", "제약·완료 기준이 요청마다 달라짐", "컨텍스트는 세션 내 기억에 의존"],
        second: ["설계/요구사항을 먼저 주입", "AI가 요약 → 사용자 확인 → 구현하는 구조 등장", "부분적으로 고정된 맥락 사용"],
        growth: 'AI를 "답변기"에서 "설계 파트너"로 활용하기 시작. 다만 컨텍스트가 문서/메모리로 고정되지 않아 재현성은 제한적임.',
        weakness: "프롬프트, 컨텍스트, 검증이 개인 머릿속 규칙에 의존",
      },
      {
        axis: "프롬프트 효율성", sub: "Prompt Count & Process Efficiency", color: "purple",
        first: ["문제 발생 시 즉각 질문", "왕복 질문이 잦음", "요청 단위가 비교적 작음"],
        second: ["작업 단위 요청 증가", "설계 → 컨펌 → 실행으로 왕복 감소", "평균 작업 시간(622초) 기준 수렴 속도 개선"],
        growth: "효율은 개인 착식의 단계에서 벗어났으나, 템플릿/표준이 없어 확장 시 효율 정체 위협이 존재함.",
        weakness: "표준/메모리로 고정되지 않아 재현성이 부족함",
      },
    ],
    timeline: [
      { step: "1차", date: "2026.01.17", levelBadge: "Lv.2 Reviewer (수단)", desc: "AI 결과를 검토·수정하며 활용" },
      { step: "2차", date: "2026.02.21", levelBadge: "Lv.3 Architect 진입",  desc: "설계·구조를 통해 AI 협업" },
      { step: "현재", date: null,        levelBadge: "성장 관문 돌파",         desc: "Lv.3 안정화 단계, Lv.4 전환 조건 명확" },
    ],
  },

  // ── Developer 메인 — 코칭 카드 ────────────────────
  coachingCards: [
    {
      trigger: "재질문 비율 38%",
      message: "질문 앞에 '배경: ~, 원하는 결과: ~' 형식을 써보세요.",
      effect: "재질문 비율 50% 감소 예상",
      type: "warning",
    },
    {
      trigger: "claude-haiku를 복잡한 아키텍처 설계에 사용 중",
      message: "설계·분석 작업에는 claude-sonnet-4 사용을 권장합니다.",
      effect: "응답 품질 향상, 재작업 감소",
      type: "info",
    },
    {
      trigger: "Context Engineering 65점 (목표: 80점)",
      message: "CLAUDE.md에 프로젝트 규칙을 고정하면 매 세션 재설명이 불필요합니다.",
      effect: "토큰 사용량 20% 절감 예상",
      type: "success",
    },
  ],
};

// ================================
// 어드민 요약 통계
// ================================
export const ADMIN_STATS = {
  totalLogs: MOCK_LOGS.length,
  totalCost: MOCK_LOGS.reduce((s, l) => s + l.cost_usd, 0),
  activeUsers: new Set(MOCK_LOGS.map(l => l.user_id)).size,
  avgLatency: Math.round(MOCK_LOGS.reduce((s, l) => s + l.latency_ms, 0) / MOCK_LOGS.length),
};

// ================================
// 공유 파일 메타데이터
// ================================
// (FileType, FileStatus, SharedFile 타입은 @/types/file.ts 로 분리됨)

export const SHARED_FILES: SharedFile[] = [
  // ── AI 성숙도 리포트 (PDF) ──
  {
    id: "file-001",
    title: "강지수 AI 성숙도 평가 리포트 (3차)",
    fileType: "PDF",
    sizeMb: 2.4,
    creator: "김태영",
    creatorTeam: "개발팀",
    sharedTo: "개발팀",
    status: "공유중",
    tags: ["AI Maturity", "개발팀", "3차평가"],
    createdAt: "2026-02-21T10:00:00Z",
    sharedAt: "2026-02-21T11:30:00Z",
    updatedAt: "2026-02-22T09:00:00Z",
    viewCount: 47,
    downloadCount: 12,
    commentCount: 5,
  },
  {
    id: "file-002",
    title: "이민준 AI 성숙도 평가 리포트 (2차)",
    fileType: "PDF",
    sizeMb: 1.9,
    creator: "김태영",
    creatorTeam: "개발팀",
    sharedTo: "개발팀",
    status: "공유중",
    tags: ["AI Maturity", "개발팀", "2차평가"],
    createdAt: "2026-01-17T14:00:00Z",
    sharedAt: "2026-01-17T15:00:00Z",
    updatedAt: "2026-01-18T08:30:00Z",
    viewCount: 31,
    downloadCount: 8,
    commentCount: 3,
  },
  {
    id: "file-003",
    title: "박서연 AI 성숙도 평가 리포트 (2차)",
    fileType: "PDF",
    sizeMb: 2.1,
    creator: "김태영",
    creatorTeam: "개발팀",
    sharedTo: "디자인팀",
    status: "공유중",
    tags: ["AI Maturity", "디자인팀", "2차평가"],
    createdAt: "2026-01-17T10:00:00Z",
    sharedAt: "2026-01-17T11:00:00Z",
    updatedAt: "2026-01-18T10:00:00Z",
    viewCount: 22,
    downloadCount: 6,
    commentCount: 2,
  },
  {
    id: "file-004",
    title: "최현우 AI 성숙도 평가 리포트 (1차)",
    fileType: "PDF",
    sizeMb: 1.6,
    creator: "김태영",
    creatorTeam: "개발팀",
    sharedTo: "기획팀",
    status: "만료",
    tags: ["AI Maturity", "기획팀", "1차평가"],
    createdAt: "2025-12-20T09:00:00Z",
    sharedAt: "2025-12-20T10:00:00Z",
    updatedAt: "2025-12-20T10:00:00Z",
    viewCount: 15,
    downloadCount: 4,
    commentCount: 1,
  },
  // ── 비용 분석 (XLSX) ──
  {
    id: "file-005",
    title: "12월 AI 사용 비용 분석 (팀별)",
    fileType: "XLSX",
    sizeMb: 0.8,
    creator: "김태영",
    creatorTeam: "개발팀",
    sharedTo: "전체",
    status: "공유중",
    tags: ["비용분석", "월간", "팀별"],
    createdAt: "2026-01-03T09:00:00Z",
    sharedAt: "2026-01-03T10:00:00Z",
    updatedAt: "2026-01-05T14:00:00Z",
    viewCount: 63,
    downloadCount: 29,
    commentCount: 7,
  },
  {
    id: "file-006",
    title: "11월 AI 사용 비용 분석 (채널별)",
    fileType: "XLSX",
    sizeMb: 0.7,
    creator: "김태영",
    creatorTeam: "개발팀",
    sharedTo: "전체",
    status: "만료",
    tags: ["비용분석", "월간", "채널별"],
    createdAt: "2026-01-08T09:00:00Z",
    sharedAt: "2026-01-08T10:00:00Z",
    updatedAt: "2026-01-08T10:00:00Z",
    viewCount: 41,
    downloadCount: 18,
    commentCount: 3,
  },
  {
    id: "file-007",
    title: "Q4 AI 도구 ROI 분석 시트",
    fileType: "XLSX",
    sizeMb: 1.3,
    creator: "최현우",
    creatorTeam: "기획팀",
    sharedTo: "전체",
    status: "공유중",
    tags: ["ROI", "분기", "기획"],
    createdAt: "2026-01-10T11:00:00Z",
    sharedAt: "2026-01-10T13:00:00Z",
    updatedAt: "2026-01-15T09:00:00Z",
    viewCount: 38,
    downloadCount: 14,
    commentCount: 9,
  },
  // ── 발표 자료 (PPTX) ──
  {
    id: "file-008",
    title: "2025 Q4 AI 활용 현황 발표 자료",
    fileType: "PPTX",
    sizeMb: 5.2,
    creator: "김태영",
    creatorTeam: "개발팀",
    sharedTo: "전체",
    status: "공유중",
    tags: ["분기발표", "AI현황", "전사"],
    createdAt: "2026-01-08T10:00:00Z",
    sharedAt: "2026-01-09T09:00:00Z",
    updatedAt: "2026-01-09T16:00:00Z",
    viewCount: 84,
    downloadCount: 31,
    commentCount: 12,
  },
  {
    id: "file-009",
    title: "AI Maturity 향상 전략 — 팀 공유",
    fileType: "PPTX",
    sizeMb: 3.8,
    creator: "강지수",
    creatorTeam: "개발팀",
    sharedTo: "개발팀",
    status: "공유중",
    tags: ["전략", "Maturity", "개발팀"],
    createdAt: "2026-01-14T14:00:00Z",
    sharedAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-01-16T09:00:00Z",
    viewCount: 29,
    downloadCount: 9,
    commentCount: 6,
  },
  {
    id: "file-010",
    title: "디자인팀 AI 툴 도입 제안서",
    fileType: "PPTX",
    sizeMb: 4.1,
    creator: "박서연",
    creatorTeam: "디자인팀",
    sharedTo: "전체",
    status: "초안",
    tags: ["제안서", "디자인팀", "도구"],
    createdAt: "2026-02-01T11:00:00Z",
    sharedAt: "2026-02-01T11:00:00Z",
    updatedAt: "2026-02-05T15:00:00Z",
    viewCount: 11,
    downloadCount: 2,
    commentCount: 4,
  },
  // ── 가이드라인/정책 (DOCX) ──
  {
    id: "file-011",
    title: "AI 프롬프트 작성 가이드라인 v2.0",
    fileType: "DOCX",
    sizeMb: 0.5,
    creator: "강지수",
    creatorTeam: "개발팀",
    sharedTo: "전체",
    status: "공유중",
    tags: ["가이드라인", "프롬프트", "공통"],
    createdAt: "2026-01-10T10:00:00Z",
    sharedAt: "2026-01-10T14:00:00Z",
    updatedAt: "2026-02-15T10:00:00Z",
    viewCount: 112,
    downloadCount: 54,
    commentCount: 18,
  },
  {
    id: "file-012",
    title: "AI 사용 정책 및 보안 지침",
    fileType: "DOCX",
    sizeMb: 0.6,
    creator: "김태영",
    creatorTeam: "개발팀",
    sharedTo: "전체",
    status: "공유중",
    tags: ["정책", "보안", "전사"],
    createdAt: "2025-12-15T09:00:00Z",
    sharedAt: "2025-12-15T10:00:00Z",
    updatedAt: "2026-03-20T09:00:00Z",
    viewCount: 98,
    downloadCount: 43,
    commentCount: 8,
  },
  {
    id: "file-013",
    title: "기획팀 AI 협업 워크플로우 문서",
    fileType: "DOCX",
    sizeMb: 0.9,
    creator: "최현우",
    creatorTeam: "기획팀",
    sharedTo: "기획팀",
    status: "공유중",
    tags: ["워크플로우", "기획팀", "협업"],
    createdAt: "2026-01-20T10:00:00Z",
    sharedAt: "2026-01-20T14:00:00Z",
    updatedAt: "2026-02-10T11:00:00Z",
    viewCount: 24,
    downloadCount: 10,
    commentCount: 5,
  },
  // ── 원시 데이터 (CSV) ──
  {
    id: "file-014",
    title: "2025년 12월 AI 로그 원본 데이터",
    fileType: "CSV",
    sizeMb: 3.6,
    creator: "김태영",
    creatorTeam: "개발팀",
    sharedTo: "개발팀",
    status: "공유중",
    tags: ["원본데이터", "12월", "로그"],
    createdAt: "2026-01-02T09:00:00Z",
    sharedAt: "2026-01-02T10:00:00Z",
    updatedAt: "2026-01-02T10:00:00Z",
    viewCount: 19,
    downloadCount: 11,
    commentCount: 1,
  },
  {
    id: "file-015",
    title: "팀별 AI 모델 사용 통계 (2025 전체)",
    fileType: "CSV",
    sizeMb: 8.1,
    creator: "김태영",
    creatorTeam: "개발팀",
    sharedTo: "전체",
    status: "공유중",
    tags: ["통계", "연간", "모델"],
    createdAt: "2026-01-15T11:00:00Z",
    sharedAt: "2026-01-15T14:00:00Z",
    updatedAt: "2026-01-15T14:00:00Z",
    viewCount: 33,
    downloadCount: 16,
    commentCount: 3,
  },
  {
    id: "file-016",
    title: "강지수 AI 성숙도 평가 리포트 (1차)",
    fileType: "PDF",
    sizeMb: 1.4,
    creator: "김태영",
    creatorTeam: "개발팀",
    sharedTo: "개발팀",
    status: "만료",
    tags: ["AI Maturity", "개발팀", "1차평가"],
    createdAt: "2025-12-20T10:00:00Z",
    sharedAt: "2025-12-20T11:00:00Z",
    updatedAt: "2025-12-20T11:00:00Z",
    viewCount: 9,
    downloadCount: 3,
    commentCount: 0,
  },
  {
    id: "file-017",
    title: "1월 AI 활용 인사이트 뉴스레터",
    fileType: "PDF",
    sizeMb: 1.1,
    creator: "이민준",
    creatorTeam: "개발팀",
    sharedTo: "전체",
    status: "공유중",
    tags: ["뉴스레터", "인사이트", "월간"],
    createdAt: "2026-02-03T10:00:00Z",
    sharedAt: "2026-02-03T11:00:00Z",
    updatedAt: "2026-02-04T09:00:00Z",
    viewCount: 56,
    downloadCount: 21,
    commentCount: 9,
  },
  {
    id: "file-018",
    title: "AI Maturity 전사 현황 요약본 (초안)",
    fileType: "DOCX",
    sizeMb: 0.4,
    creator: "김태영",
    creatorTeam: "개발팀",
    sharedTo: "전체",
    status: "초안",
    tags: ["현황요약", "전사", "초안"],
    createdAt: "2026-03-22T10:00:00Z",
    sharedAt: "2026-03-22T10:00:00Z",
    updatedAt: "2026-03-28T14:00:00Z",
    viewCount: 4,
    downloadCount: 0,
    commentCount: 2,
  },
];

// ================================
// 팀 AI 성숙도 (AIMI) 데이터
// ================================
export const TEAM_MATURITY = {
  org: { name: "Softsquared Inc.", period: "2025.11 – 2026.03", baseline: 35.8 },

  // ── Overview 지표 ──────────────────────────────
  overview: {
    aimiScore:      35.8,
    aimiLevel:      2,
    aimiLabel:      "팀 활용 단계",
    qualityScore:   61,        // /100
    effectiveness:  54,        // /100
    totalPrompts:   MOCK_LOGS.length,
    totalTokens:    MOCK_LOGS.reduce((s, l) => s + l.input_tokens + l.output_tokens, 0),
    totalCostUsd:   MOCK_LOGS.reduce((s, l) => s + l.cost_usd, 0),
    validationRisk: 72.4,      // %
    learningGap:    68.1,      // %
    strategicBias:  4.2,       // %  (design/test)
  },

  // ── Individual Analytics ───────────────────────
  individuals: [
    {
      userId: "u-005", name: "김태영", team: "개발팀",
      aimiScore: 42.1, level: "Lv.3", levelLabel: "Architect",
      strategyDist: { execution: 78, hybrid: 14, decision: 8 },
      shortPromptRate: 31, richContextRate: 62, qualityIndex: 68,
      effectiveness: 71, validationRate: 19,
      retryLoopRate: 8.2,
      badge: "팀 챔피언",
    },
    {
      userId: "u-001", name: "강지수", team: "개발팀",
      aimiScore: 38.4, level: "Lv.3", levelLabel: "Architect",
      strategyDist: { execution: 83, hybrid: 11, decision: 6 },
      shortPromptRate: 28, richContextRate: 58, qualityIndex: 62,
      effectiveness: 66, validationRate: 14,
      retryLoopRate: 9.1,
      badge: null,
    },
    {
      userId: "u-002", name: "이민준", team: "개발팀",
      aimiScore: 35.2, level: "Lv.2~3", levelLabel: "Reviewer",
      strategyDist: { execution: 88, hybrid: 8, decision: 4 },
      shortPromptRate: 42, richContextRate: 44, qualityIndex: 55,
      effectiveness: 58, validationRate: 9,
      retryLoopRate: 14.7,
      badge: null,
    },
    {
      userId: "u-003", name: "박서연", team: "디자인팀",
      aimiScore: 31.7, level: "Lv.2~3", levelLabel: "Reviewer",
      strategyDist: { execution: 91, hybrid: 6, decision: 3 },
      shortPromptRate: 55, richContextRate: 36, qualityIndex: 48,
      effectiveness: 51, validationRate: 6,
      retryLoopRate: 19.6,
      badge: "리스크 주의",
    },
    {
      userId: "u-004", name: "최현우", team: "기획팀",
      aimiScore: 28.9, level: "Lv.2", levelLabel: "Starter",
      strategyDist: { execution: 94, hybrid: 4, decision: 2 },
      shortPromptRate: 68, richContextRate: 22, qualityIndex: 38,
      effectiveness: 42, validationRate: 3,
      retryLoopRate: 22.3,
      badge: null,
    },
  ],

  // ── Team Rankings ──────────────────────────────
  teams: [
    {
      name: "개발팀", score: 38.5, validationRate: 14.2,
      pulse: "컨텍스트 풍부 + 설계 위주 패턴",
      color: "#1722E8",
      radarScores: { promptQuality: 72, context: 64, validation: 58, strategy: 54, reuse: 48 },
    },
    {
      name: "디자인팀", score: 31.7, validationRate: 6.1,
      pulse: "숏 프롬프트 과다 · 검증 낮음",
      color: "#ec4899",
      radarScores: { promptQuality: 54, context: 42, validation: 34, strategy: 38, reuse: 28 },
    },
    {
      name: "기획팀", score: 28.9, validationRate: 3.4,
      pulse: "실행 편중 · 전략적 활용 저조",
      color: "#f59e0b",
      radarScores: { promptQuality: 44, context: 32, validation: 22, strategy: 46, reuse: 21 },
    },
  ],

  // ── Organization ──────────────────────────────
  organization: {
    sdlcAllocation: [
      { label: "구현",     pct: 68.4, color: "#1722E8" },
      { label: "요구사항", pct: 12.1, color: "#8b5cf6" },
      { label: "문명",     pct: 8.3,  color: "#ec4899"  },
      { label: "테스트",   pct: 6.9,  color: "#f43f5e"  },
      { label: "설계",     pct: 4.3,  color: "#f97316"  },
    ],
    artifactProfile: [
      { label: "App 코드",       pct: 100 },
      { label: "문서/설계",      pct: 28  },
      { label: "인프라/CI-CD",   pct: 22  },
      { label: "데이터/스키마",  pct: 14  },
      { label: "테스트코드",     pct: 8   },
    ],
    taskIntent: [
      { label: "생성",     pct: 68.2 },
      { label: "디버깅",   pct: 14.8 },
      { label: "문서화",   pct: 6.1  },
      { label: "운영지원", pct: 5.3  },
      { label: "학습",     pct: 3.8  },
      { label: "리뷰",     pct: 1.8  },
    ],
    cultureIndicator: "빠른 생성 중심",
    smalltalkRate:    2.4,
    executionFocus:   "LV.2 CURRENT → GOAL: LV.3 DECISION",
  },

  // ── Strategic Roadmap ─────────────────────────
  strategy: {
    headline: "개발팀을 조직 생산성 엔진으로 전환",
    insight:  "AI 의지가 가장 강한 개발팀에 구조화된 검증 규칙을 적용하여 전체 조직의 AIMI 점수를 견인해야 합니다.",
    steps: [
      { num: "01", title: "VALIDATION FIRST",   desc: "모든 프롬프트에 성공 조건, 판단 방법, 변경 요약 블록 강제 적용으로 재작업 루프 차단." },
      { num: "02", title: "PROMPT ASSETS",       desc: "Incident 대응, 성능 최적화 등 우수 사례를 팀 라이브러리(Reuse ≥ 20%)로 자신화." },
      { num: "03", title: "DECISION SHIFT",      desc: "코드 작성 전 가스포드 및 고급 트레이드오프 전문 인무화." },
      { num: "04", title: "CHAMPION SPREAD",     desc: "Type 2 팀 우수 실력을 전사 AI Champion으로 지정해 확산." },
    ],
    expectedAimi: 48.0,
    expectedLevel: "Lv.3 조직 협업",
  },
};

// ================================
// 인맥 맵 데이터 (프로덕션에서 제거 예정)
// ================================

export const PEOPLE_NODES = [
  {
    id: "u-001", name: "강지수", role: "Frontend Engineer", team: "개발팀", teamColor: "#1722E8",
    email: "jisoo@softsquared.com", aimiLevel: 3, aimiScore: 42.1, aimiLabel: "Architect",
    skills: ["Next.js", "TypeScript", "React", "Tailwind"],
    joinDate: "2024-03-10", bio: "AI 기반 UI 설계에 특화된 프론트엔드 엔지니어",
  },
  {
    id: "u-002", name: "이민준", role: "Backend Engineer", team: "개발팀", teamColor: "#1722E8",
    email: "minjun@softsquared.com", aimiLevel: 2, aimiScore: 35.8, aimiLabel: "Reviewer",
    skills: ["Node.js", "PostgreSQL", "Redis", "Docker"],
    joinDate: "2024-01-15", bio: "인프라 자동화와 DB 최적화 담당 백엔드 엔지니어",
  },
  {
    id: "u-003", name: "박서연", role: "UI/UX Designer", team: "디자인팀", teamColor: "#ec4899",
    email: "seoyeon@softsquared.com", aimiLevel: 2, aimiScore: 31.7, aimiLabel: "Reviewer",
    skills: ["Figma", "Design System", "Tailwind", "Motion"],
    joinDate: "2024-05-02", bio: "접근성 중심 디자인 시스템 구축 전문 디자이너",
  },
  {
    id: "u-004", name: "최현우", role: "Product Manager", team: "기획팀", teamColor: "#f59e0b",
    email: "hyunwoo@softsquared.com", aimiLevel: 1, aimiScore: 28.9, aimiLabel: "Starter",
    skills: ["PRD", "JTBD", "유저리서치", "로드맵"],
    joinDate: "2023-11-20", bio: "데이터 기반 의사결정을 추구하는 프로덕트 매니저",
  },
  {
    id: "u-005", name: "김태영", role: "Tech Lead", team: "개발팀", teamColor: "#1722E8",
    email: "taeyoung@softsquared.com", aimiLevel: 3, aimiScore: 44.3, aimiLabel: "Architect",
    skills: ["Architecture", "DevOps", "AI Strategy", "코드리뷰"],
    joinDate: "2023-06-01", bio: "AI Ops 전략 수립과 팀 기술 방향 리드",
  },
  {
    id: "u-006", name: "정다은", role: "Data Analyst", team: "기획팀", teamColor: "#f59e0b",
    email: "daeun@softsquared.com", aimiLevel: 2, aimiScore: 33.5, aimiLabel: "Reviewer",
    skills: ["Python", "SQL", "Tableau", "A/B Testing"],
    joinDate: "2024-07-08", bio: "프로덕트 데이터 분석 및 실험 설계 담당",
  },
  {
    id: "u-007", name: "윤성호", role: "DevOps Engineer", team: "개발팀", teamColor: "#1722E8",
    email: "sungho@softsquared.com", aimiLevel: 2, aimiScore: 37.2, aimiLabel: "Reviewer",
    skills: ["K8s", "CI/CD", "AWS", "Terraform"],
    joinDate: "2024-02-19", bio: "클라우드 인프라 자동화 및 배포 파이프라인 운영",
  },
  {
    id: "u-008", name: "한소희", role: "Brand Designer", team: "디자인팀", teamColor: "#ec4899",
    email: "sohee@softsquared.com", aimiLevel: 1, aimiScore: 26.4, aimiLabel: "Starter",
    skills: ["일러스트레이터", "Brand Identity", "모션그래픽"],
    joinDate: "2024-09-03", bio: "브랜드 아이덴티티와 마케팅 비주얼 담당 디자이너",
  },
];

// (AiCollabEdge 타입 제거됨 — 인맥맵 기능 삭제)

export const AI_COLLAB_EDGES = [
  { id: "ai-01", source: "u-005", target: "u-001", aiType: "AI 멘토링",    tool: "claude-sonnet-4", sessions: 8,  topic: "기술 리뷰" },
  { id: "ai-02", source: "u-005", target: "u-002", aiType: "AI 멘토링",    tool: "claude-sonnet-4", sessions: 6,  topic: "아키텍처 설계" },
  { id: "ai-03", source: "u-005", target: "u-007", aiType: "리뷰",         tool: "claude-sonnet-4", sessions: 4,  topic: "인프라 리뷰" },
  { id: "ai-04", source: "u-001", target: "u-002", aiType: "공동작업",     tool: "claude-sonnet-4", sessions: 12, topic: "API 연동 개발" },
  { id: "ai-05", source: "u-001", target: "u-003", aiType: "공동작업",     tool: "gpt-4o",          sessions: 9,  topic: "디자인시스템 구현" },
  { id: "ai-06", source: "u-001", target: "u-007", aiType: "공동작업",     tool: "claude-haiku",    sessions: 5,  topic: "배포 파이프라인" },
  { id: "ai-07", source: "u-002", target: "u-007", aiType: "공동작업",     tool: "claude-haiku",    sessions: 7,  topic: "배포 자동화" },
  { id: "ai-08", source: "u-004", target: "u-001", aiType: "프롬프트 공유", tool: "gpt-4o",         sessions: 5,  topic: "기능 스펙 전달" },
  { id: "ai-09", source: "u-004", target: "u-003", aiType: "프롬프트 공유", tool: "gpt-4o",         sessions: 4,  topic: "UX 리뷰 요청" },
  { id: "ai-10", source: "u-006", target: "u-004", aiType: "공동작업",     tool: "gemini-1.5-pro",  sessions: 6,  topic: "데이터 분석 리포트" },
  { id: "ai-11", source: "u-003", target: "u-008", aiType: "리뷰",         tool: "gpt-4o",          sessions: 3,  topic: "브랜드 디자인 피드백" },
  { id: "ai-12", source: "u-001", target: "u-006", aiType: "프롬프트 공유", tool: "claude-haiku",   sessions: 3,  topic: "분석 쿼리 공유" },
  { id: "ai-13", source: "u-005", target: "u-004", aiType: "공동작업",     tool: "claude-sonnet-4", sessions: 5,  topic: "로드맵 AI 검토" },
];

export const RELATION_EDGES = [
  { id: "e-01", source: "u-005", target: "u-001", type: "멘토링", label: "기술 멘토링" },
  { id: "e-02", source: "u-005", target: "u-002", type: "멘토링", label: "아키텍처 리뷰" },
  { id: "e-03", source: "u-005", target: "u-007", type: "보고", label: "인프라 보고" },
  { id: "e-04", source: "u-001", target: "u-002", type: "협업", label: "API 연동" },
  { id: "e-05", source: "u-001", target: "u-003", type: "프로젝트", label: "디자인시스템" },
  { id: "e-06", source: "u-002", target: "u-007", type: "협업", label: "배포 자동화" },
  { id: "e-07", source: "u-003", target: "u-008", type: "협업", label: "브랜드 협업" },
  { id: "e-08", source: "u-004", target: "u-001", type: "프로젝트", label: "기능 기획" },
  { id: "e-09", source: "u-004", target: "u-003", type: "프로젝트", label: "UX 리뷰" },
  { id: "e-10", source: "u-004", target: "u-006", type: "협업", label: "데이터 분석" },
  { id: "e-11", source: "u-006", target: "u-004", type: "보고", label: "지표 리포트" },
  { id: "e-12", source: "u-005", target: "u-004", type: "협업", label: "로드맵 조율" },
  { id: "e-13", source: "u-001", target: "u-007", type: "협업", label: "배포 연동" },
];

// ================================
// 보안 감지 규칙
// ================================
export const MOCK_RISK_RULES: RiskRule[] = [
  {
    id: "rule-001", name: "API 키 노출 감지", description: "프롬프트에 API 키, 시크릿 토큰 등 민감한 인증 정보가 포함된 경우를 탐지합니다.",
    category: "confidential", severity: "critical", enabled: true,
    patterns: ["sk-proj-", "sk-ant-", "AKIA", "ghp_", "xoxb-", "Bearer ey"],
    match_field: "prompt", created_at: "2026-03-01T00:00:00Z", updated_at: "2026-03-15T00:00:00Z",
  },
  {
    id: "rule-002", name: "내부 인프라 정보 유출", description: "내부 서버 주소, 프로젝트 코드명 등 비공개 인프라 정보의 노출을 감지합니다.",
    category: "confidential", severity: "warning", enabled: true,
    patterns: ["internal-", ".softsquared.io", "ThinkTrace", "10.0.", "192.168."],
    match_field: "both", created_at: "2026-03-01T00:00:00Z", updated_at: "2026-03-15T00:00:00Z",
  },
  {
    id: "rule-003", name: "비밀번호/시크릿 포함", description: "비밀번호, DB 자격증명, 시크릿 키 등이 프롬프트에 포함된 경우를 탐지합니다.",
    category: "security", severity: "critical", enabled: true,
    patterns: ["password", "비밀번호", "p@ss", "secret_key", "private_key", "DB_p@ss"],
    match_field: "prompt", created_at: "2026-03-01T00:00:00Z", updated_at: "2026-03-10T00:00:00Z",
  },
  {
    id: "rule-004", name: "급여/보상 정보", description: "연봉, 급여, 보상 패키지 등 인사 관련 기밀 정보의 노출을 감지합니다.",
    category: "compliance", severity: "critical", enabled: true,
    patterns: ["연봉", "급여", "salary", "보상 패키지", "스톡옵션"],
    match_field: "both", created_at: "2026-03-01T00:00:00Z", updated_at: "2026-03-10T00:00:00Z",
  },
  {
    id: "rule-005", name: "업무 외 사용 감지", description: "게임, 여행, 맛집 등 업무와 무관한 개인적 용도의 AI 사용을 감지합니다.",
    category: "non_work", severity: "info", enabled: true,
    patterns: ["게임 추천", "맛집", "여행 계획", "영화 추천", "주식 추천", "로또"],
    match_field: "prompt", created_at: "2026-03-01T00:00:00Z", updated_at: "2026-03-10T00:00:00Z",
  },
  {
    id: "rule-006", name: "고객 개인정보 포함", description: "주민등록번호, 전화번호, 이메일 등 고객 PII(개인식별정보)의 포함 여부를 감지합니다.",
    category: "compliance", severity: "critical", enabled: true,
    patterns: ["주민등록", "주민번호", "카드번호", "계좌번호"],
    match_field: "both", created_at: "2026-03-05T00:00:00Z", updated_at: "2026-03-15T00:00:00Z",
  },
  {
    id: "rule-007", name: "소스코드 외부 반출 의심", description: "대량의 소스코드를 외부 서비스에 업로드하거나 공유하려는 시도를 감지합니다.",
    category: "security", severity: "warning", enabled: true,
    patterns: ["pastebin", "gist.github", "hastebin", "코드 전체를 복사"],
    match_field: "prompt", created_at: "2026-03-05T00:00:00Z", updated_at: "2026-03-15T00:00:00Z",
  },
  {
    id: "rule-008", name: "부적절한 콘텐츠 요청", description: "혐오 표현, 불법 콘텐츠 등 부적절한 요청을 감지합니다.",
    category: "compliance", severity: "warning", enabled: false,
    patterns: ["해킹 방법", "불법 다운로드", "크랙", "탈세 방법"],
    match_field: "prompt", created_at: "2026-03-10T00:00:00Z", updated_at: "2026-03-10T00:00:00Z",
  },
  {
    id: "rule-009", name: "경쟁사 기밀 분석 요청", description: "경쟁사의 미공개 정보나 영업비밀에 대한 분석 요청을 감지합니다.",
    category: "compliance", severity: "warning", enabled: true,
    patterns: ["경쟁사 내부", "유출된 자료", "비공개 문서"],
    match_field: "prompt", created_at: "2026-03-10T00:00:00Z", updated_at: "2026-03-10T00:00:00Z",
  },
];

// ================================
// 보안 감지 알림
// ================================
export const MOCK_RISK_ALERTS: RiskAlert[] = [
  { id: "alert-001", rule_id: "rule-001", log_id: "log-risk-001", severity: "critical", matched_pattern: "sk-proj-", matched_text_preview: "...API 키를 사용해서... sk-proj-abc123def456ghi789...", timestamp: "2026-03-25T09:15:01Z", dismissed: false },
  { id: "alert-002", rule_id: "rule-005", log_id: "log-risk-002", severity: "info", matched_pattern: "게임 추천", matched_text_preview: "...재밌는 PC 게임 추천해줘. RPG 장르 위주로...", timestamp: "2026-03-25T13:40:01Z", dismissed: false },
  { id: "alert-003", rule_id: "rule-002", log_id: "log-risk-003", severity: "warning", matched_pattern: "ThinkTrace", matched_text_preview: "ThinkTrace 프로젝트의 내부 아키텍처 다이어그램을...", timestamp: "2026-03-26T10:20:01Z", dismissed: false },
  { id: "alert-004", rule_id: "rule-002", log_id: "log-risk-003", severity: "warning", matched_pattern: "internal-", matched_text_preview: "...서버는 internal-api.softsquared.io:8443 에...", timestamp: "2026-03-26T10:20:02Z", dismissed: false },
  { id: "alert-005", rule_id: "rule-003", log_id: "log-risk-003", severity: "critical", matched_pattern: "DB_p@ss", matched_text_preview: "...DB 비밀번호는 Prod_DB_p@ss2026! 이고...", timestamp: "2026-03-26T10:20:03Z", dismissed: false },
  { id: "alert-006", rule_id: "rule-004", log_id: "log-risk-004", severity: "critical", matched_pattern: "연봉", matched_text_preview: "...직원들 연봉 테이블을 정리해줘. 팀장급은 7000만원...", timestamp: "2026-03-27T15:00:01Z", dismissed: false },
  { id: "alert-007", rule_id: "rule-002", log_id: "log-risk-003", severity: "warning", matched_pattern: ".softsquared.io", matched_text_preview: "...internal-api.softsquared.io:8443 에 있어.", timestamp: "2026-03-26T10:20:04Z", dismissed: true },
  { id: "alert-008", rule_id: "rule-003", log_id: "log-risk-003", severity: "critical", matched_pattern: "비밀번호", matched_text_preview: "...DB 비밀번호는 Prod_DB_p@ss2026!...", timestamp: "2026-03-26T10:20:05Z", dismissed: true },
];
