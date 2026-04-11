#!/usr/bin/env node
/**
 * 멤버별 자체 포함 설치 파일 생성기
 *
 * 사용법:
 *   node build-installer.js \
 *     --server https://gridge.company.com \
 *     --key ext_u001_xxx \
 *     --user u-001 \
 *     --company-keys "sk-ant-company-xxx,sk-proj-company-yyy"
 *
 * 출력:
 *   output/gridge-install-u-001.sh   (Mac/Linux 자체 포함 실행 파일)
 *   output/gridge-install-u-001.ps1  (Windows PowerShell 자체 포함 실행 파일)
 *
 * 생성된 파일은 git clone 불필요 — 모든 파일이 base64로 내장됨
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ── 인자 파싱 ──
const args = {};
process.argv.slice(2).forEach((arg, i, arr) => {
  if (arg.startsWith("--")) args[arg.slice(2)] = arr[i + 1] || "";
});

const SERVER = args.server || "__GRIDGE_SERVER__";
const API_KEY = args.key || "__GRIDGE_API_KEY__";
const USER_ID = args.user || "__GRIDGE_USER_ID__";
const COMPANY_KEYS = (args["company-keys"] || "").split(",").filter(Boolean);

console.log(`[빌드] 멤버: ${USER_ID}`);
console.log(`[빌드] 서버: ${SERVER}`);

// ── 번들 파일 수집 ──
const ROOT = path.join(__dirname, "..");
const FILES = [
  "chrome-extension/manifest.json",
  "chrome-extension/background.js",
  "chrome-extension/injected.js",
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

// tar.gz 생성
const tarList = FILES.map(f => {
  const full = path.join(ROOT, f);
  if (!fs.existsSync(full)) { console.warn(`  ⚠ 파일 없음: ${f}`); return null; }
  return f;
}).filter(Boolean);

const tarCmd = `tar czf /tmp/gridge-bundle.tar.gz -C "${ROOT}" ${tarList.join(" ")}`;
execSync(tarCmd);
const bundleB64 = fs.readFileSync("/tmp/gridge-bundle.tar.gz").toString("base64");

// config.json 내용
const extConfig = JSON.stringify({ serverUrl: SERVER, apiKey: API_KEY, userId: USER_ID, enabled: true });
const proxyConfig = JSON.stringify({ serverUrl: SERVER, apiKey: API_KEY, userId: USER_ID, port: 8080 });
const sysConfig = JSON.stringify({
  port: 9090, serverUrl: SERVER, apiKey: API_KEY, userId: USER_ID,
  interceptDomains: ["api.anthropic.com", "api.openai.com", "claude.ai", "chatgpt.com", "chat.openai.com"],
  captureMode: "company_only",
  companyApiKeys: COMPANY_KEYS,
  companySessionPatterns: [],
});

// ── 출력 디렉토리 ──
const outDir = path.join(__dirname, "output");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ═══════════════════════════════════════
// Mac/Linux 자체 포함 실행 파일
// ═══════════════════════════════════════
const shScript = `#!/bin/bash
# Gridge AI Logger 설치 — ${USER_ID}
# 이 파일은 모든 필요 파일을 내장하고 있습니다. git clone 불필요.
set -e

GRIDGE_HOME="$HOME/.gridge"
echo ""
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║     Gridge AI Logger 설치 (${USER_ID})"
echo "  ╚══════════════════════════════════════════════╝"
echo ""

# 1. 번들 추출
echo "[1/5] 파일 추출 중..."
mkdir -p "$GRIDGE_HOME"
base64 -d << 'BUNDLE_EOF' | tar xzf - -C "$GRIDGE_HOME"
${bundleB64}
BUNDLE_EOF
echo "  ✓ 파일 추출 완료"

# 2. 설정 파일 생성
echo "[2/5] 설정 주입 중..."
cat > "$GRIDGE_HOME/chrome-extension/config.json" << 'CFG1'
${extConfig}
CFG1
cat > "$GRIDGE_HOME/local-proxy/config.json" << 'CFG2'
${proxyConfig}
CFG2
cat > "$GRIDGE_HOME/system-proxy/config.json" << 'CFG3'
${sysConfig}
CFG3
echo "  ✓ 멤버 설정 주입 완료"

# 3. 환경변수
echo "[3/5] 환경변수 설정 중..."
SHELL_RC="$HOME/.zshrc"
[ ! -f "$SHELL_RC" ] && SHELL_RC="$HOME/.bashrc"
[ ! -f "$SHELL_RC" ] && SHELL_RC="$HOME/.bash_profile"
if [ -f "$SHELL_RC" ]; then
  sed -i.bak '/# Gridge AI/d; /ANTHROPIC_BASE_URL.*localhost/d; /GRIDGE_/d' "$SHELL_RC" 2>/dev/null || true
  cat >> "$SHELL_RC" << 'ENVRC'

# Gridge AI Logger
export ANTHROPIC_BASE_URL=http://localhost:8080/v1
ENVRC
  echo "  ✓ ANTHROPIC_BASE_URL 설정됨"
fi
export ANTHROPIC_BASE_URL=http://localhost:8080/v1

# 4. CA 인증서 (시스템 프록시용)
echo "[4/5] CA 인증서 생성 중..."
if command -v openssl &>/dev/null && command -v node &>/dev/null; then
  cd "$GRIDGE_HOME/system-proxy" && node gen-cert.js 2>/dev/null && echo "  ✓ CA 인증서 생성 완료" || echo "  ⓘ CA 인증서 생성 실패 (Desktop 앱 인터셉트 시 수동 필요)"
else
  echo "  ⓘ openssl/node 필요 — Desktop 앱 인터셉트 시 수동 설정"
fi

# 5. 프록시 시작
echo "[5/5] 프록시 시작 중..."
if command -v node &>/dev/null; then
  pkill -f "gridge.*proxy\\.js" 2>/dev/null || true
  sleep 1
  nohup node "$GRIDGE_HOME/local-proxy/proxy.js" > "$GRIDGE_HOME/local-proxy.log" 2>&1 &
  echo "  ✓ 로컬 프록시 실행 (localhost:8080)"
else
  echo "  ✗ Node.js 필요: https://nodejs.org"
fi

echo ""
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║                  설치 완료!                          ║"
echo "  ╠══════════════════════════════════════════════════════╣"
echo "  ║  ① Chrome Extension:                                ║"
echo "  ║     chrome://extensions → 개발자 모드                ║"
echo "  ║     → $GRIDGE_HOME/chrome-extension 로드"
echo "  ║                                                      ║"
echo "  ║  ② Claude Code: 새 터미널에서 자동 적용             ║"
echo "  ║  ③ Cursor: Settings → API Base URL →                ║"
echo "  ║     http://localhost:8080/v1                         ║"
echo "  ║  ④ Desktop 앱 (선택):                               ║"
echo "  ║     node ~/.gridge/system-proxy/install-cert.js      ║"
echo "  ║     node ~/.gridge/system-proxy/set-system-proxy.js on║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo ""
`;

const shPath = path.join(outDir, `gridge-install-${USER_ID}.sh`);
fs.writeFileSync(shPath, shScript);
fs.chmodSync(shPath, "755");
console.log(`[빌드] ✓ ${shPath}`);

// ═══════════════════════════════════════
// Windows PowerShell 자체 포함 실행 파일
// ═══════════════════════════════════════
const ps1Script = `# Gridge AI Logger 설치 — ${USER_ID}
# 실행: 이 파일 우클릭 → "PowerShell에서 실행"
$ErrorActionPreference = "Stop"
$GRIDGE_HOME = "$env:USERPROFILE\\.gridge"

Write-Host ""
Write-Host "  Gridge AI Logger 설치 (${USER_ID})" -ForegroundColor Cyan
Write-Host ""

# 1. 번들 추출
Write-Host "[1/5] 파일 추출 중..."
New-Item -ItemType Directory -Force -Path "$GRIDGE_HOME" | Out-Null
$bundleB64 = @"
${bundleB64}
"@
$bundleBytes = [Convert]::FromBase64String($bundleB64)
$tarPath = "$env:TEMP\\gridge-bundle.tar.gz"
[IO.File]::WriteAllBytes($tarPath, $bundleBytes)
tar xzf $tarPath -C "$GRIDGE_HOME" 2>$null
Remove-Item $tarPath -Force
Write-Host "  ✓ 파일 추출 완료"

# 2. 설정 파일
Write-Host "[2/5] 설정 주입 중..."
'${extConfig}' | Out-File -Encoding utf8 "$GRIDGE_HOME\\chrome-extension\\config.json"
'${proxyConfig}' | Out-File -Encoding utf8 "$GRIDGE_HOME\\local-proxy\\config.json"
@'
${sysConfig}
'@ | Out-File -Encoding utf8 "$GRIDGE_HOME\\system-proxy\\config.json"
Write-Host "  ✓ 멤버 설정 주입 완료"

# 3. 환경변수
Write-Host "[3/5] 환경변수 설정 중..."
[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "http://localhost:8080/v1", "User")
$env:ANTHROPIC_BASE_URL = "http://localhost:8080/v1"
Write-Host "  ✓ ANTHROPIC_BASE_URL 설정됨"

# 4. CA 인증서
Write-Host "[4/5] CA 인증서..."
if (Get-Command node -ErrorAction SilentlyContinue) {
  Push-Location "$GRIDGE_HOME\\system-proxy"
  try { node gen-cert.js 2>$null; Write-Host "  ✓ CA 인증서 생성 완료" }
  catch { Write-Host "  ⓘ CA 인증서 수동 생성 필요" }
  Pop-Location
}

# 5. 프록시 시작
Write-Host "[5/5] 프록시 시작 중..."
if (Get-Command node -ErrorAction SilentlyContinue) {
  Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*gridge*proxy*" } | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Process -WindowStyle Hidden -FilePath "node" -ArgumentList "$GRIDGE_HOME\\local-proxy\\proxy.js"
  Write-Host "  ✓ 로컬 프록시 실행 (localhost:8080)"
} else {
  Write-Host "  ✗ Node.js 필요: https://nodejs.org" -ForegroundColor Red
}

Write-Host ""
Write-Host "  설치 완료!" -ForegroundColor Green
Write-Host "  ① Chrome: chrome://extensions → 개발자 모드 → $GRIDGE_HOME\\chrome-extension 로드"
Write-Host "  ② Claude Code: 새 터미널에서 자동 적용"
Write-Host "  ③ Cursor: Settings → API Base URL → http://localhost:8080/v1"
Write-Host ""
Read-Host "Enter를 누르면 종료됩니다"
`;

const ps1Path = path.join(outDir, `gridge-install-${USER_ID}.ps1`);
fs.writeFileSync(ps1Path, ps1Script);
console.log(`[빌드] ✓ ${ps1Path}`);

// 정리
try { fs.unlinkSync("/tmp/gridge-bundle.tar.gz"); } catch {}

console.log("");
console.log(`[빌드] 완료! output/ 디렉토리에 설치 파일 생성됨`);
console.log(`  Mac/Linux: ${shPath}`);
console.log(`  Windows:   ${ps1Path}`);

