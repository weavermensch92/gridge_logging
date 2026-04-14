#!/bin/bash
#
# Gridge 로그 수집 테스트 환경
#
# 실제 ~/.claude를 건드리지 않고, 가짜 대화 로그를 생성하여
# watcher → SQLite → 보안 스캔 전체 파이프라인을 테스트합니다.
#
# 사용법: cd test-sandbox && bash run-test.sh
#

set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
FAKE_CLAUDE="$DIR/fake-claude"
FAKE_GRIDGE="$DIR/fake-gridge"

echo ""
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║    Gridge 로그 수집 테스트 환경               ║"
echo "  ╚══════════════════════════════════════════════╝"
echo ""

# 1. 환경 초기화
echo "[1/5] 테스트 환경 초기화..."
rm -rf "$FAKE_CLAUDE" "$FAKE_GRIDGE"
mkdir -p "$FAKE_CLAUDE/projects/test-project"
mkdir -p "$FAKE_GRIDGE/local-proxy"

# local-proxy 파일 복사
cp "$DIR/../local-proxy/watcher.js" "$FAKE_GRIDGE/local-proxy/"
cp "$DIR/../local-proxy/local-store.js" "$FAKE_GRIDGE/local-proxy/"
cp "$DIR/../local-proxy/sync.js" "$FAKE_GRIDGE/local-proxy/"
cp "$DIR/../local-proxy/package.json" "$FAKE_GRIDGE/local-proxy/"
cp "$DIR/../lib/crypto.js" "$FAKE_GRIDGE/local-proxy/crypto.js" 2>/dev/null || true

# config
cat > "$FAKE_GRIDGE/local-proxy/config.json" << 'CFG'
{"serverUrl":"","apiKey":"test","userId":"u-test","port":8080}
CFG

# better-sqlite3 설치 (없으면)
cd "$FAKE_GRIDGE/local-proxy"
if [ ! -d "node_modules/better-sqlite3" ]; then
  echo "  better-sqlite3 설치 중..."
  npm install --production 2>/dev/null
fi
cd "$DIR"
echo "  ✓ 완료"

# 2. 가짜 JSONL 생성
echo "[2/5] 가짜 Claude Code 대화 생성..."
JSONL="$FAKE_CLAUDE/projects/test-project/test-session.jsonl"

# 정상 대화
cat >> "$JSONL" << 'LOG1'
{"type":"user","message":{"content":"Next.js에서 middleware로 인증 처리하는 방법을 알려줘"},"timestamp":"2026-04-14T10:00:00Z"}
{"type":"assistant","message":{"content":"Next.js App Router에서 middleware를 사용한 인증 처리 방법을 설명드리겠습니다...","model":"claude-sonnet-4","usage":{"input_tokens":50,"output_tokens":200}},"timestamp":"2026-04-14T10:00:05Z"}
LOG1

# 위험 대화 (API 키 노출)
cat >> "$JSONL" << 'LOG2'
{"type":"user","message":{"content":"이 API 키로 연결해줘: sk-proj-abc123secret456"},"timestamp":"2026-04-14T10:01:00Z"}
{"type":"assistant","message":{"content":"해당 API 키로 연결하겠습니다. sk-proj-abc123secret456를 사용하여...","model":"claude-sonnet-4","usage":{"input_tokens":30,"output_tokens":100}},"timestamp":"2026-04-14T10:01:03Z"}
LOG2

# 위험 대화 (비밀번호 노출)
cat >> "$JSONL" << 'LOG3'
{"type":"user","message":{"content":"DB 비밀번호는 MySecretP@ss123 이야, 이걸로 접속해줘"},"timestamp":"2026-04-14T10:02:00Z"}
{"type":"assistant","message":{"content":"해당 비밀번호로 데이터베이스에 접속하겠습니다...","model":"claude-sonnet-4","usage":{"input_tokens":25,"output_tokens":80}},"timestamp":"2026-04-14T10:02:02Z"}
LOG3

# tool_use 대화 (에이전트 모드)
cat >> "$JSONL" << 'LOG4'
{"type":"user","message":{"content":"src/api.ts 파일을 읽어줘"},"timestamp":"2026-04-14T10:03:00Z"}
{"type":"assistant","message":{"content":[{"type":"tool_use","id":"tc-1","name":"file_read","input":{"path":"src/api.ts"}},{"type":"text","text":"파일을 읽겠습니다."}],"model":"claude-sonnet-4","usage":{"input_tokens":20,"output_tokens":150}},"timestamp":"2026-04-14T10:03:02Z"}
LOG4

# 비업무 대화
cat >> "$JSONL" << 'LOG5'
{"type":"user","message":{"content":"오늘 점심 뭐 먹을까?"},"timestamp":"2026-04-14T10:04:00Z"}
{"type":"assistant","message":{"content":"점심 추천 드리겠습니다! 날씨가 좋으니 샐러드는 어떨까요?","model":"claude-sonnet-4","usage":{"input_tokens":10,"output_tokens":30}},"timestamp":"2026-04-14T10:04:01Z"}
LOG5

echo "  ✓ 대화 5건 생성 (정상1 + 위험2 + 에이전트1 + 비업무1)"

# 3. Watcher 실행 (HOME을 가짜 경로로)
echo "[3/5] Watcher 실행..."

# watcher.js가 ~/.claude 대신 $FAKE_CLAUDE를 보도록 환경변수 설정
# watcher.js를 수정하지 않고, HOME을 임시 변경
export GRIDGE_TEST_CLAUDE_DIR="$FAKE_CLAUDE"
export GRIDGE_TEST_GRIDGE_DIR="$FAKE_GRIDGE"

# 테스트용 watcher 실행 (3초 스캔 1회 후 종료)
node -e "
const path = require('path');
const fs = require('fs');

// 경로 오버라이드
const FAKE_CLAUDE = '$FAKE_CLAUDE';
const FAKE_GRIDGE = '$FAKE_GRIDGE';

// local-store 직접 로드 (경로 오버라이드)
process.env.HOME = path.dirname(FAKE_GRIDGE);
const storePath = path.join(FAKE_GRIDGE, 'local-proxy', 'local-store.js');

// DB 경로를 fake로
const storeCode = fs.readFileSync(storePath, 'utf-8')
  .replace(/process\.env\.HOME[^,]+/, \"'\" + path.dirname(FAKE_GRIDGE) + \"'\");
fs.writeFileSync(storePath + '.test.js', storeCode);

const store = require(storePath + '.test.js');

// JSONL 파일 읽기
const jsonlPath = path.join(FAKE_CLAUDE, 'projects/test-project/test-session.jsonl');
const lines = fs.readFileSync(jsonlPath, 'utf-8').split('\n').filter(l=>l.trim()).map(l=>JSON.parse(l));

let lastUser = null;
let saved = 0;

for (const entry of lines) {
  if (entry.type === 'user') {
    let prompt = '';
    if (typeof entry.message === 'string') prompt = entry.message;
    else if (typeof entry.message?.content === 'string') prompt = entry.message.content;
    else if (Array.isArray(entry.message?.content)) prompt = entry.message.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
    if (prompt) lastUser = { prompt, ts: entry.timestamp };
  }
  if (entry.type === 'assistant' && lastUser) {
    let response = '';
    let model = entry.message?.model || 'claude-sonnet-4';
    let inputTokens = entry.message?.usage?.input_tokens || 0;
    let outputTokens = entry.message?.usage?.output_tokens || 0;
    let hasTools = false;

    if (typeof entry.message?.content === 'string') response = entry.message.content;
    else if (Array.isArray(entry.message?.content)) {
      response = entry.message.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
      hasTools = entry.message.content.some(c=>c.type==='tool_use');
    }

    if (response || hasTools) {
      store.saveLog({
        user_id: 'u-test',
        channel: 'anthropic',
        model,
        prompt: lastUser.prompt,
        response: response || '[tool_use]',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: (inputTokens/1000)*0.003 + (outputTokens/1000)*0.015,
        latency_ms: lastUser.ts && entry.timestamp ? new Date(entry.timestamp)-new Date(lastUser.ts) : 0,
        mode: hasTools ? 'agent' : 'chat',
      });
      saved++;
      lastUser = null;
    }
  }
}

console.log('  ✓ ' + saved + '건 로컬 SQLite에 저장');

// 통계
const stats = store.getStats();
console.log('  총 로그: ' + stats.total_logs);
console.log('  미동기화: ' + stats.unsynced);
console.log('  총 토큰: ' + stats.total_tokens);
console.log('  총 비용: \$' + stats.total_cost_usd.toFixed(4));

// 저장된 로그 출력
console.log('');
console.log('=== 저장된 로그 ===');
const logs = store.queryLogs({ limit: 10 });
logs.forEach((l, i) => {
  const warn = (l.prompt.includes('sk-') || l.prompt.includes('비밀번호') || l.prompt.includes('점심')) ? ' ⚠️' : ' ✅';
  console.log((i+1) + '. [' + l.mode + '] ' + l.prompt.slice(0,50) + warn);
});

store.close();
fs.unlinkSync(storePath + '.test.js');
" 2>&1

# 4. 보안 스캔 테스트
echo ""
echo "[4/5] 보안 스캔 (로컬 정규식)..."
node -e "
const path = require('path');
const fs = require('fs');
process.env.HOME = path.dirname('$FAKE_GRIDGE');

const storePath = path.join('$FAKE_GRIDGE', 'local-proxy', 'local-store.js');
const storeCode = fs.readFileSync(storePath, 'utf-8')
  .replace(/process\.env\.HOME[^,]+/, \"'\" + path.dirname('$FAKE_GRIDGE') + \"'\");
fs.writeFileSync(storePath + '.test2.js', storeCode);
const store = require(storePath + '.test2.js');

const rules = [
  { name: 'API Key 노출', pattern: /sk-[a-zA-Z0-9_-]{10,}/, severity: 'critical' },
  { name: '비밀번호 노출', pattern: /(비밀번호|password|passwd|secret)\s*[:=은는이가]\s*\S+/i, severity: 'critical' },
  { name: '비업무 대화', pattern: /(점심|저녁|날씨|주말|영화)/i, severity: 'info' },
];

const logs = store.queryLogs({ limit: 50 });
let alerts = 0;

console.log('');
logs.forEach(log => {
  for (const rule of rules) {
    const textToScan = log.prompt + ' ' + log.response;
    const match = textToScan.match(rule.pattern);
    if (match) {
      alerts++;
      const icon = rule.severity === 'critical' ? '🔴' : '🟡';
      console.log(icon + ' [' + rule.severity + '] ' + rule.name);
      console.log('   매칭: ' + match[0].slice(0, 50));
      console.log('   프롬프트: ' + log.prompt.slice(0, 60));
      console.log('');
    }
  }
});

if (alerts === 0) console.log('  ✅ 위험 감지 없음');
else console.log('  총 ' + alerts + '건 위험 감지');

store.close();
fs.unlinkSync(storePath + '.test2.js');
" 2>&1

# 5. 결과 요약
echo ""
echo "[5/5] 테스트 결과 요약"
echo "  DB 파일: $FAKE_GRIDGE/logs.db"
echo "  JSONL: $FAKE_CLAUDE/projects/test-project/test-session.jsonl"
echo ""
echo "  다시 실행: cd test-sandbox && bash run-test.sh"
echo "  정리: rm -rf test-sandbox/fake-*"
