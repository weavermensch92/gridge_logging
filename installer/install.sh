#!/bin/bash
#
# Gridge AI Logger 통합 설치 스크립트 (macOS / Linux)
#
# 실행하면 한번에:
#   1. Chrome Extension 설치 (Claude/Gemini 웹 캡처)
#   2. 로컬 프록시 설치 (Claude Code/Cursor API 캡처)
#   3. 시스템 프록시 설치 (Claude/ChatGPT Desktop 캡처)
#   4. 환경변수 + 시스템 프록시 자동 설정
#   5. 프록시 백그라운드 실행
#
set -e

# ═══ 사전 주입 설정 ═══
GRIDGE_SERVER="__GRIDGE_SERVER__"
GRIDGE_API_KEY="__GRIDGE_API_KEY__"
GRIDGE_USER_ID="__GRIDGE_USER_ID__"
COMPANY_API_KEYS='__COMPANY_API_KEYS__'
LOCAL_PORT="8080"
SYSTEM_PORT="9090"

GRIDGE_HOME="$HOME/.gridge"

echo ""
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║     Gridge AI Logger 통합 설치                ║"
echo "  ╠══════════════════════════════════════════════╣"
echo "  ║  유저: $GRIDGE_USER_ID"
echo "  ║  서버: $GRIDGE_SERVER"
echo "  ╚══════════════════════════════════════════════╝"
echo ""

# ═══ 1. 소스 다운로드 ═══
echo "[1/6] 소스 다운로드 중..."
if [ -d "/tmp/gridge_install" ]; then rm -rf /tmp/gridge_install; fi
if command -v git &>/dev/null; then
  git clone --depth 1 https://github.com/weavermensch92/gridge_logging.git /tmp/gridge_install 2>/dev/null
  echo "  ✓ GitHub에서 다운로드 완료"
else
  echo "  ✗ git이 없습니다. https://github.com/weavermensch92/gridge_logging 에서 ZIP 다운로드 후 수동 설치"
  exit 1
fi

# ═══ 2. Chrome Extension ═══
echo "[2/6] Chrome Extension 설치 중..."
mkdir -p "$GRIDGE_HOME/chrome-extension"
cp -r /tmp/gridge_install/chrome-extension/* "$GRIDGE_HOME/chrome-extension/"
cat > "$GRIDGE_HOME/chrome-extension/config.json" << EOF
{"serverUrl":"$GRIDGE_SERVER","apiKey":"$GRIDGE_API_KEY","userId":"$GRIDGE_USER_ID","enabled":true}
EOF
echo "  ✓ $GRIDGE_HOME/chrome-extension/"

# ═══ 3. 로컬 프록시 (Claude Code / Cursor) ═══
echo "[3/6] 로컬 프록시 설치 중..."
mkdir -p "$GRIDGE_HOME/local-proxy"
cp -r /tmp/gridge_install/local-proxy/* "$GRIDGE_HOME/local-proxy/"
cat > "$GRIDGE_HOME/local-proxy/config.json" << EOF
{"serverUrl":"$GRIDGE_SERVER","apiKey":"$GRIDGE_API_KEY","userId":"$GRIDGE_USER_ID","port":$LOCAL_PORT}
EOF
echo "  ✓ $GRIDGE_HOME/local-proxy/"

# ═══ 4. 시스템 프록시 (Claude/ChatGPT Desktop) ═══
echo "[4/6] 시스템 HTTPS 프록시 설치 중..."
mkdir -p "$GRIDGE_HOME/system-proxy"
cp -r /tmp/gridge_install/system-proxy/* "$GRIDGE_HOME/system-proxy/"
cat > "$GRIDGE_HOME/system-proxy/config.json" << EOF
{
  "port":$SYSTEM_PORT,
  "serverUrl":"$GRIDGE_SERVER",
  "apiKey":"$GRIDGE_API_KEY",
  "userId":"$GRIDGE_USER_ID",
  "interceptDomains":["api.anthropic.com","api.openai.com","claude.ai","chatgpt.com","chat.openai.com"],
  "captureMode":"company_only",
  "companyApiKeys":[$COMPANY_API_KEYS],
  "companySessionPatterns":[]
}
EOF

# CA 인증서 생성 + 설치
if command -v openssl &>/dev/null; then
  cd "$GRIDGE_HOME/system-proxy"
  node gen-cert.js 2>/dev/null
  echo "  ✓ CA 인증서 생성 완료"
  echo "  ⓘ CA 인증서 시스템 설치는 관리자 권한이 필요합니다:"
  echo "    node $GRIDGE_HOME/system-proxy/install-cert.js"
else
  echo "  ⚠ openssl 없음 — 시스템 프록시 사용 시 수동으로 CA 인증서를 생성하세요"
fi
echo "  ✓ $GRIDGE_HOME/system-proxy/"

# ═══ 5. 환경변수 설정 ═══
echo "[5/6] 환경변수 설정 중..."
SHELL_RC="$HOME/.zshrc"
[ ! -f "$SHELL_RC" ] && SHELL_RC="$HOME/.bashrc"
[ ! -f "$SHELL_RC" ] && SHELL_RC="$HOME/.bash_profile"

if [ -f "$SHELL_RC" ]; then
  # 기존 Gridge 설정 제거
  sed -i.bak '/# Gridge AI/d; /ANTHROPIC_BASE_URL.*localhost/d; /GRIDGE_/d' "$SHELL_RC" 2>/dev/null || true

  cat >> "$SHELL_RC" << ENVRC

# Gridge AI Logger
export ANTHROPIC_BASE_URL=http://localhost:$LOCAL_PORT/v1
export GRIDGE_SERVER=$GRIDGE_SERVER
export GRIDGE_API_KEY=$GRIDGE_API_KEY
export GRIDGE_USER_ID=$GRIDGE_USER_ID
ENVRC
  echo "  ✓ $SHELL_RC 에 환경변수 추가"
else
  echo "  ⚠ 셸 설정 파일을 찾을 수 없습니다"
fi

export ANTHROPIC_BASE_URL=http://localhost:$LOCAL_PORT/v1

# ═══ 6. 프록시 시작 ═══
echo "[6/6] 프록시 시작 중..."
if command -v node &>/dev/null; then
  pkill -f "gridge.*proxy" 2>/dev/null || true
  sleep 1

  # 로컬 프록시 (Claude Code/Cursor용)
  nohup node "$GRIDGE_HOME/local-proxy/proxy.js" > "$GRIDGE_HOME/local-proxy.log" 2>&1 &
  echo "  ✓ 로컬 프록시 실행 (localhost:$LOCAL_PORT)"

  # 시스템 프록시 (Desktop 앱용) — CA 인증서가 있을 때만
  if [ -f "$GRIDGE_HOME/system-proxy/certs/gridge-ca.crt" ]; then
    nohup node "$GRIDGE_HOME/system-proxy/proxy.js" > "$GRIDGE_HOME/system-proxy.log" 2>&1 &
    echo "  ✓ 시스템 프록시 실행 (localhost:$SYSTEM_PORT)"
  else
    echo "  ⓘ 시스템 프록시: CA 인증서 설치 후 수동 시작 필요"
  fi
else
  echo "  ✗ Node.js가 없습니다. https://nodejs.org 에서 설치해주세요."
fi

# 정리
rm -rf /tmp/gridge_install

# ═══ 완료 ═══
echo ""
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║                   설치 완료!                         ║"
echo "  ╠══════════════════════════════════════════════════════╣"
echo "  ║                                                      ║"
echo "  ║  ① Chrome Extension (Claude/Gemini 웹):             ║"
echo "  ║     chrome://extensions → 개발자 모드                ║"
echo "  ║     → $GRIDGE_HOME/chrome-extension 로드"
echo "  ║                                                      ║"
echo "  ║  ② Claude Code: 자동 설정됨 (새 터미널에서 적용)    ║"
echo "  ║     ANTHROPIC_BASE_URL=http://localhost:$LOCAL_PORT/v1"
echo "  ║                                                      ║"
echo "  ║  ③ Cursor: Settings → API Base URL →                ║"
echo "  ║     http://localhost:$LOCAL_PORT/v1"
echo "  ║                                                      ║"
echo "  ║  ④ Claude/ChatGPT Desktop:                          ║"
echo "  ║     CA 인증서 설치 필요:                             ║"
echo "  ║     node $GRIDGE_HOME/system-proxy/install-cert.js"
echo "  ║     그 후 시스템 프록시 설정:                        ║"
echo "  ║     node $GRIDGE_HOME/system-proxy/set-system-proxy.js on"
echo "  ║                                                      ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo ""
