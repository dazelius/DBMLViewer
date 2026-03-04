@echo off
chcp 65001 > nul
title TableMaster - Server

echo ========================================
echo   TableMaster ERD App
echo ========================================
echo.

cd /d "%~dp0erd-app"

:: dist 폴더가 있으면 재빌드 여부 물어봄
if exist "dist\index.html" (
  echo [INFO] 이전 빌드 결과가 있습니다.
  echo.
  echo   [1] 재빌드 없이 바로 서버 시작  (빠름)
  echo   [2] 새로 빌드 후 서버 시작      (코드 변경 시)
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
echo [INFO] 서버 시작 중...
echo [INFO] 주소: http://localhost:5173/TableMaster
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
