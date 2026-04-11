#!/usr/bin/env node
/**
 * 멤버별 네이티브 설치 파일 생성기
 *
 * 출력:
 *   output/Gridge-Setup-{userId}.bat     (Windows — 더블클릭 실행)
 *   output/Gridge-Setup-{userId}.command (macOS — 더블클릭 실행)
 *
 * 설치 시:
 *   1. 파일 추출 → ~/.gridge/
 *   2. Chrome Extension 자동 등록 (Chrome 정책)
 *   3. 프록시 시작프로그램 등록
 *   4. 프록시 즉시 실행
 *   5. Chrome 자동 실행 (Extension 로드 상태)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const args = {};
process.argv.slice(2).forEach((arg, i, arr) => {
  if (arg.startsWith("--")) args[arg.slice(2)] = arr[i + 1] || "";
});

const SERVER = args.server || "__GRIDGE_SERVER__";
const API_KEY = args.key || "__GRIDGE_API_KEY__";
const USER_ID = args.user || "__GRIDGE_USER_ID__";
const COMPANY_KEYS = (args["company-keys"] || "").split(",").filter(Boolean);

console.log(`[빌드] 멤버: ${USER_ID}, 서버: ${SERVER}`);

// ── 번들 생성 ──
const ROOT = path.join(__dirname, "..");
const FILES = [
  "chrome-extension/manifest.json",
  "chrome-extension/background.js",
  "chrome-extension/injected.js",
  "chrome-extension/config.json",
  "chrome-extension/content-scripts/claude-capture.js",
  "chrome-extension/content-scripts/gemini-capture.js",
  "chrome-extension/popup/popup.html",
  "chrome-extension/popup/popup.js",
  "local-proxy/proxy.js",
  "local-proxy/package.json",
  "system-proxy/proxy.js",
  "system-proxy/gen-cert.js",
  "system-proxy/install-cert.js",
  "system-proxy/set-system-proxy.js",
  "system-proxy/package.json",
];

const tarList = FILES.filter(f => fs.existsSync(path.join(ROOT, f)));
execSync(`tar czf /tmp/gridge-bundle.tar.gz -C "${ROOT}" ${tarList.join(" ")}`);
const bundleB64 = fs.readFileSync("/tmp/gridge-bundle.tar.gz").toString("base64");

const extConfig = JSON.stringify({ serverUrl: SERVER, apiKey: API_KEY, userId: USER_ID, enabled: true });
const proxyConfig = JSON.stringify({ serverUrl: SERVER, apiKey: API_KEY, userId: USER_ID, port: 8080 });
const sysConfig = JSON.stringify({
  port: 9090, serverUrl: SERVER, apiKey: API_KEY, userId: USER_ID,
  interceptDomains: ["api.anthropic.com","api.openai.com","claude.ai","chatgpt.com","chat.openai.com"],
  captureMode: "company_only", companyApiKeys: COMPANY_KEYS, companySessionPatterns: [],
});

const outDir = path.join(__dirname, "output");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ═══════════════════════════════════════════════════════
// macOS .command (더블클릭 실행, Finder에서 바로 실행됨)
// ═══════════════════════════════════════════════════════
const macScript = `#!/bin/bash
# Gridge AI Logger 설치 — ${USER_ID}
# 이 파일을 더블클릭하면 자동 설치됩니다.
set -e
GRIDGE_HOME="$HOME/.gridge"
EXT_DIR="$GRIDGE_HOME/chrome-extension"

clear
echo ""
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║  Gridge AI Logger 설치 중... (${USER_ID})"
echo "  ╚══════════════════════════════════════════════╝"
echo ""

# 1. 파일 추출
echo "[1/6] 파일 추출..."
mkdir -p "$GRIDGE_HOME"
base64 -d << 'BUNDLE_EOF' | tar xzf - -C "$GRIDGE_HOME"
${bundleB64}
BUNDLE_EOF
echo "  ✓ 완료"

# 2. 설정 주입
echo "[2/6] 설정 주입..."
cat > "$EXT_DIR/config.json" << 'C1'
${extConfig}
C1
cat > "$GRIDGE_HOME/local-proxy/config.json" << 'C2'
${proxyConfig}
C2
cat > "$GRIDGE_HOME/system-proxy/config.json" << 'C3'
${sysConfig}
C3
echo "  ✓ 완료"

# 3. Chrome Extension 자동 등록 (Chrome 정책)
echo "[3/6] Chrome Extension 등록..."
# Chrome이 로컬 Extension을 자동 로드하도록 정책 설정
CHROME_POLICY_DIR="$HOME/Library/Application Support/Google/Chrome/External Extensions"
mkdir -p "$CHROME_POLICY_DIR"

# Chrome --load-extension 플래그로 자동 실행하기 위한 설정
CHROME_PREFS="$HOME/Library/Application Support/Google/Chrome/Default/Preferences"
echo "  ✓ Extension 경로: $EXT_DIR"

# 4. 시작프로그램 등록 (LaunchAgent)
echo "[4/6] 시작프로그램 등록..."
AGENT_DIR="$HOME/Library/LaunchAgents"
mkdir -p "$AGENT_DIR"

# 로컬 프록시 LaunchAgent
cat > "$AGENT_DIR/com.gridge.local-proxy.plist" << 'PLIST1'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.gridge.local-proxy</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>${"${HOME}"}/.gridge/local-proxy/proxy.js</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${"${HOME}"}/.gridge/local-proxy.log</string>
  <key>StandardErrorPath</key>
  <string>${"${HOME}"}/.gridge/local-proxy.err</string>
</dict>
</plist>
PLIST1

# node 경로 수정 (실제 경로로)
NODE_PATH=$(which node 2>/dev/null || echo "/usr/local/bin/node")
sed -i '' "s|/usr/local/bin/node|$NODE_PATH|g" "$AGENT_DIR/com.gridge.local-proxy.plist" 2>/dev/null || true
# HOME 치환
sed -i '' "s|\\${"\\"}\${HOME}|$HOME|g" "$AGENT_DIR/com.gridge.local-proxy.plist" 2>/dev/null || true

# LaunchAgent 로드
launchctl unload "$AGENT_DIR/com.gridge.local-proxy.plist" 2>/dev/null || true
launchctl load "$AGENT_DIR/com.gridge.local-proxy.plist" 2>/dev/null || true
echo "  ✓ com.gridge.local-proxy 등록됨 (재시작 시 자동 실행)"

# 5. 환경변수
echo "[5/6] 환경변수 설정..."
SHELL_RC="$HOME/.zshrc"
[ ! -f "$SHELL_RC" ] && SHELL_RC="$HOME/.bashrc"
if [ -f "$SHELL_RC" ]; then
  grep -q "ANTHROPIC_BASE_URL" "$SHELL_RC" || cat >> "$SHELL_RC" << 'ENV'

# Gridge AI Logger
export ANTHROPIC_BASE_URL=http://localhost:8080/v1
ENV
fi
export ANTHROPIC_BASE_URL=http://localhost:8080/v1
echo "  ✓ 완료"

# 6. Chrome 실행 (Extension 자동 로드)
echo "[6/6] Chrome 실행..."
pkill -f "gridge.*proxy\\.js" 2>/dev/null || true
sleep 1

# 프록시가 LaunchAgent로 자동 시작되지만, 즉시 시작도 함
nohup "$NODE_PATH" "$GRIDGE_HOME/local-proxy/proxy.js" > "$GRIDGE_HOME/local-proxy.log" 2>&1 &

# Chrome을 Extension 로드 상태로 실행
CHROME_APP="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ -f "$CHROME_APP" ]; then
  "$CHROME_APP" --load-extension="$EXT_DIR" &>/dev/null &
  echo "  ✓ Chrome 실행됨 (Extension 자동 로드)"
else
  echo "  ⓘ Chrome 경로를 찾을 수 없습니다. 수동으로 Extension을 로드해주세요."
fi

echo ""
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║            설치 완료!                        ║"
echo "  ╠══════════════════════════════════════════════╣"
echo "  ║  Extension: Chrome에 자동 로드됨             ║"
echo "  ║  Claude Code: 새 터미널에서 자동 적용        ║"
echo "  ║  Cursor: Settings → API Base URL →          ║"
echo "  ║    http://localhost:8080/v1                  ║"
echo "  ║  프록시: 시작프로그램으로 등록됨 (자동 실행) ║"
echo "  ╚══════════════════════════════════════════════╝"
echo ""
echo "  이 창을 닫아도 됩니다."
read -p "  Enter를 누르면 종료..."
`;

const macPath = path.join(outDir, `Gridge-Setup-${USER_ID}.command`);
fs.writeFileSync(macPath, macScript);
fs.chmodSync(macPath, "755");
console.log(`[빌드] ✓ macOS: ${macPath}`);

// ═══════════════════════════════════════════════════════
// Windows .bat (더블클릭 실행, 관리자 권한 자동 요청)
// ═══════════════════════════════════════════════════════
const winScript = `@echo off
chcp 65001 >nul
title Gridge AI Logger 설치

echo.
echo   Gridge AI Logger 설치 중... (${USER_ID})
echo.

set GRIDGE_HOME=%USERPROFILE%\\.gridge
set EXT_DIR=%GRIDGE_HOME%\\chrome-extension

REM 1. 파일 추출 (PowerShell 사용)
echo [1/6] 파일 추출...
mkdir "%GRIDGE_HOME%" 2>nul
powershell -Command "$b=[Convert]::FromBase64String((Get-Content '%~f0' | Select-String 'BASE64_START' -Context 0,99999).Context.PostContext -join ''); [IO.File]::WriteAllBytes('%TEMP%\\gridge.tar.gz',$b)" 2>nul
if exist "%TEMP%\\gridge.tar.gz" (
  tar xzf "%TEMP%\\gridge.tar.gz" -C "%GRIDGE_HOME%" 2>nul
  del "%TEMP%\\gridge.tar.gz"
  echo   ✓ 완료
) else (
  echo   PowerShell 추출 실패. 수동 설치가 필요합니다.
  pause
  exit /b 1
)

REM 2. 설정 주입
echo [2/6] 설정 주입...
(echo ${extConfig})> "%EXT_DIR%\\config.json"
(echo ${proxyConfig})> "%GRIDGE_HOME%\\local-proxy\\config.json"
(echo ${sysConfig.replace(/"/g, '\\"')})> "%GRIDGE_HOME%\\system-proxy\\config.json"
echo   ✓ 완료

REM 3. Chrome Extension 등록 (레지스트리 정책)
echo [3/6] Chrome Extension 등록...
REM Chrome ExtensionSettings 정책으로 로컬 Extension 허용
reg add "HKCU\\Software\\Policies\\Google\\Chrome\\ExtensionInstallAllowedTypes" /v "1" /t REG_SZ /d "extension" /f >nul 2>&1
echo   ✓ Chrome 정책 등록

REM 4. 시작프로그램 등록
echo [4/6] 시작프로그램 등록...
reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "GridgeProxy" /t REG_SZ /d "node \\"%GRIDGE_HOME%\\local-proxy\\proxy.js\\"" /f >nul 2>&1
echo   ✓ 시작프로그램에 등록됨

REM 5. 환경변수
echo [5/6] 환경변수 설정...
setx ANTHROPIC_BASE_URL "http://localhost:8080/v1" >nul 2>&1
set ANTHROPIC_BASE_URL=http://localhost:8080/v1
echo   ✓ ANTHROPIC_BASE_URL 설정됨

REM 6. 프록시 시작 + Chrome 실행
echo [6/6] 프록시 시작 + Chrome 실행...
where node >nul 2>&1
if %errorlevel%==0 (
  taskkill /f /fi "WINDOWTITLE eq Gridge*" >nul 2>&1
  start "Gridge Proxy" /min node "%GRIDGE_HOME%\\local-proxy\\proxy.js"
  echo   ✓ 프록시 실행 중
) else (
  echo   ✗ Node.js 필요: https://nodejs.org
)

REM Chrome을 Extension 로드 상태로 실행
if exist "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" (
  start "" "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --load-extension="%EXT_DIR%"
  echo   ✓ Chrome 실행됨 (Extension 자동 로드)
) else if exist "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" (
  start "" "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" --load-extension="%EXT_DIR%"
  echo   ✓ Chrome 실행됨
) else (
  echo   ⓘ Chrome을 찾을 수 없습니다. 수동으로 Extension을 로드해주세요.
)

echo.
echo   ╔══════════════════════════════════════════════╗
echo   ║            설치 완료!                        ║
echo   ╠══════════════════════════════════════════════╣
echo   ║  Extension: Chrome에 자동 로드됨             ║
echo   ║  Claude Code: 새 터미널에서 자동 적용        ║
echo   ║  Cursor: Settings → API Base URL →          ║
echo   ║    http://localhost:8080/v1                  ║
echo   ║  프록시: 시작프로그램으로 등록됨             ║
echo   ╚══════════════════════════════════════════════╝
echo.
pause
exit /b 0

REM ═══ 내장 번들 (이 아래는 수정 금지) ═══
:BASE64_START
${bundleB64}
`;

const winPath = path.join(outDir, `Gridge-Setup-${USER_ID}.bat`);
fs.writeFileSync(winPath, winScript);
console.log(`[빌드] ✓ Windows: ${winPath}`);

try { fs.unlinkSync("/tmp/gridge-bundle.tar.gz"); } catch {}

console.log("");
console.log("[빌드] 완료!");
console.log(`  macOS:   ${macPath} (더블클릭 실행)`);
console.log(`  Windows: ${winPath} (더블클릭 실행)`);
