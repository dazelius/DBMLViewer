@echo off
chcp 65001 > nul
title TableMaster - Dev Server

echo ========================================
echo   TableMaster ERD App - Dev Server
echo   (개발용 / 코드 수정 시 HMR 지원)
echo ========================================
echo.

cd /d "%~dp0erd-app"

echo [INFO] 개발 서버를 시작합니다...
echo [INFO] 주소: http://localhost:5173/TableMaster
echo [INFO] 종료하려면 Ctrl+C 를 누르세요.
echo.

npm run dev
pause
