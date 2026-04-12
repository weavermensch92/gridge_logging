#!/usr/bin/env node
/**
 * Gridge AI Logger — Per-member installer generator
 *
 * Usage:
 *   node build-installer.js --server URL --key API_KEY --user USER_ID [--company-keys k1,k2]
 *
 * Output:
 *   output/Gridge-Setup-{userId}.bat     (Windows — double-click, polyglot BAT/PS1)
 *   output/Gridge-Setup-{userId}.command (macOS   — double-click, bash)
 *
 * Windows installer uses a polyglot format:
 *   BAT section: 5-line ASCII bootstrap that copies self to %TEMP% as .ps1 and runs it
 *   PS1 section: actual installer logic (UTF-8 safe, colored output, error handling)
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

// ── CLI Args ──
const args = {};
process.argv.slice(2).forEach((arg, i, arr) => {
  if (arg.startsWith("--")) args[arg.slice(2)] = arr[i + 1] || "";
});

const SERVER = args.server || "__GRIDGE_SERVER__";
const API_KEY = args.key || "__GRIDGE_API_KEY__";
const USER_ID = args.user || "__GRIDGE_USER_ID__";
const USER_EMAIL = args.email || "";
const COMPANY_KEYS = (args["company-keys"] || "").split(",").filter(Boolean);

console.log(`[build] User: ${USER_ID} <${USER_EMAIL}>, Server: ${SERVER}`);

// ── Bundle ──
const ROOT = path.join(__dirname, "..");
const FILES = [
  "chrome-extension/manifest.json",
  "chrome-extension/background.js",
  "chrome-extension/injected.js",
  "chrome-extension/config.json",
  "chrome-extension/crypto.js",
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
  "lib/crypto.js",
  "tray-app/gridge-tray.ps1",
  "tray-app/gridge-tray.vbs",
  "tray-app/gridge-tray-mac.py",
  "tray-app/log-viewer.html",
  "dist/gridge-proxy.exe",
];

const tarList = FILES.filter((f) => fs.existsSync(path.join(ROOT, f)));
const tmpTar = path.join(os.tmpdir(), "gridge-bundle.tar.gz");
// Quote each file path to handle special characters or spaces
const tarFiles = tarList.map(f => `"${f}"`).join(" ");
execSync(`tar -czf "${tmpTar}" -C "${ROOT}" ${tarFiles}`);
const bundleB64 = fs.readFileSync(tmpTar).toString("base64");

const extConfig = JSON.stringify({
  serverUrl: SERVER, apiKey: API_KEY, userId: USER_ID, userEmail: USER_EMAIL, enabled: true,
});
const proxyConfig = JSON.stringify({
  serverUrl: SERVER, apiKey: API_KEY, userId: USER_ID, userEmail: USER_EMAIL, port: 8080,
});
const sysConfig = JSON.stringify({
  port: 9090, serverUrl: SERVER, apiKey: API_KEY, userId: USER_ID, userEmail: USER_EMAIL,
  interceptDomains: ["api.anthropic.com", "api.openai.com", "claude.ai", "chatgpt.com", "chat.openai.com"],
  captureMode: "company_only", companyApiKeys: COMPANY_KEYS, companySessionPatterns: [],
});

const outDir = path.join(__dirname, "output");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ═══════════════════════════════════════════════════════════════
// Windows — Polyglot BAT/PS1 installer
//
// How it works:
//   1. Windows runs the .bat extension via cmd.exe
//   2. cmd.exe sees <# as a label (ignored), runs the @echo off section
//   3. BAT copies itself to %TEMP%\xxx.ps1 and runs it with PowerShell
//   4. PowerShell sees <# ... #> as a block comment (BAT section hidden)
//   5. PowerShell runs the installer logic below the comment
//
// This avoids ALL encoding issues because:
//   - BAT section is pure ASCII (no Korean, no box-drawing chars)
//   - All logic + display runs in PowerShell which handles UTF-8 natively
// ═══════════════════════════════════════════════════════════════

// Escape for PowerShell single-quoted strings: ' → ''
const psEsc = (s) => s.replace(/'/g, "''");

const winLines = [];
const w = (s = "") => winLines.push(s);

// ── BAT bootstrap (pure ASCII) ──
w("<# : batch bootstrap");
w("@echo off");
w('set "_F=%TEMP%\\gridge-setup-%RANDOM%.ps1"');
w('copy /y "%~f0" "%_F%" >nul 2>&1');
w('powershell -ExecutionPolicy Bypass -NoProfile -File "%_F%"');
w('del "%_F%" >nul 2>&1');
w("pause");
w("exit /b");
w(": end batch #>");
w();

// ── PowerShell installer ──
w('$ErrorActionPreference = "Continue"');
w('$ProgressPreference = "SilentlyContinue"');
w();
w('Write-Host ""');
w('Write-Host "  ========================================" -ForegroundColor Cyan');
w(`Write-Host "  Gridge AI Logger Setup (${USER_ID})" -ForegroundColor Cyan`);
w('Write-Host "  ========================================" -ForegroundColor Cyan');
w('Write-Host ""');
w();
w('$GRIDGE = Join-Path $env:USERPROFILE ".gridge"');
w('$EXT_DIR = Join-Path $GRIDGE "chrome-extension"');
w();

// Step 1: Cleanup & Extract
w("# -- [1/6] Cleanup & Extract --");
w('Write-Host "[1/6] Preparing for installation..." -ForegroundColor Yellow');
w("try {");
w('    # Kill existing processes');
w('    Write-Host "  Stopping existing processes..." -ForegroundColor DarkGray');
w('    Get-Process | Where-Object { $_.Name -match "node|gridge-proxy" } | Stop-Process -Force -ErrorAction SilentlyContinue');
w("    Get-WmiObject Win32_Process -Filter \"Name='powershell.exe'\" 2>$null |");
w('        Where-Object { $_.CommandLine -match "gridge-tray" } |');
w('        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }');
w('    Start-Sleep -Seconds 2');
w();
w('    Write-Host "  Cleaning up old files..." -ForegroundColor DarkGray');
w('    if (Test-Path $GRIDGE) {');
w('        $maxRetries = 3');
w('        for ($i = 1; $i -le $maxRetries; $i++) {');
w('            try {');
w('                Remove-Item -Path $GRIDGE -Recurse -Force -ErrorAction Stop');
w('                break');
w('            } catch {');
w('                if ($i -eq $maxRetries) {');
w('                    Write-Host "  Warning: Could not fully remove $GRIDGE. Moving it instead." -ForegroundColor Yellow');
w('                    $oldDir = $GRIDGE + "_old_" + (Get-Date -Format "HHmmss")');
w('                    Move-Item -Path $GRIDGE -Destination $oldDir -Force -ErrorAction SilentlyContinue');
w('                } else {');
w('                    Write-Host "  Retry cleanup ($i/$maxRetries)..." -ForegroundColor DarkGray');
w('                    Start-Sleep -Seconds 1');
w('                }');
w('            }');
w('        }');
w('    }');
w('    New-Item -ItemType Directory -Path $GRIDGE -Force | Out-Null');
w(`    $bytes = [Convert]::FromBase64String('${bundleB64}')`);
w('    $tarPath = Join-Path $env:TEMP "gridge-bundle.tar.gz"');
w('    Write-Host "  Extracting bundle..." -ForegroundColor Yellow');
w("    [IO.File]::WriteAllBytes($tarPath, $bytes)");
w();
w('    # Try tar extraction');
w('    & "tar.exe" -xzf "$tarPath" -C "$GRIDGE"');
w('    if ($LASTEXITCODE -ne 0) { ');
w('        Write-Host "  tar failed, checking for tar.exe..." -ForegroundColor DarkGray');
w('        if (-not (Get-Command "tar.exe" -ErrorAction SilentlyContinue)) {');
w('            throw "tar.exe not found in PATH. This installer requires Windows 10 (1803+) or Git for Windows."');
w('        }');
w('        throw "tar extraction failed (exit code $LASTEXITCODE). Check if any files in $GRIDGE are open." ');
w('    }');
w("    Remove-Item $tarPath -Force -ErrorAction SilentlyContinue");
w('    Write-Host "  OK ($GRIDGE)" -ForegroundColor Green');
w("} catch {");
w('    Write-Host "  FAIL: $_" -ForegroundColor Red');
w('    Read-Host "  Press Enter to exit"');
w("    exit 1");
w("}");
w();

// Step 2: Config
w("# -- [2/6] Write config --");
w('Write-Host "[2/6] Writing config..." -ForegroundColor Yellow');
w("try {");
w(`    [IO.File]::WriteAllText((Join-Path $EXT_DIR "config.json"), '${psEsc(extConfig)}')`);
w(`    [IO.File]::WriteAllText((Join-Path $GRIDGE "local-proxy/config.json"), '${psEsc(proxyConfig)}')`);
w(`    [IO.File]::WriteAllText((Join-Path $GRIDGE "system-proxy/config.json"), '${psEsc(sysConfig)}')`);
w('    Write-Host "  OK" -ForegroundColor Green');
w("} catch {");
w('    Write-Host "  FAIL: $_" -ForegroundColor Red');
w("}");
w();

// Step 3: Chrome Extension policy
w("# -- [3/6] Chrome Extension policy --");
w('Write-Host "[3/6] Chrome Extension policy..." -ForegroundColor Yellow');
w("try {");
w('    $regPath = "HKCU:\\Software\\Policies\\Google\\Chrome\\ExtensionInstallAllowedTypes"');
w("    New-Item -Path $regPath -Force -ErrorAction SilentlyContinue | Out-Null");
w('    Set-ItemProperty -Path $regPath -Name "1" -Value "extension" -Force');
w('    Write-Host "  OK" -ForegroundColor Green');
w("} catch {");
w('    Write-Host "  SKIP: $_" -ForegroundColor DarkYellow');
w("}");
w();

// Step 4: Startup registration
w("# -- [4/6] Startup registration --");
w('Write-Host "[4/6] Startup registration..." -ForegroundColor Yellow');
w('$trayVbs = Join-Path $GRIDGE "tray-app/gridge-tray.vbs"');
w("if (Test-Path $trayVbs) {");
w('    $startCmd = \'wscript.exe "{0}"\' -f $trayVbs');
w('    Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "GridgeProxy" -Value $startCmd -Force');
w('    Write-Host "  OK (tray app registered)" -ForegroundColor Green');
w("} else {");
w("    $nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source");
w("    if ($nodePath) {");
w('        $proxyJs = Join-Path $GRIDGE "local-proxy/proxy.js"');
w("        $startCmd = '\"{0}\" \"{1}\"' -f $nodePath, $proxyJs");
w('        Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "GridgeProxy" -Value $startCmd -Force');
w('        Write-Host "  OK (proxy only)" -ForegroundColor Green');
w("    } else {");
w('        Write-Host "  SKIP - install Node.js first" -ForegroundColor Red');
w("    }");
w("}");
w();

// Step 5: Environment variables
w("# -- [5/6] Environment variables --");
w('Write-Host "[5/6] Environment variables..." -ForegroundColor Yellow');
w('[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "http://localhost:8080/v1", "User")');
w('$env:ANTHROPIC_BASE_URL = "http://localhost:8080/v1"');
w('Write-Host "  OK (ANTHROPIC_BASE_URL=http://localhost:8080/v1)" -ForegroundColor Green');
w();

// Step 6: Start tray app (which manages the proxy)
w("# -- [6/6] Start tray app --");
w('Write-Host "[6/6] Starting Gridge tray app..." -ForegroundColor Yellow');
w('$trayVbs = Join-Path $GRIDGE "tray-app/gridge-tray.vbs"');
w("if (Test-Path $trayVbs) {");
w('    Start-Process -FilePath "wscript.exe" -ArgumentList $trayVbs');
w('    Write-Host "  OK - tray app started (system tray icon)" -ForegroundColor Green');
w("} else {");
w('    $exePath = Join-Path $GRIDGE "dist/gridge-proxy.exe"');
w('    if (-not (Test-Path $exePath)) { $exePath = Join-Path $GRIDGE "gridge-proxy.exe" }');
w("    if (Test-Path $exePath) {");
w('        Start-Process -FilePath $exePath -WindowStyle Hidden');
w('        Write-Host "  OK - proxy started (standalone EXE)" -ForegroundColor Green');
w("    } else {");
w("        $nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source");
w("        if ($nodePath) {");
w('            $proxyJs = Join-Path $GRIDGE "local-proxy/proxy.js"');
w("            Start-Process -FilePath $nodePath -ArgumentList $proxyJs -WindowStyle Minimized");
w('            Write-Host "  OK - proxy started (fallback, node)" -ForegroundColor Green');
w("        }");
w("    }");
w("}");
w();

// Chrome launch
w("# Chrome launch");
w("$chromeExe = $null");
w("$pf = $env:ProgramFiles");
w('$pf86 = [Environment]::GetEnvironmentVariable("ProgramFiles(x86)")');
w('$candidates = @()');
w('if ($pf)   { $candidates += Join-Path $pf "Google\\Chrome\\Application\\chrome.exe" }');
w('if ($pf86) { $candidates += Join-Path $pf86 "Google\\Chrome\\Application\\chrome.exe" }');
w('$chromeExe = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1');
w("if ($chromeExe) {");
w('    $loadArg = \'--load-extension="{0}"\' -f $EXT_DIR');
w("    Start-Process -FilePath $chromeExe -ArgumentList $loadArg");
w('    Write-Host "  OK - Chrome launched with extension" -ForegroundColor Green');
w("} else {");
w('    Write-Host "  Chrome not found. Load extension manually:" -ForegroundColor DarkYellow');
w('    Write-Host "    chrome://extensions > Developer mode > Load unpacked > $EXT_DIR" -ForegroundColor DarkGray');
w("}");
w();

// Summary
w('Write-Host ""');
w('Write-Host "  ========================================" -ForegroundColor Cyan');
w('Write-Host "  Installation Complete!" -ForegroundColor Green');
w('Write-Host "  ========================================" -ForegroundColor Cyan');
w('Write-Host ""');
w('Write-Host "  Extension:   Loaded in Chrome" -ForegroundColor White');
w('Write-Host "  Claude Code: Open new terminal (auto-applied)" -ForegroundColor White');
w('Write-Host "  Cursor:      Settings > API Base URL > http://localhost:8080/v1" -ForegroundColor White');
w('Write-Host "  Proxy:       Startup registered (auto-start on boot)" -ForegroundColor White');
w('Write-Host ""');

const winScript = winLines.join("\r\n");
const winPath = path.join(outDir, `Gridge-Setup-${USER_ID}.bat`);
fs.writeFileSync(winPath, winScript, "utf8");
console.log(`[build] Windows: ${winPath}`);

// ═══════════════════════════════════════════════════════
// macOS .command (bash — double-click in Finder)
// ═══════════════════════════════════════════════════════
const macScript = `#!/bin/bash
# Gridge AI Logger Setup — ${USER_ID}
set -e
GRIDGE_HOME="$HOME/.gridge"
EXT_DIR="$GRIDGE_HOME/chrome-extension"

clear
echo ""
echo "  Gridge AI Logger Setup (${USER_ID})"
echo ""

# 1. Cleanup & Extract
echo "[1/6] Preparing for installation..."
pkill -f "gridge.*tray" 2>/dev/null || true
pkill -f "gridge.*proxy\\.js" 2>/dev/null || true
sleep 1

echo "  Extracting files..."
rm -rf "$GRIDGE_HOME"
mkdir -p "$GRIDGE_HOME"
base64 -d << 'BUNDLE_EOF' | tar xzf - -C "$GRIDGE_HOME"
${bundleB64}
BUNDLE_EOF
echo "  OK"

# 2. Config
echo "[2/6] Writing config..."
cat > "$EXT_DIR/config.json" << 'C1'
${extConfig}
C1
cat > "$GRIDGE_HOME/local-proxy/config.json" << 'C2'
${proxyConfig}
C2
cat > "$GRIDGE_HOME/system-proxy/config.json" << 'C3'
${sysConfig}
C3
echo "  OK"

# 3. Chrome Extension
echo "[3/6] Chrome Extension..."
echo "  Extension path: $EXT_DIR"

# 4. LaunchAgent
echo "[4/6] Startup registration..."
AGENT_DIR="$HOME/Library/LaunchAgents"
mkdir -p "$AGENT_DIR"
NODE_PATH=$(which node 2>/dev/null || echo "/usr/local/bin/node")
cat > "$AGENT_DIR/com.gridge.local-proxy.plist" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.gridge.local-proxy</string>
  <key>ProgramArguments</key><array>
    <string>$NODE_PATH</string>
    <string>$GRIDGE_HOME/local-proxy/proxy.js</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$GRIDGE_HOME/local-proxy.log</string>
  <key>StandardErrorPath</key><string>$GRIDGE_HOME/local-proxy.err</string>
</dict>
</plist>
PLIST
launchctl unload "$AGENT_DIR/com.gridge.local-proxy.plist" 2>/dev/null || true
launchctl load "$AGENT_DIR/com.gridge.local-proxy.plist" 2>/dev/null || true
echo "  OK"

# 5. Environment
echo "[5/6] Environment variables..."
SHELL_RC="$HOME/.zshrc"
[ ! -f "$SHELL_RC" ] && SHELL_RC="$HOME/.bashrc"
if [ -f "$SHELL_RC" ]; then
  grep -q "ANTHROPIC_BASE_URL" "$SHELL_RC" || cat >> "$SHELL_RC" << 'ENV'

# Gridge AI Logger
export ANTHROPIC_BASE_URL=http://localhost:8080/v1
ENV
fi
export ANTHROPIC_BASE_URL=http://localhost:8080/v1
echo "  OK"

# 6. Start tray app + Chrome
echo "[6/6] Starting Gridge tray app..."

# Try running Mac Tray App (Python) if available
PYTHON_BIN=$(which python3 2>/dev/null || which python 2>/dev/null)
if [ -n "$PYTHON_BIN" ] && [ -f "$GRIDGE_HOME/tray-app/gridge-tray-mac.py" ]; then
  # Try to install dependencies (best effort)
  "$PYTHON_BIN" -m pip install pystray Pillow --quiet 2>/dev/null || true
  nohup "$PYTHON_BIN" "$GRIDGE_HOME/tray-app/gridge-tray-mac.py" > "$GRIDGE_HOME/tray-app.log" 2>&1 &
  echo "  OK - Tray app started (menu bar icon)"
else
  nohup "$NODE_PATH" "$GRIDGE_HOME/local-proxy/proxy.js" > "$GRIDGE_HOME/local-proxy.log" 2>&1 &
  echo "  OK - Dashboard only (tray icon requires Python)"
fi

CHROME_APP="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ -f "$CHROME_APP" ]; then
  "$CHROME_APP" --load-extension="$EXT_DIR" &>/dev/null &
  echo "  OK - Chrome launched with extension"
else
  echo "  Chrome not found. Load extension manually."
fi

echo ""
echo "  ========================================"
echo "  Installation Complete!"
echo "  ========================================"
echo ""
echo "  Extension:   Loaded in Chrome"
echo "  Claude Code: Open new terminal (auto-applied)"
echo "  Cursor:      Settings > API Base URL > http://localhost:8080/v1"
echo "  Proxy:       Startup registered (auto-start on boot)"
echo ""
read -p "  Press Enter to close..."
`;

const macPath = path.join(outDir, `Gridge-Setup-${USER_ID}.command`);
fs.writeFileSync(macPath, macScript);
try { fs.chmodSync(macPath, "755"); } catch {}
console.log(`[build] macOS:   ${macPath}`);

// ── Cleanup ──
try { fs.unlinkSync(tmpTar); } catch {}

console.log("");
console.log("[build] Done!");
console.log(`  Windows: ${winPath} (double-click to run)`);
console.log(`  macOS:   ${macPath} (double-click to run)`);
