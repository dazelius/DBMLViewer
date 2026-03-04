@echo off
chcp 65001 > nul
title TableMaster - Production Server

echo ========================================
echo   TableMaster ERD App - Production
echo   (실사용 / 빠른 프로덕션 빌드)
echo ========================================
echo.

cd /d "%~dp0erd-app"

echo [INFO] 프로덕션 빌드 중... (약 30~60초 소요)
echo.
npm run build

if %errorlevel% neq 0 (
  echo.
  echo [ERROR] 빌드 실패!
  pause
  exit /b 1
)

echo.
echo [INFO] 서버 시작 완료!
echo [INFO] 주소: http://localhost:5173/TableMaster
echo [INFO] 종료하려면 Ctrl+C 를 누르세요.
echo.

npm run preview
pause
