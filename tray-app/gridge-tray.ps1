# Gridge AI Logger — System Tray Application
# Manages proxy lifecycle, shows tray icon, provides log viewer access.

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[System.Windows.Forms.Application]::EnableVisualStyles()
[System.Windows.Forms.Application]::SetCompatibleTextRenderingDefault($false)

$GRIDGE      = Join-Path $env:USERPROFILE ".gridge"
$PROXY_EXE    = Join-Path $GRIDGE "dist/gridge-proxy.exe"
$PROXY_FALLBACKP = Join-Path $GRIDGE "gridge-proxy.exe"
$PROXY_JS    = Join-Path $GRIDGE "local-proxy/proxy.js"
$CONFIG_FILE = Join-Path $GRIDGE "local-proxy/config.json"
$LOGS_DIR    = Join-Path $GRIDGE "logs"
$LOGS_FILE   = Join-Path $LOGS_DIR "captures.jsonl"
$LOG_PORT    = 8081
$ERROR_LOG   = Join-Path $GRIDGE "tray-error.log"

# Path to HTML viewer - try current script dir then fallback to $GRIDGE
$LOCAL_HTML = Join-Path $PSScriptRoot "log-viewer.html"
$GRIDGE_HTML = Join-Path $GRIDGE "tray-app/log-viewer.html"
$HTML_PATH = if (Test-Path $LOCAL_HTML) { $LOCAL_HTML } else { $GRIDGE_HTML }

function Write-TrayLog($msg) {
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg" | Out-File $ERROR_LOG -Append
}

# ── Create Icon: green circle with white "G" ──
function New-TrayIcon([string]$status) {
    try {
        $bmp = New-Object System.Drawing.Bitmap(32, 32)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.SmoothingMode = 'AntiAlias'
        $g.TextRenderingHint = 'AntiAliasGridFit'
        $g.Clear([System.Drawing.Color]::Transparent)

        $color = if ($status -eq "running") { [System.Drawing.Color]::FromArgb(76, 175, 80) }
                 elseif ($status -eq "error") { [System.Drawing.Color]::FromArgb(244, 67, 54) }
                 else { [System.Drawing.Color]::FromArgb(158, 158, 158) }

        $brush = New-Object System.Drawing.SolidBrush($color)
        $g.FillEllipse($brush, 1, 1, 30, 30)
        $brush.Dispose()

        $font = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Bold)
        $sf   = New-Object System.Drawing.StringFormat
        $sf.Alignment = 'Center'
        $sf.LineAlignment = 'Center'
        $rect = New-Object System.Drawing.RectangleF(0, -1, 32, 32)
        $g.DrawString("G", $font, [System.Drawing.Brushes]::White, $rect, $sf)
        
        $font.Dispose()
        $sf.Dispose()
        $g.Dispose()

        $hIcon = $bmp.GetHicon()
        $icon = [System.Drawing.Icon]::FromHandle($hIcon)
        $bmp.Dispose()
        return $icon
    } catch {
        return [System.Drawing.SystemIcons]::Application
    }
}

# ── Log Viewer HTTP Server (Stable Polling) ──
$script:httpListener = $null
$script:asyncResult = $null

function Start-LogServer {
    $script:httpListener = New-Object System.Net.HttpListener
    $script:httpListener.Prefixes.Add("http://localhost:$LOG_PORT/")
    try {
        $script:httpListener.Start()
    } catch {
        Write-TrayLog "Log server failed to start: $_"
        return
    }

    $httpTimer = New-Object System.Windows.Forms.Timer
    $httpTimer.Interval = 200
    $httpTimer.Add_Tick({
        if ($script:httpListener -and $script:httpListener.IsListening) {
            try {
                if ($null -eq $script:asyncResult) {
                    $script:asyncResult = $script:httpListener.BeginGetContext($null, $null)
                }
                if ($script:asyncResult.IsCompleted) {
                    $ctx = $script:httpListener.EndGetContext($script:asyncResult)
                    $script:asyncResult = $null
                    Handle-Request $ctx
                }
            } catch { 
                $script:asyncResult = $null 
            }
        }
    })
    $httpTimer.Start()
}

function Handle-Request($ctx) {
    if ($null -eq $ctx) { return }
    $req = $ctx.Request
    $resp = $ctx.Response
    try {
        $resp.Headers.Add("Access-Control-Allow-Origin", "*")
        if ($req.Url.AbsolutePath -eq "/api/logs") {
            $resp.ContentType = "application/json; charset=utf-8"
            $json = "[]"
            if (Test-Path $LOGS_FILE) {
                try {
                    $lines = [System.IO.File]::ReadLines($LOGS_FILE) | Select-Object -Last 200
                    $json = "[" + (($lines | Where-Object { $_ }) -join ",") + "]"
                } catch { }
            }
            $buf = [Text.Encoding]::UTF8.GetBytes($json)
            $resp.OutputStream.Write($buf, 0, $buf.Length)
        } elseif ($req.Url.AbsolutePath -eq "/api/status") {
            $resp.ContentType = "application/json; charset=utf-8"
            $alive = ($script:proxyProc -and -not $script:proxyProc.HasExited)
            $json = '{"proxy":' + $(if ($alive) { '"running"' } else { '"stopped"' }) + ',"port":8080}'
            $buf = [Text.Encoding]::UTF8.GetBytes($json)
            $resp.OutputStream.Write($buf, 0, $buf.Length)
        } else {
            $resp.ContentType = "text/html; charset=utf-8"
            $html = if (Test-Path $HTML_PATH) { [System.IO.File]::ReadAllText($HTML_PATH) } else { "<h1>View Not Found</h1>" }
            $buf = [Text.Encoding]::UTF8.GetBytes($html)
            $resp.OutputStream.Write($buf, 0, $buf.Length)
        }
    } catch { } finally {
        try { $resp.Close() } catch { }
    }
}

# ── Proxy Management ──
$script:proxyProc = $null
function Start-Proxy {
    try {
        $exePath = if (Test-Path $PROXY_EXE) { $PROXY_EXE } elseif (Test-Path $PROXY_FALLBACKP) { $PROXY_FALLBACKP } else { $null }
        if ($exePath) {
            if ($script:proxyProc -and -not $script:proxyProc.HasExited) { return }
            $script:proxyProc = Start-Process -FilePath $exePath -WindowStyle Hidden -PassThru
        } else {
            $nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
            if ($nodePath) {
                $script:proxyProc = Start-Process -FilePath $nodePath -ArgumentList (Join-Path $GRIDGE "local-proxy/proxy.js") -WindowStyle Hidden -PassThru
            }
        }
        Update-Icon "running"
    } catch {
        Write-TrayLog "Proxy failed to start: $_"
    }
}

function Stop-Proxy {
    if ($script:proxyProc -and -not $script:proxyProc.HasExited) {
        try { $script:proxyProc.Kill() } catch { }
        $script:proxyProc = $null
    }
    Update-Icon "stopped"
}

function Update-Icon([string]$status) {
    if ($script:notifyIcon) {
        $script:notifyIcon.Icon = New-TrayIcon $status
        $script:notifyIcon.Text = "Gridge AI Logger - $status"
    }
}

# ── Build UI ──
try {
    Write-TrayLog "Building UI..."
    $script:notifyIcon = New-Object System.Windows.Forms.NotifyIcon
    $script:notifyIcon.Icon = New-TrayIcon "running"
    $script:notifyIcon.Text = "Gridge AI Logger"
    $script:notifyIcon.Visible = $true

    $menu = New-Object System.Windows.Forms.ContextMenuStrip
    $menu.Items.Add("Gridge AI Logger").Enabled = $false
    $menu.Items.Add("-") | Out-Null
    
    $configItem = $menu.Items.Add("Config")
    $menu.Items.Add("Log Viewer").Add_Click({ Start-Process "http://localhost:8081" })
    $menu.Items.Add("-") | Out-Null
    $menu.Items.Add("Restart Proxy").Add_Click({ Stop-Proxy; Start-Sleep -Seconds 1; Start-Proxy })
    $menu.Items.Add("-") | Out-Null
    $menu.Items.Add("Exit").Add_Click({ Stop-Proxy; $script:notifyIcon.Visible=$false; [System.Windows.Forms.Application]::Exit() })

    $script:notifyIcon.ContextMenuStrip = $menu
    $script:notifyIcon.Add_MouseClick({
        param($s, $e)
        if ($e.Button -eq [System.Windows.Forms.MouseButtons]::Right) { $menu.Show([System.Windows.Forms.Cursor]::Position) }
    })
    $script:notifyIcon.Add_DoubleClick({ Start-Process "http://localhost:8081" })

    # Health Timer
    $script:lastFileLength = 0
    $script:lastLogCount = 0
    $healthTimer = New-Object System.Windows.Forms.Timer
    $healthTimer.Interval = 5000
    $healthTimer.Add_Tick({
        try {
            if ($script:proxyProc -and $script:proxyProc.HasExited) { Start-Proxy }
            if (Test-Path $LOGS_FILE) {
                $info = Get-Item $LOGS_FILE
                if ($info.Length -gt $script:lastFileLength) {
                    $script:lastFileLength = $info.Length
                    $lines = [System.IO.File]::ReadAllLines($LOGS_FILE)
                    if ($lines.Count -gt $script:lastLogCount) {
                        $script:lastLogCount = $lines.Count
                        $script:notifyIcon.Text = "Gridge AI Logger`nLogs: $($lines.Count)"
                    }
                }
            }
        } catch { }
    })
    $healthTimer.Start()

    # Start Services
    Start-Proxy
    Start-LogServer

    [System.Windows.Forms.Application]::Run()
} catch {
    Write-TrayLog "FATAL UI ERROR: $_"
}
