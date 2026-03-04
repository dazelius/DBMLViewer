@echo off
chcp 65001 > nul
title TableMaster - Preview Server

echo ========================================
echo   TableMaster ERD App - Preview Server
echo ========================================
echo.

cd /d "%~dp0erd-app"

echo [INFO] 빌드 후 프리뷰 서버를 시작합니다...
echo.

echo [1/2] 빌드 중...
npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] 빌드 실패! 오류를 확인하세요.
    pause
    exit /b 1
)

echo.
echo [2/2] 프리뷰 서버 시작 중...
echo [INFO] 주소: http://localhost:5173/TableMaster
echo [INFO] 종료하려면 Ctrl+C 를 누르세요.
echo.

npm run preview

pause
