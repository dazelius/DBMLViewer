@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ============================================
echo   Unity Scene Baker  (scene-cache 생성)
echo ============================================
echo.

set ERD_APP=%~dp0erd-app
set SCRIPTS=%ERD_APP%\scripts
set UNITY_ASSETS=%~dp0..\..\unity_project\Client\Project_Aegis\Assets

REM ── 인자로 특정 씬 지정 가능: bake-all-scenes.bat GameContents/Map/OldTown.unity
if not "%1"=="" (
    echo [단일 베이크] %1
    cd /d "%ERD_APP%"
    node scripts\bake-scene.mjs --path %1 --force
    echo.
    echo 완료!
    pause
    exit /b 0
)

REM ── Unity Assets 디렉토리에서 .unity 파일 전부 찾기 ──
echo Unity 씬 파일 검색 중: %UNITY_ASSETS%
echo.

set COUNT=0
for /r "%UNITY_ASSETS%" %%F in (*.unity) do (
    REM Assets 디렉토리 기준 상대 경로 계산
    set FULL=%%F
    set REL=!FULL:%UNITY_ASSETS%\=!
    REM 백슬래시 → 슬래시 변환
    set REL=!REL:\=/!
    
    set /a COUNT+=1
    echo [!COUNT!] 베이크: !REL!
    
    cd /d "%ERD_APP%"
    node scripts\bake-scene.mjs --path "!REL!"
    if errorlevel 1 (
        echo     [오류] 베이크 실패: !REL!
    ) else (
        echo     [완료]
    )
    echo.
)

if %COUNT%==0 (
    echo 씬 파일을 찾을 수 없습니다.
    echo UNITY_ASSETS 경로를 확인하세요: %UNITY_ASSETS%
)

echo ============================================
echo   총 %COUNT%개 씬 처리 완료
echo ============================================
pause
