#!/bin/bash
# Gridge AI Analyzer — 전체 파이프라인 실행
# 사용법: bash scripts/run-full-pipeline.sh [--dry-run]
set -euo pipefail

cd "$(dirname "$0")/.."
DRY_RUN="${1:---dry-run}"  # 기본 dry-run
ORG="org-001"
ALERTS_FILE="orgs/$ORG/regex-alerts.jsonl"

echo ""
echo "═══════════════════════════════════════════"
echo "  Gridge AI Analyzer Pipeline"
echo "  Org: $ORG | Mode: $DRY_RUN"
echo "═══════════════════════════════════════════"
echo ""

START=$(date +%s)

# 01 → 02 → 03 파이프라인
npx tsx scripts/01-export-logs.ts --source mock | \
npx tsx scripts/02-regex-filter.ts --alerts-out "$ALERTS_FILE" | \
npx tsx scripts/03-prepare-batch.ts

# 04: Claude 분석
chmod +x scripts/04-claude-analyze.sh
bash scripts/04-claude-analyze.sh "$ORG" "$DRY_RUN"

# 05: 결과 파싱
npx tsx scripts/05-parse-results.ts "$ORG"

# 06: 알림 변환
npx tsx scripts/06-import-alerts.ts "$ORG"

END=$(date +%s)
ELAPSED=$((END - START))

echo ""
echo "═══════════════════════════════════════════"
echo "  파이프라인 완료 (${ELAPSED}초)"
echo ""
echo "  정규식 알림: $ALERTS_FILE"
echo "  AI 분석 알림: orgs/$ORG/alerts.json"
echo "  코칭 힌트: orgs/$ORG/coaching.jsonl"
echo "═══════════════════════════════════════════"
