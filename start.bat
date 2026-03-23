@echo off
setlocal EnableDelayedExpansion
chcp 65001 > nul
title TableMaster - Server

echo ========================================
echo   TableMaster ERD App
echo ========================================
echo.

cd /d "%~dp0erd-app"

:: ── .env에서 포트 읽기 ──────────────────────────────────────────────
set "APP_PORT=5173"
set "BT_PORT=8100"
if exist ".env" (
  for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    if "%%A"=="PORT" set "APP_PORT=%%B"
    if "%%A"=="SECONDARY_PORT" set "BT_PORT=%%B"
  )
)

:: dist 폴더가 있으면 재빌드 여부 물어봄
if exist "dist\index.html" (
  echo [INFO] 이전 빌드 결과가 있습니다.
  echo.
  echo   [1] 재빌드 없이 바로 서버 시작  ^(빠름^)
  echo   [2] 새로 빌드 후 서버 시작      ^(코드 변경 시^)
  echo.
  set /p CHOICE="선택 (1 또는 2, 기본=1): "
  if "%CHOICE%"=="2" goto BUILD
  goto START_SERVER
)

:BUILD
echo.
echo [INFO] 빌드 중... (약 30~60초 소요)
echo.
call npm run build
if %errorlevel% neq 0 (
  echo.
  echo ================================================
  echo  [ERROR] 빌드 실패! 위 오류 메시지를 확인하세요.
  echo ================================================
  echo.
  pause
  exit /b 1
)
echo.
echo [INFO] 빌드 완료!

:START_SERVER
echo.

:: ── 바이블테이블링 서버 ─────────────────────────────────────────────
echo [INFO] %BT_PORT% 포트 기존 프로세스 종료 중...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BT_PORT% " 2^>nul') do (
  taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

echo [INFO] Python 의존성 설치 확인 중...
pip install -r "%~dp0erd-app\bible-tabling\requirements.txt" -q >nul 2>&1

echo [INFO] 바이블테이블링 서버 시작 중... (포트 %BT_PORT%)
start "BibleTabling Server" /d "%~dp0erd-app\bible-tabling" /min cmd /k "python main.py"

:: 서버 시작 대기 (최대 ~15초, 2초 간격 헬스체크)
set "BT_READY=0"
for /L %%i in (1,1,7) do (
  if !BT_READY! equ 0 (
    timeout /t 2 /nobreak >nul
    curl -s -o nul -w "" http://localhost:%BT_PORT%/api/bible-tabling/health >nul 2>&1 && set "BT_READY=1"
  )
)
if !BT_READY! equ 1 (
  echo [OK] 바이블테이블링 서버 실행 중 (http://localhost:%BT_PORT%)
) else (
  echo [WARN] 바이블테이블링 서버 응답 없음 - Python 환경 확인 필요
)
echo.

:: ── Slack Bot ────────────────────────────────────────────────────────
if exist "%~dp0erd-app\.env" (
  findstr /C:"SLACK_BOT_TOKEN" "%~dp0erd-app\.env" >nul 2>&1
  if not errorlevel 1 (
    echo [INFO] Slack Bot 시작 중...
    start "DataMaster Slack Bot" /d "%~dp0erd-app" /min cmd /k "node slack-bot.cjs"
    timeout /t 2 /nobreak >nul
    echo [OK] Slack Bot 실행 중
    echo.
  ) else (
    echo [SKIP] .env 에 SLACK_BOT_TOKEN 없음 - Slack Bot 건너뜀
    echo.
  )
) else (
  echo [SKIP] .env 파일 없음 - Slack Bot 건너뜀
  echo.
)

:: ── TableMaster 앱 서버 ─────────────────────────────────────────────
echo [INFO] %APP_PORT% 포트 기존 프로세스 종료 중...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%APP_PORT% " 2^>nul') do (
  taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

echo [INFO] 서버 시작 중...
echo [INFO] 주소: http://localhost:%APP_PORT%
echo [INFO] 종료하려면 Ctrl+C 를 누르세요.
echo.

:RETRY
call npm run preview
echo.
echo ================================================
echo  [WARNING] 서버가 종료되었습니다.
echo  [R] 재시작   [Q] 종료
echo ================================================
echo.
set /p RESTART="선택 (R/Q, 기본=R): "
if /i "%RESTART%"=="Q" exit /b 0
goto RETRY
