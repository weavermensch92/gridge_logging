#!/usr/bin/env npx tsx
/**
 * 02: 정규식 1차 필터
 *
 * stdin: JSONL 로그
 * stdout: AI 분석 필요 로그 (JSONL)
 * --alerts-out: 정규식 매칭 알림 파일
 */
import { filterLogs } from "../lib/regex-engine";
import { loadRiskRules } from "../lib/log-loader";
import type { Log } from "../lib/types";
import fs from "fs";
import readline from "readline";

const alertsOut = process.argv.includes("--alerts-out") ? process.argv[process.argv.indexOf("--alerts-out") + 1] : null;
const rulesSource = (process.argv.includes("--rules-source") ? process.argv[process.argv.indexOf("--rules-source") + 1] : "mock") as "mock" | "db";

async function main() {
  const logs: Log[] = [];

  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) {
    if (line.trim()) {
      try { logs.push(JSON.parse(line)); } catch { /* skip */ }
    }
  }

  const rules = loadRiskRules(rulesSource);
  const { alerts, suspects, clean } = filterLogs(logs, rules);

  // 정규식 매칭 알림 출력
  if (alertsOut) {
    fs.writeFileSync(alertsOut, alerts.map(a => JSON.stringify(a)).join("\n") + "\n");
  }

  // AI 분석 대상 → stdout
  for (const s of suspects) {
    process.stdout.write(JSON.stringify(s) + "\n");
  }

  process.stderr.write(`[02-filter] 입력: ${logs.length}건 | 정규식 알림: ${alerts.length}건 | AI 분석: ${suspects.length}건 | 정상: ${clean.length}건\n`);
}

main().catch(e => { process.stderr.write(`[02-filter] 오류: ${e.message}\n`); process.exit(1); });
