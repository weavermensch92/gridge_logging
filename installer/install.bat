@echo off
chcp 65001 >nul
title Gridge AI Logger 통합 설치

REM ═══ 사전 주입 설정 ═══
set GRIDGE_SERVER=__GRIDGE_SERVER__
set GRIDGE_API_KEY=__GRIDGE_API_KEY__
set GRIDGE_USER_ID=__GRIDGE_USER_ID__
set LOCAL_PORT=8080
set SYSTEM_PORT=9090
set GRIDGE_HOME=%USERPROFILE%\.gridge

echo.
echo   ╔══════════════════════════════════════════════╗
echo   ║     Gridge AI Logger 통합 설치                ║
echo   ╠══════════════════════════════════════════════╣
echo   ║  유저: %GRIDGE_USER_ID%
echo   ║  서버: %GRIDGE_SERVER%
echo   ╚══════════════════════════════════════════════╝
echo.

echo.
echo [0/7] 기존 프로세스 및 파일 정리 중...
taskkill /f /fi "WINDOWTITLE eq Gridge*" >nul 2>&1
taskkill /f /im gridge-proxy.exe >nul 2>&1
powershell -Command "Get-WmiObject Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -like '*gridge-tray.ps1*' } | ForEach-Object { Stop-Process $_.ProcessId -Force }" >nul 2>&1

if exist "%GRIDGE_HOME%" (
    echo [0/7] 기존 설치 폴더 삭제 중 (%GRIDGE_HOME%)...
    rmdir /s /q "%GRIDGE_HOME%"
)
mkdir "%GRIDGE_HOME%" 2>nul

REM 1. 소스 다운로드
echo [1/7] 소스 다운로드 중...
where git >nul 2>&1 && (
  if exist "%TEMP%\gridge_install" rmdir /s /q "%TEMP%\gridge_install"
  git clone --depth 1 https://github.com/weavermensch92/gridge_logging.git "%TEMP%\gridge_install" 2>nul
  echo   ✓ 다운로드 완료
) || (
  echo   ✗ git이 없습니다. GitHub에서 ZIP 다운로드 후 수동 설치
  pause & exit /b 1
)

REM 2. Chrome Extension
echo [2/7] Chrome Extension 설치 중...
mkdir "%GRIDGE_HOME%\chrome-extension" 2>nul
xcopy /s /y /q "%TEMP%\gridge_install\chrome-extension\*" "%GRIDGE_HOME%\chrome-extension\" >nul 2>&1
(echo {"serverUrl":"%GRIDGE_SERVER%","apiKey":"%GRIDGE_API_KEY%","userId":"%GRIDGE_USER_ID%","enabled":true}) > "%GRIDGE_HOME%\chrome-extension\config.json"
echo   ✓ %GRIDGE_HOME%\chrome-extension\

REM 3. 로컬 프록시
echo [3/7] 로컬 프록시 설치 중...
mkdir "%GRIDGE_HOME%\local-proxy" 2>nul
xcopy /s /y /q "%TEMP%\gridge_install\local-proxy\*" "%GRIDGE_HOME%\local-proxy\" >nul 2>&1
(echo {"serverUrl":"%GRIDGE_SERVER%","apiKey":"%GRIDGE_API_KEY%","userId":"%GRIDGE_USER_ID%","port":%LOCAL_PORT%}) > "%GRIDGE_HOME%\local-proxy\config.json"
echo   ✓ %GRIDGE_HOME%\local-proxy\

REM 4. 시스템 프록시
echo [4/7] 시스템 HTTPS 프록시 설치 중...
mkdir "%GRIDGE_HOME%\system-proxy" 2>nul
xcopy /s /y /q "%TEMP%\gridge_install\system-proxy\*" "%GRIDGE_HOME%\system-proxy\" >nul 2>&1
(echo {"port":%SYSTEM_PORT%,"serverUrl":"%GRIDGE_SERVER%","apiKey":"%GRIDGE_API_KEY%","userId":"%GRIDGE_USER_ID%","interceptDomains":["api.anthropic.com","api.openai.com","claude.ai","chatgpt.com"],"captureMode":"company_only","companyApiKeys":[]}) > "%GRIDGE_HOME%\system-proxy\config.json"
echo   ✓ %GRIDGE_HOME%\system-proxy\

REM 5. 트레이 앱 (Windows)
echo [5/7] 트레이 앱 설치 중...
mkdir "%GRIDGE_HOME%\tray-app" 2>nul
xcopy /s /y /q "%TEMP%\gridge_install\tray-app\*" "%GRIDGE_HOME%\tray-app\" >nul 2>&1
echo   ✓ %GRIDGE_HOME%\tray-app\

REM 6. 환경변수
echo [6/7] 환경변수 설정 중...
setx ANTHROPIC_BASE_URL "http://localhost:%LOCAL_PORT%/v1" >nul 2>&1
setx GRIDGE_SERVER "%GRIDGE_SERVER%" >nul 2>&1
setx GRIDGE_API_KEY "%GRIDGE_API_KEY%" >nul 2>&1
setx GRIDGE_USER_ID "%GRIDGE_USER_ID%" >nul 2>&1
set ANTHROPIC_BASE_URL=http://localhost:%LOCAL_PORT%/v1
echo   ✓ ANTHROPIC_BASE_URL=http://localhost:%LOCAL_PORT%/v1

REM 7. 프록시 시작
echo [7/7] 프록시 시작 중...
where node >nul 2>&1 && (
  taskkill /f /fi "WINDOWTITLE eq Gridge*" >nul 2>&1
  start "Gridge Local Proxy" /min node "%GRIDGE_HOME%\local-proxy\proxy.js"
  echo   ✓ 로컬 프록시 실행
) || (
  echo   ✗ Node.js가 없습니다. https://nodejs.org 설치 필요
)

rmdir /s /q "%TEMP%\gridge_install" 2>nul

echo.
echo   ╔══════════════════════════════════════════════════════╗
echo   ║                   설치 완료!                         ║
echo   ╠══════════════════════════════════════════════════════╣
echo   ║  ① Chrome Extension:                                ║
echo   ║     chrome://extensions → 개발자 모드                ║
echo   ║     → %GRIDGE_HOME%\chrome-extension 로드            ║
echo   ║  ② Claude Code: 새 터미널에서 자동 적용             ║
echo   ║  ③ Cursor: Settings → API Base URL → localhost:%LOCAL_PORT% ║
echo   ║  ④ Desktop 앱: CA 인증서 설치 필요                  ║
echo   ║     node %GRIDGE_HOME%\system-proxy\install-cert.js  ║
echo   ╚══════════════════════════════════════════════════════╝
echo.
pause
