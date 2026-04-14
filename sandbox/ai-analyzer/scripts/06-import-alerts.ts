#!/usr/bin/env npx tsx
/**
 * 06: results.jsonl → RiskAlert 형식 변환
 */
import type { AnalysisResult } from "../lib/types";
import fs from "fs";
import path from "path";

const orgId = process.argv[2] || "org-softsquared";
const mode = process.argv.includes("--mode") ? process.argv[process.argv.indexOf("--mode") + 1] : "mock";
const orgDir = path.resolve(__dirname, `../orgs/${orgId}`);
const resultsPath = path.join(orgDir, "results.jsonl");
const alertsPath = path.join(orgDir, "alerts.json");
const coachingPath = path.join(orgDir, "coaching.jsonl");

if (!fs.existsSync(resultsPath)) {
  process.stderr.write(`[06-import] results.jsonl 없음\n`);
  process.exit(0);
}

const lines = fs.readFileSync(resultsPath, "utf-8").split("\n").filter(l => l.trim());
const alerts: unknown[] = [];
const coachingHints: unknown[] = [];

for (const line of lines) {
  try {
    const result: AnalysisResult = JSON.parse(line);
    if (result.risk_level === "safe") continue;

    alerts.push({
      id: `ai-alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      rule_id: "ai-analysis",
      log_id: result.log_id,
      severity: result.risk_level,
      matched_pattern: `AI: ${result.category}`,
      matched_text_preview: result.reason,
      timestamp: new Date().toISOString(),
      dismissed: false,
    });

    if (result.coaching_hint) {
      coachingHints.push({
        log_id: result.log_id,
        hint: result.coaching_hint,
        category: result.category,
      });
    }
  } catch { /* skip */ }
}

// 알림 저장
fs.writeFileSync(alertsPath, JSON.stringify(alerts, null, 2));

// 코칭 힌트 저장
if (coachingHints.length > 0) {
  fs.appendFileSync(coachingPath, coachingHints.map(c => JSON.stringify(c)).join("\n") + "\n");
}

process.stderr.write(`[06-import] 알림: ${alerts.length}건 | 코칭: ${coachingHints.length}건 → ${alertsPath}\n`);
