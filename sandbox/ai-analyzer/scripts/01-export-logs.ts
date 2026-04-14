#!/usr/bin/env npx tsx
/**
 * 01: 미스캔 로그 추출 → JSONL stdout
 *
 * 사용법: npx tsx scripts/01-export-logs.ts --source mock
 */
import { loadLogs } from "../lib/log-loader";

const source = (process.argv.includes("--source") ? process.argv[process.argv.indexOf("--source") + 1] : "mock") as "mock" | "db";

const logs = loadLogs(source);

for (const log of logs) {
  process.stdout.write(JSON.stringify(log) + "\n");
}

process.stderr.write(`[01-export] ${logs.length}건 추출 (source: ${source})\n`);
