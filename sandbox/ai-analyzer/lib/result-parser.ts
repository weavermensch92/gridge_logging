/**
 * Claude CLI 출력을 구조화된 JSON으로 파싱
 */
import type { AnalysisResult } from "./types";

const VALID_RISK_LEVELS = new Set(["critical", "warning", "info", "safe"]);
const VALID_CATEGORIES = new Set(["confidential", "security", "compliance", "non_work", "cost_anomaly", "safe"]);

/**
 * Claude 텍스트 출력에서 JSON 배열 추출
 */
export function parseClaudeOutput(rawOutput: string): {
  results: AnalysisResult[];
  errors: { line: number; raw: string; error: string }[];
} {
  const results: AnalysisResult[] = [];
  const errors: { line: number; raw: string; error: string }[] = [];

  // JSON 배열 추출 시도
  const jsonArrays = extractJsonArrays(rawOutput);

  for (const { json, lineNum } of jsonArrays) {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) {
        errors.push({ line: lineNum, raw: json.slice(0, 200), error: "배열이 아님" });
        continue;
      }

      for (const item of parsed) {
        const validation = validateResult(item);
        if (validation.valid) {
          results.push(item as AnalysisResult);
        } else {
          errors.push({ line: lineNum, raw: JSON.stringify(item).slice(0, 200), error: validation.error! });
        }
      }
    } catch (e) {
      errors.push({ line: lineNum, raw: json.slice(0, 200), error: `JSON 파싱 실패: ${(e as Error).message}` });
    }
  }

  return { results, errors };
}

function extractJsonArrays(text: string): { json: string; lineNum: number }[] {
  const arrays: { json: string; lineNum: number }[] = [];

  // 1. ```json 코드블록 내 배열
  const codeBlockRegex = /```(?:json)?\s*\n(\[[\s\S]*?\])\s*\n```/g;
  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const lineNum = text.slice(0, match.index).split("\n").length;
    arrays.push({ json: match[1], lineNum });
  }

  // 2. bare JSON 배열 (코드블록 없이)
  if (arrays.length === 0) {
    const bareRegex = /(\[[\s\S]*?\])/g;
    while ((match = bareRegex.exec(text)) !== null) {
      try {
        JSON.parse(match[1]); // 유효한 JSON인지 확인
        const lineNum = text.slice(0, match.index).split("\n").length;
        arrays.push({ json: match[1], lineNum });
      } catch { /* skip invalid */ }
    }
  }

  return arrays;
}

function validateResult(item: unknown): { valid: boolean; error?: string } {
  if (!item || typeof item !== "object") return { valid: false, error: "객체가 아님" };
  const obj = item as Record<string, unknown>;

  if (!obj.log_id || typeof obj.log_id !== "string") return { valid: false, error: "log_id 없음" };
  if (!VALID_RISK_LEVELS.has(obj.risk_level as string)) return { valid: false, error: `잘못된 risk_level: ${obj.risk_level}` };
  if (!VALID_CATEGORIES.has(obj.category as string)) return { valid: false, error: `잘못된 category: ${obj.category}` };

  return { valid: true };
}
