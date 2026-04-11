@echo off
chcp 65001 >nul
title Gridge AI Logger 설치

REM ═══ 사전 주입 설정 (백엔드가 멤버별로 채움) ═══
set GRIDGE_SERVER=__GRIDGE_SERVER__
set GRIDGE_API_KEY=__GRIDGE_API_KEY__
set GRIDGE_USER_ID=__GRIDGE_USER_ID__
set PROXY_PORT=8080

REM ═══ 경로 ═══
set GRIDGE_HOME=%USERPROFILE%\.gridge
set EXT_DIR=%GRIDGE_HOME%\chrome-extension
set PROXY_DIR=%GRIDGE_HOME%\local-proxy

echo.
echo   ╔══════════════════════════════════════════╗
echo   ║     Gridge AI Logger 설치 시작            ║
echo   ╠══════════════════════════════════════════╣
echo   ║  유저: %GRIDGE_USER_ID%
echo   ║  서버: %GRIDGE_SERVER%
echo   ╚══════════════════════════════════════════╝
echo.

REM ═══ 1. 디렉토리 생성 ═══
if not exist "%EXT_DIR%" mkdir "%EXT_DIR%"
if not exist "%PROXY_DIR%" mkdir "%PROXY_DIR%"

REM ═══ 2. Chrome Extension 설치 ═══
echo [1/4] Chrome Extension 설치 중...
set SCRIPT_DIR=%~dp0
if exist "%SCRIPT_DIR%chrome-extension\" (
  xcopy /s /y /q "%SCRIPT_DIR%chrome-extension\*" "%EXT_DIR%\" >nul
)

REM config.json 생성
(
echo {
echo   "serverUrl": "%GRIDGE_SERVER%",
echo   "apiKey": "%GRIDGE_API_KEY%",
echo   "userId": "%GRIDGE_USER_ID%",
echo   "enabled": true
echo }
) > "%EXT_DIR%\config.json"
echo   ✓ Extension 설치: %EXT_DIR%

REM ═══ 3. 로컬 프록시 설치 ═══
echo.
echo [2/4] 로컬 프록시 설치 중...
if exist "%SCRIPT_DIR%local-proxy\" (
  xcopy /s /y /q "%SCRIPT_DIR%local-proxy\*" "%PROXY_DIR%\" >nul
)

(
echo {
echo   "serverUrl": "%GRIDGE_SERVER%",
echo   "apiKey": "%GRIDGE_API_KEY%",
echo   "userId": "%GRIDGE_USER_ID%",
echo   "port": %PROXY_PORT%
echo }
) > "%PROXY_DIR%\config.json"
echo   ✓ 프록시 설치: %PROXY_DIR%

REM ═══ 4. 환경변수 설정 ═══
echo.
echo [3/4] 환경변수 설정 중...
setx ANTHROPIC_BASE_URL "http://localhost:%PROXY_PORT%/v1" >nul 2>&1
setx GRIDGE_SERVER "%GRIDGE_SERVER%" >nul 2>&1
setx GRIDGE_API_KEY "%GRIDGE_API_KEY%" >nul 2>&1
setx GRIDGE_USER_ID "%GRIDGE_USER_ID%" >nul 2>&1
set ANTHROPIC_BASE_URL=http://localhost:%PROXY_PORT%/v1
echo   ✓ ANTHROPIC_BASE_URL=http://localhost:%PROXY_PORT%/v1

REM ═══ 5. 프록시 시작 ═══
echo.
echo [4/4] 프록시 시작 중...
where node >nul 2>&1
if %errorlevel%==0 (
  taskkill /f /im "node.exe" /fi "WINDOWTITLE eq Gridge*" >nul 2>&1
  start "Gridge Proxy" /min node "%PROXY_DIR%\proxy.js"
  echo   ✓ 프록시 실행 중
) else (
  echo   ✗ Node.js가 설치되어 있지 않습니다.
  echo     https://nodejs.org 에서 설치 후 다시 실행해주세요.
)

REM ═══ 완료 ═══
echo.
echo   ╔══════════════════════════════════════════╗
echo   ║         설치 완료!                       ║
echo   ╠══════════════════════════════════════════╣
echo   ║                                          ║
echo   ║  Chrome Extension:                       ║
echo   ║    chrome://extensions → 개발자 모드     ║
echo   ║    → %EXT_DIR% 로드                      ║
echo   ║                                          ║
echo   ║  Claude Code: 자동 설정 완료             ║
echo   ║  Cursor: Settings → API Base URL →       ║
echo   ║    http://localhost:%PROXY_PORT%/v1              ║
echo   ║                                          ║
echo   ╚══════════════════════════════════════════╝
echo.
pause
