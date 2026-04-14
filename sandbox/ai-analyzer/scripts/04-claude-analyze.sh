#!/bin/bash
# Claude Code CLI로 pending 로그 분석
# 사용법: ./04-claude-analyze.sh [orgId] [--dry-run]
set -euo pipefail

ORG_DIR="$(dirname "$0")/../orgs/${1:?org ID 필수}"
DRY_RUN=false
[[ "${2:-}" == "--dry-run" ]] && DRY_RUN=true

RESULTS="$ORG_DIR/results.jsonl"
> "$RESULTS"  # 초기화

PENDING_FILES=$(ls "$ORG_DIR"/pending*.jsonl 2>/dev/null || true)
if [ -z "$PENDING_FILES" ]; then
  echo "[04-analyze] pending 파일 없음. 분석 대상 없음." >&2
  exit 0
fi

for BATCH_FILE in $PENDING_FILES; do
  COUNT=$(wc -l < "$BATCH_FILE")
  echo "[04-analyze] $(date +%H:%M:%S) 분석 시작: $(basename $BATCH_FILE) (${COUNT}건)" >&2

  if [ "$DRY_RUN" = true ]; then
    # Mock 응답 생성 (테스트용)
    echo "[04-analyze] [DRY-RUN] Mock 응답 생성" >&2
    node -e "
      const fs = require('fs');
      const lines = fs.readFileSync('$BATCH_FILE','utf-8').split('\n').filter(l=>l.trim());
      const results = lines.map(l => {
        const log = JSON.parse(l);
        const prompt = (log.prompt_preview || '').toLowerCase();
        let risk = 'safe', cat = 'safe', reason = '정상 사용', hint = '';
        if (prompt.includes('sk-') || prompt.includes('api key') || prompt.includes('api 키')) {
          risk = 'critical'; cat = 'confidential'; reason = 'API 키 평문 포함'; hint = 'API 키를 환경변수로 관리하세요';
        } else if (prompt.includes('비밀번호') || prompt.includes('password')) {
          risk = 'critical'; cat = 'confidential'; reason = '비밀번호 평문 포함'; hint = '비밀번호를 프롬프트에 포함하지 마세요';
        } else if (prompt.includes('점심') || prompt.includes('여행') || prompt.includes('게임')) {
          risk = 'info'; cat = 'non_work'; reason = '비업무 대화'; hint = '';
        }
        return { log_id: log.id, risk_level: risk, category: cat, reason, coaching_hint: hint };
      });
      console.log(JSON.stringify(results));
    " >> "$RESULTS"
  else
    # 실제 Claude Code CLI 호출
    cd "$ORG_DIR"
    cat "$BATCH_FILE" | claude --print \
      "첨부된 JSONL의 각 로그를 CLAUDE.md에 정의된 기준으로 위험도를 평가해줘.
반드시 아래 JSON 배열 형식으로만 응답해. 설명 텍스트 없이 JSON만 출력해.
[{\"log_id\":\"원본id\",\"risk_level\":\"critical|warning|info|safe\",\"category\":\"confidential|security|compliance|non_work|cost_anomaly|safe\",\"reason\":\"판단근거\",\"coaching_hint\":\"개선제안\"}]" >> "$RESULTS"
  fi

  echo "[04-analyze] $(date +%H:%M:%S) 완료: $(basename $BATCH_FILE)" >&2
done

echo "[04-analyze] 전체 완료. 결과: $RESULTS" >&2
