@echo off
setlocal
REM ═══════════════════════════════════════════════════════════
REM  Council of Kangs v6.4 — Jazy's House Platform
REM  Usage: council.bat TICKET_NUMBER [TITLE] [TIER]
REM  Example: council.bat JH-002 "Checkout fix" full
REM ═══════════════════════════════════════════════════════════

set "HERMES_ROOT=%LOCALAPPDATA%\hermes"
set "SCRIPTS=%HERMES_ROOT%\scripts"
set "TICKET=%~1"
set "TITLE=%~2"
set "TIER=%~3"

if "%TICKET%"=="" (
    echo Usage: council.bat TICKET_NUMBER [TITLE] [TIER]
    echo Example: council.bat JH-002 "Checkout fix" full
    echo.
    echo Options:
    echo   council.bat status   - Show completed council runs
    echo   council.bat probe    - Health-check all seat CLIs
    exit /b 1
)

if /i "%TICKET%"=="status" (
    echo Completed council runs (in .doa\council\):
    for /d %%d in ("%CD%\.doa\council\*") do (
        if exist "%%d\minutes.md" echo   %%~nxd - COMPLETED
    )
    exit /b 0
)

if /i "%TICKET%"=="probe" (
    echo Probing council seats...
    powershell -ExecutionPolicy Bypass -File "%SCRIPTS%\council-preflight-jazyshouse.ps1" -Probe -ProbeTimeoutSeconds 180
    exit /b %ERRORLEVEL%
)

if "%TITLE%"=="" set "TITLE=%TICKET%"
if "%TIER%"=="" set "TIER=full"

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║  COUNCIL OF KANGS v6.4 — JAZY'S HOUSE              ║
echo ║  Ticket: #%TICKET%  Tier: %TIER%                   ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo Starting council execution...
echo Artifacts: %CD%\.doa\council\%TICKET%\
echo.

powershell -ExecutionPolicy Bypass -File "%SCRIPTS%\council-run-jazyshouse.ps1" -Ticket "%TICKET%" -Title "%TITLE%" -Tier "%TIER%"

echo.
echo ═══════════════════════════════════════════════════════
echo  Council complete. Artifacts at:
echo  %CD%\.doa\council\%TICKET%\
echo ═══════════════════════════════════════════════════════
