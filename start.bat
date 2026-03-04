@echo off
chcp 65001 > nul
title TableMaster - All-in-One

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║        TableMaster  -  All-in-One            ║
echo  ║                                              ║
echo  ║  [1]  Dev    서버  (npm run dev)             ║
echo  ║  [2]  Preview 서버  (build + preview)        ║
echo  ╚══════════════════════════════════════════════╝
echo.
set /p MODE="  모드 선택 (1 or 2, 기본값 1): "
if "%MODE%"=="" set MODE=1
if "%MODE%"=="2" goto PREVIEW

:DEV
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║  Dev 서버  +  자동 인덱서 시작               ║
echo  ╚══════════════════════════════════════════════╝
echo.

echo [1/2] 자동 인덱서를 백그라운드 창으로 시작합니다...
start "TableMaster - Auto Indexer" powershell.exe -NoExit -ExecutionPolicy Bypass -File "%~dp0..\watch_and_index.ps1"

echo [2/2] Dev 서버를 시작합니다...
echo.
echo  주소: http://localhost:5173/TableMaster
echo  종료: 이 창에서 Ctrl+C  (인덱서 창은 별도로 닫으세요)
echo.

cd /d "%~dp0erd-app"
npm run dev
goto END

:PREVIEW
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║  Preview 서버  +  자동 인덱서 시작           ║
echo  ╚══════════════════════════════════════════════╝
echo.

echo [1/3] 자동 인덱서를 백그라운드 창으로 시작합니다...
start "TableMaster - Auto Indexer" powershell.exe -NoExit -ExecutionPolicy Bypass -File "%~dp0..\watch_and_index.ps1"

cd /d "%~dp0erd-app"

echo [2/3] 빌드 중...
npm run build
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] 빌드 실패! 오류를 확인하세요.
    pause
    exit /b 1
)

echo.
echo [3/3] Preview 서버를 시작합니다...
echo.
echo  주소: http://localhost:5173/TableMaster
echo  종료: 이 창에서 Ctrl+C  (인덱서 창은 별도로 닫으세요)
echo.
npm run preview

:END
pause
