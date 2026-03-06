@echo off
chcp 65001 >nul 2>&1
title DataMaster Slack Bot

echo ╔══════════════════════════════════════════════╗
echo ║  DataMaster Slack Bot Launcher               ║
echo ╚══════════════════════════════════════════════╝
echo.

cd /d "%~dp0erd-app"

:: .env 체크
if not exist ".env" (
    echo ❌ .env 파일이 없습니다!
    echo    .env.example 을 참고하여 .env 파일을 생성하세요.
    pause
    exit /b 1
)

:: SLACK_BOT_TOKEN 체크
findstr /C:"SLACK_BOT_TOKEN" .env >nul 2>&1
if errorlevel 1 (
    echo ❌ .env 에 SLACK_BOT_TOKEN 이 없습니다!
    echo    Slack App 설정 후 토큰을 .env 에 추가하세요.
    pause
    exit /b 1
)

echo ✅ .env 확인 완료
echo 🚀 Slack Bot 시작...
echo.

node slack-bot.js

if errorlevel 1 (
    echo.
    echo ❌ Slack Bot 이 비정상 종료되었습니다.
    pause
)
