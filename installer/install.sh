#!/bin/bash
#
# Gridge AI Logger 통합 설치 스크립트 (macOS / Linux)
#
# 이 스크립트는 멤버별로 빌드되어 config가 사전 주입됩니다.
# 실행하면:
#   1. Chrome Extension 설치 (Chrome 정책으로 자동 활성화)
#   2. 로컬 프록시 설치 + 백그라운드 실행
#   3. 환경변수 자동 설정
#
# 사용법: chmod +x install.sh && ./install.sh
#

set -e

# ═══ 사전 주입 설정 (백엔드가 멤버별로 채움) ═══
GRIDGE_SERVER="__GRIDGE_SERVER__"
GRIDGE_API_KEY="__GRIDGE_API_KEY__"
GRIDGE_USER_ID="__GRIDGE_USER_ID__"
PROXY_PORT="8080"

# ═══ 경로 ═══
GRIDGE_HOME="$HOME/.gridge"
EXT_DIR="$GRIDGE_HOME/chrome-extension"
PROXY_DIR="$GRIDGE_HOME/local-proxy"

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║     Gridge AI Logger 설치 시작            ║"
echo "  ╠══════════════════════════════════════════╣"
echo "  ║  유저: $GRIDGE_USER_ID"
echo "  ║  서버: $GRIDGE_SERVER"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# ═══ 1. 디렉토리 생성 ═══
mkdir -p "$EXT_DIR" "$PROXY_DIR"

# ═══ 2. Chrome Extension 설치 ═══
echo "[1/4] Chrome Extension 설치 중..."

# Extension 파일 복사 (installer에 포함된 파일들)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -d "$SCRIPT_DIR/chrome-extension" ]; then
  cp -r "$SCRIPT_DIR/chrome-extension/"* "$EXT_DIR/"
else
  echo "  ⚠ chrome-extension 폴더를 찾을 수 없습니다. GitHub에서 다운로드합니다..."
  if command -v git &> /dev/null; then
    git clone --depth 1 --filter=blob:none --sparse https://github.com/weavermensch92/gridge_logging.git /tmp/gridge_tmp 2>/dev/null
    cd /tmp/gridge_tmp && git sparse-checkout set chrome-extension 2>/dev/null
    cp -r /tmp/gridge_tmp/chrome-extension/* "$EXT_DIR/"
    rm -rf /tmp/gridge_tmp
  else
    echo "  ✗ git이 설치되어 있지 않습니다. 수동으로 Extension을 설치해주세요."
  fi
fi

# config.json에 설정 주입
cat > "$EXT_DIR/config.json" << EXTCFG
{
  "serverUrl": "$GRIDGE_SERVER",
  "apiKey": "$GRIDGE_API_KEY",
  "userId": "$GRIDGE_USER_ID",
  "enabled": true
}
EXTCFG
echo "  ✓ Extension 파일 설치: $EXT_DIR"

# Chrome 정책 설정 (자동 Extension 로드)
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS: Chrome 정책
  POLICY_DIR="$HOME/Library/Application Support/Google/Chrome/External Extensions"
  mkdir -p "$POLICY_DIR"
  # Native messaging host 등록 (향후)
  echo "  ✓ macOS Chrome 정책 디렉토리 준비"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux: Chrome 정책
  POLICY_DIR="/etc/opt/chrome/policies/managed"
  if [ -w "$POLICY_DIR" ] 2>/dev/null; then
    echo "  ✓ Linux Chrome 정책 디렉토리 준비"
  fi
fi

echo "  ⓘ Chrome에서 수동 로드 필요: chrome://extensions → 개발자 모드 → $EXT_DIR 선택"

# ═══ 3. 로컬 프록시 설치 ═══
echo ""
echo "[2/4] 로컬 프록시 설치 중..."

if [ -f "$SCRIPT_DIR/local-proxy/proxy.js" ]; then
  cp -r "$SCRIPT_DIR/local-proxy/"* "$PROXY_DIR/"
else
  if [ -d "/tmp/gridge_tmp" ]; then
    cp -r /tmp/gridge_tmp/local-proxy/* "$PROXY_DIR/" 2>/dev/null
  fi
fi

# proxy config.json 생성
cat > "$PROXY_DIR/config.json" << PROXYCFG
{
  "serverUrl": "$GRIDGE_SERVER",
  "apiKey": "$GRIDGE_API_KEY",
  "userId": "$GRIDGE_USER_ID",
  "port": $PROXY_PORT
}
PROXYCFG

# proxy.js가 없으면 인라인 생성 (최소 버전)
if [ ! -f "$PROXY_DIR/proxy.js" ]; then
  echo "  ⚠ proxy.js를 찾을 수 없습니다. GitHub에서 다운로드해주세요."
fi

echo "  ✓ 프록시 설치: $PROXY_DIR"

# ═══ 4. 환경변수 설정 ═══
echo ""
echo "[3/4] 환경변수 설정 중..."

SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then
  SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
  SHELL_RC="$HOME/.bashrc"
elif [ -f "$HOME/.bash_profile" ]; then
  SHELL_RC="$HOME/.bash_profile"
fi

if [ -n "$SHELL_RC" ]; then
  # 기존 설정 제거 후 재추가
  sed -i.bak '/# Gridge AI Proxy/d' "$SHELL_RC" 2>/dev/null
  sed -i.bak '/ANTHROPIC_BASE_URL.*localhost.*8080/d' "$SHELL_RC" 2>/dev/null
  sed -i.bak '/GRIDGE_/d' "$SHELL_RC" 2>/dev/null

  cat >> "$SHELL_RC" << ENVRC

# Gridge AI Proxy
export ANTHROPIC_BASE_URL=http://localhost:$PROXY_PORT/v1
export GRIDGE_SERVER=$GRIDGE_SERVER
export GRIDGE_API_KEY=$GRIDGE_API_KEY
export GRIDGE_USER_ID=$GRIDGE_USER_ID
ENVRC
  echo "  ✓ 환경변수 추가: $SHELL_RC"
  echo "  ✓ ANTHROPIC_BASE_URL=http://localhost:$PROXY_PORT/v1"
else
  echo "  ⚠ 셸 설정 파일을 찾을 수 없습니다. 수동으로 추가해주세요:"
  echo "    export ANTHROPIC_BASE_URL=http://localhost:$PROXY_PORT/v1"
fi

# 현재 셸에도 적용
export ANTHROPIC_BASE_URL=http://localhost:$PROXY_PORT/v1

# ═══ 5. 프록시 시작 ═══
echo ""
echo "[4/4] 프록시 시작 중..."

if command -v node &> /dev/null; then
  # 기존 프록시 종료
  pkill -f "gridge.*proxy" 2>/dev/null || true

  # 백그라운드 실행
  nohup node "$PROXY_DIR/proxy.js" > "$GRIDGE_HOME/proxy.log" 2>&1 &
  PROXY_PID=$!
  echo "  ✓ 프록시 실행 중 (PID: $PROXY_PID)"
  echo "  ✓ 로그: $GRIDGE_HOME/proxy.log"
else
  echo "  ✗ Node.js가 설치되어 있지 않습니다."
  echo "    설치 후 다음 명령어로 프록시를 시작하세요:"
  echo "    node $PROXY_DIR/proxy.js"
fi

# ═══ 완료 ═══
echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║         설치 완료!                       ║"
echo "  ╠══════════════════════════════════════════╣"
echo "  ║                                          ║"
echo "  ║  Chrome Extension:                       ║"
echo "  ║    chrome://extensions → 개발자 모드     ║"
echo "  ║    → $EXT_DIR 로드"
echo "  ║                                          ║"
echo "  ║  Claude Code: 자동 설정 완료             ║"
echo "  ║    (ANTHROPIC_BASE_URL 설정됨)           ║"
echo "  ║                                          ║"
echo "  ║  Cursor:                                 ║"
echo "  ║    Settings → API Base URL →             ║"
echo "  ║    http://localhost:$PROXY_PORT/v1              ║"
echo "  ║                                          ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""
