/**
 * 로그 분류 체계 (Log Classification Schema)
 *
 * 수집된 로그는 아래 규칙에 따라 자동 분류됩니다.
 * 분류는 백엔드에서 로그 수집(ingest) 시 또는 배치로 수행됩니다.
 */

// ── SDLC 단계 ──
export type SdlcPhase =
  | "requirements"    // 요구사항
  | "design"          // 설계
  | "implementation"  // 구현
  | "testing"         // 테스트
  | "maintenance"     // 운영/유지보수
  | "architecture"    // 아키텍처/설계
  | "documentation"   // 규격서/문서화
  | "unknown";
// rule: 키워드 → 이터리 기반 분류

// ── 작업 의도 ──
export type TaskIntent =
  | "creation"        // 생성/구현
  | "refactoring"     // 리팩토링
  | "debugging"       // 디버깅
  | "review"          // 리뷰/검토
  | "learning"        // 학습
  | "planning"        // 기획/계획
  | "operation"       // 운영/관리(운영자키워드)
  | "unknown";
// rule: 프롬프트 키워드 1차 → AI 의도 분석 2차

// ── 산출물 유형 ──
export type ArtifactType =
  | "code"            // 코드
  | "test"            // 테스트 코드
  | "config"          // 설정 파일
  | "docs"            // 문서/설명
  | "ci_cd"           // CI/CD
  | "data"            // 데이터/스크립트
  | "unknown";
// rule: 파일 확장자, 프롬프트/응답 내용 패턴

// ── 프롬프트 구조 수준 ──
export type PromptStructureLevel = "short" | "structured" | "role_based";
// rule: 역할 지정(구조화 키워드/조건/제약) 포함 여부

// ── 컨텍스트 활용도 ──
export type ContextUsage = "none" | "partial" | "rich";
// rule: 이전 대화 참조, 코드/파일 첨부 여부

// ── 검증 존재 여부 ──
export type ValidationPresence = "none" | "implicit" | "explicit";
// rule: 응답에 테스트/검증/확인 과정 포함 여부

// ── 반복 깊이 ──
export type IterationDepth = "single" | "shallow" | "deep";
// rule: interaction 내 user 메시지 (1/2-3/4+)

// ── 실행 vs 의사결정 ──
export type ExecutionVsDecision = "execution" | "decision" | "hybrid";
// rule: 비교/구조 vs 생성/수정 키워드

// ── 통제 수준 ──
export type ControlLevel = "low_control" | "medium_control" | "high_control";
// rule: goal만 vs 생성 수정 키워드

// ── 로그 분류 결과 ──
export type LogClassification = {
  // 카테고리 분류
  sdlc_phase: SdlcPhase;
  task_intent: TaskIntent;
  artifact_type: ArtifactType;
  prompt_structure_level: PromptStructureLevel;
  context_usage: ContextUsage;
  validation_presence: ValidationPresence;
  iteration_depth: IterationDepth;
  execution_vs_decision: ExecutionVsDecision;
  control_level: ControlLevel;

  // 감지 플래그
  retry_loop_detected: boolean;        // user 내 동일 prompt_key 3회+ (deep or debugging or again이 포함)
  over_token_usage: boolean;           // 조직 전체 estimated_total_tokens 대비 10%(p90)
  low_reuse_prompt: boolean;           // low_reuse_key 기준값 미달 >60%
  fire_fighting_mode: boolean;         // 단위 업무당 디버깅 비율 >60%

  // 수치 지표
  user_name: string;
  team: string;
  career_years?: number;
  prompts: number;                     // 총 프롬프트 수
  total_tokens: number;                // 누적 토큰
  total_cost_usd: number;              // 비용
  p90_tokens: number;                  // 토큰 상위 10%
  reuse_rate: number;                  // 0~1, 재사용 프롬프트 비율
  fire_fighting_ratio: number;         // 0~1, 디버깅/디버깅 비율
  retry_loop_rate: number;             // 0~1, retry별 토큰 비율
  over_token_rate: number;             // 0~1, 비정상 토큰 비율
  smalltalk_rate: number;              // 0~1, 비업무 프롬프트 비율

  // SDLC 분포 (각 phase별 비율)
  sdlc_distribution: Record<SdlcPhase, number>;

  // 아티팩트 분포
  artifact_distribution: Record<ArtifactType, number>;
};

/** 분류 규칙 정의 (백엔드에서 구현) */
export const CLASSIFICATION_RULES = {
  sdlc_phase: {
    description: "키워드 → 이터리 기반 분류",
    keywords: {
      requirements: ["요구사항", "기획", "specification", "requirement", "user story"],
      design: ["설계", "아키텍처", "design", "architecture", "ERD", "flowchart"],
      implementation: ["구현", "개발", "코딩", "implement", "create", "build", "코드"],
      testing: ["테스트", "test", "QA", "검증", "unit test", "e2e"],
      maintenance: ["유지보수", "운영", "배포", "deploy", "hotfix", "모니터링"],
      documentation: ["문서", "README", "주석", "comment", "규격서", "API 문서"],
    },
  },

  task_intent: {
    description: "프롬프트 키워드 1차 → AI 의도 분석 2차",
    keywords: {
      creation: ["만들어", "생성", "create", "구현", "build", "new", "추가"],
      refactoring: ["리팩토링", "refactor", "개선", "정리", "최적화", "clean"],
      debugging: ["디버깅", "debug", "에러", "오류", "버그", "fix", "수정", "왜"],
      review: ["리뷰", "review", "검토", "확인", "피드백"],
      learning: ["설명", "explain", "알려", "배우", "차이", "비교", "how"],
      planning: ["기획", "plan", "설계", "구조", "전략"],
      operation: ["배포", "deploy", "운영", "서버", "infra", "모니터링"],
    },
  },

  prompt_structure_level: {
    description: "역할 지정/구조화 키워드/조건/제약 포함 여부",
    rules: {
      role_based: "역할 지정 키워드 포함 (너는, you are, as a, 역할:)",
      structured: "조건/제약/포맷 지정 포함 (조건:, 제약:, format:, 다음과 같이)",
      short: "위 조건 미충족 (단순 질문/명령)",
    },
  },

  retry_loop_detected: {
    description: "user 내 동일 prompt_key 3회+ (deep or debugging or again 포함)",
    rule: "동일 유저가 유사 프롬프트를 3회 이상 반복 + 디버깅/재시도 키워드",
  },

  over_token_usage: {
    description: "조직 전체 estimated_total_tokens 대비 상위 10% (p90)",
    rule: "해당 로그의 총 토큰이 조직 전체 p90 이상",
  },

  fire_fighting_mode: {
    description: "단위 업무당 디버깅 비율 >60%",
    rule: "특정 기간 내 동일 유저의 디버깅 의도 로그 / 전체 로그 > 0.6",
  },
} as const;
