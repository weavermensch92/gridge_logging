/**
 * 정규식 매칭 엔진
 *
 * risk_rules의 patterns를 사용하여 로그를 스캔합니다.
 * 매칭 → 즉시 알림 생성
 * 미매칭 + 의심 조건 → AI 분석 대상으로 분류
 */
import type { Log, RiskAlert, RiskRule, SuspectReason } from "./types";
import fs from "fs";
import path from "path";

const config = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../config/default.json"), "utf-8")
);
const thresholds = config.regex_filter.suspect_thresholds;

export type FilterResult = {
  alerts: RiskAlert[];           // 정규식 매칭 → 즉시 알림
  suspects: (Log & { suspect_reasons: SuspectReason[] })[];  // AI 분석 대상
  clean: string[];               // 정상 (log_id 목록)
};

/**
 * 로그 배열에 대해 정규식 필터 + 의심 조건 평가
 */
export function filterLogs(logs: Log[], rules: RiskRule[]): FilterResult {
  const alerts: RiskAlert[] = [];
  const suspects: (Log & { suspect_reasons: SuspectReason[] })[] = [];
  const clean: string[] = [];
  const criticalLogIds = new Set<string>();

  for (const log of logs) {
    let matched = false;

    // 정규식 매칭
    for (const rule of rules) {
      const textToScan = getTextToScan(log, rule.match_field);

      for (const pattern of rule.patterns) {
        try {
          // substring match (대소문자 무시)
          if (textToScan.toLowerCase().includes(pattern.toLowerCase())) {
            alerts.push({
              id: `regex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              rule_id: rule.id,
              log_id: log.id,
              severity: rule.severity,
              matched_pattern: pattern,
              matched_text_preview: extractPreview(textToScan, pattern),
              timestamp: new Date().toISOString(),
              dismissed: false,
            });
            matched = true;
            if (rule.severity === "critical") criticalLogIds.add(log.id);
            break; // 같은 규칙 내 다른 패턴은 건너뜀
          }
        } catch { /* invalid regex, skip */ }
      }
    }

    if (matched) continue;

    // 의심 조건 평가
    const reasons = evaluateSuspect(log, criticalLogIds);
    if (reasons.length > 0) {
      suspects.push({ ...log, suspect_reasons: reasons });
    } else {
      clean.push(log.id);
    }
  }

  return { alerts, suspects, clean };
}

function getTextToScan(log: Log, field: "prompt" | "response" | "both"): string {
  if (field === "prompt") return log.prompt;
  if (field === "response") return log.response;
  return `${log.prompt} ${log.response}`;
}

function extractPreview(text: string, pattern: string): string {
  const idx = text.toLowerCase().indexOf(pattern.toLowerCase());
  if (idx === -1) return text.slice(0, 100);
  const start = Math.max(0, idx - 30);
  const end = Math.min(text.length, idx + pattern.length + 30);
  return (start > 0 ? "..." : "") + text.slice(start, end) + (end < text.length ? "..." : "");
}

/**
 * 의심 조건 평가 (정규식 미매칭이지만 AI 분석이 필요한 경우)
 */
function evaluateSuspect(log: Log, criticalLogIds: Set<string>): SuspectReason[] {
  const reasons: SuspectReason[] = [];

  // 대량 입력 토큰
  if (log.input_tokens > thresholds.input_tokens_min) reasons.push("high_tokens");

  // 긴 프롬프트
  if (log.prompt.length > thresholds.prompt_length_min) reasons.push("long_prompt");

  // 코드 블록 100줄 이상
  const codeBlocks = log.prompt.match(/```[\s\S]*?```/g) || [];
  const codeLines = codeBlocks.reduce((sum, block) => sum + block.split("\n").length, 0);
  if (codeLines > thresholds.code_block_lines_min) reasons.push("large_code_block");

  // 테이블/CSV 데이터 20행 이상
  const tableRows = (log.prompt.match(/\|.*\|/g) || []).length;
  const csvRows = (log.prompt.match(/^[^,\n]+,[^,\n]+/gm) || []).length;
  if (tableRows > thresholds.table_rows_min || csvRows > thresholds.table_rows_min) reasons.push("table_data");

  // 이메일 주소 3개 이상
  const emails = (log.prompt.match(/[\w.-]+@[\w.-]+\.\w+/g) || []).length;
  if (emails >= thresholds.email_pattern_min) reasons.push("email_patterns");

  // 숫자 나열 (전화번호/계좌번호) 3개 이상
  const numbers = (log.prompt.match(/\d{3}[-.\s]?\d{3,4}[-.\s]?\d{4}/g) || []).length;
  if (numbers >= thresholds.number_pattern_min) reasons.push("number_patterns");

  // 연쇄 위험 (같은 세션에서 이미 critical 발생)
  if (log.agent_detail?.session_id) {
    // 간이 체크: log_id가 critical 목록에 있는 것과 같은 세션
    // 실제로는 session_id 기반 체크 필요
  }

  return reasons;
}
