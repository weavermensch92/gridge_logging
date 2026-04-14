#!/usr/bin/env npx tsx
/**
 * 03: AI 분석 대상 → 고객사별 pending.jsonl 생성
 *
 * stdin: 02의 stdout (의심 로그 JSONL)
 * 출력: orgs/{orgId}/pending.jsonl
 */
import fs from "fs";
import path from "path";
import readline from "readline";

const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../config/default.json"), "utf-8"));
const BATCH_SIZE = config.batch.max_logs_per_batch;
const HEAD = config.batch.prompt_preview_head;
const TAIL = config.batch.prompt_preview_tail;

async function main() {
  const logsByOrg: Record<string, unknown[]> = {};

  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const log = JSON.parse(line);
      const orgId = log.org_id || "org-001"; // Mock은 전부 org-001
      if (!logsByOrg[orgId]) logsByOrg[orgId] = [];

      // Claude에 보낼 필드만 추출 (토큰 절약)
      const prompt = log.prompt || "";
      const preview = prompt.length > HEAD + TAIL
        ? prompt.slice(0, HEAD) + "\n...[중략]...\n" + prompt.slice(-TAIL)
        : prompt;

      logsByOrg[orgId].push({
        id: log.id,
        user: `${log.user_name || "?"} (${log.team || "?"})`,
        channel: log.channel,
        model: log.model,
        prompt_preview: preview,
        tokens: (log.input_tokens || 0) + (log.output_tokens || 0),
        cost: log.cost_usd || 0,
        timestamp: log.timestamp,
        suspect_reasons: log.suspect_reasons || [],
      });
    } catch { /* skip */ }
  }

  let totalFiles = 0;
  for (const [orgId, logs] of Object.entries(logsByOrg)) {
    const orgDir = path.resolve(__dirname, `../orgs/${orgId}`);
    if (!fs.existsSync(orgDir)) fs.mkdirSync(orgDir, { recursive: true });

    // 배치 분할
    for (let i = 0; i < logs.length; i += BATCH_SIZE) {
      const batch = logs.slice(i, i + BATCH_SIZE);
      const suffix = logs.length > BATCH_SIZE ? `-${String(Math.floor(i / BATCH_SIZE) + 1).padStart(3, "0")}` : "";
      const filePath = path.join(orgDir, `pending${suffix}.jsonl`);
      fs.writeFileSync(filePath, batch.map(l => JSON.stringify(l)).join("\n") + "\n");
      totalFiles++;
    }

    process.stderr.write(`[03-batch] ${orgId}: ${logs.length}건 → ${Math.ceil(logs.length / BATCH_SIZE)}개 배치\n`);
  }

  process.stderr.write(`[03-batch] 총 ${totalFiles}개 pending 파일 생성\n`);
}

main().catch(e => { process.stderr.write(`[03-batch] 오류: ${e.message}\n`); process.exit(1); });
