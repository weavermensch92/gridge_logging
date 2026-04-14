#!/usr/bin/env npx tsx
/**
 * 05: Claude 출력 → 구조화된 results.jsonl 파싱
 */
import { parseClaudeOutput } from "../lib/result-parser";
import fs from "fs";
import path from "path";

const orgId = process.argv[2] || "org-softsquared";
const orgDir = path.resolve(__dirname, `../orgs/${orgId}`);
const resultsPath = path.join(orgDir, "results.jsonl");
const errorPath = path.join(orgDir, "error.jsonl");

if (!fs.existsSync(resultsPath)) {
  process.stderr.write(`[05-parse] results.jsonl 없음\n`);
  process.exit(0);
}

const raw = fs.readFileSync(resultsPath, "utf-8");
const { results, errors } = parseClaudeOutput(raw);

// 정제된 결과 저장
fs.writeFileSync(resultsPath, results.map(r => JSON.stringify(r)).join("\n") + "\n");

// 에러 저장
if (errors.length > 0) {
  fs.writeFileSync(errorPath, errors.map(e => JSON.stringify(e)).join("\n") + "\n");
}

process.stderr.write(`[05-parse] 성공: ${results.length}건 | 에러: ${errors.length}건\n`);
