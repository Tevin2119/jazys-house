@echo off
setlocal
REM ==========================================================
REM  Council of Kangs -- Jazy's House Platform
REM  Usage: council.bat TICKET [TITLE] [TIER] [allow-implementation]
REM  Example: council.bat JH-002 "Checkout fix" audit
REM
REM  2026-07-11: upgraded from the v6.4 dedicated runner
REM  (council-run-jazyshouse.ps1, kept in hermes\scripts for reference)
REM  to the SHARED engine: council-run.ps1 + council-profile-jazyshouse.ps1
REM  (Next.js/Prisma/Stripe mandates, npm build gate).
REM
REM  NO TASKBOARD for this repo: tickets are MANUAL (non-numeric,
REM  e.g. JH-002). Seed the intake yourself:
REM    .doa\council\{TICKET}\brief.md   <- this IS the intake (>= 200 bytes)
REM
REM  Tier defaults to the hermes-config default (audit = analysis+plan,
REM  no code changes). Pass "full" + allow-implementation to let Seat 5
REM  write code (working tree only; commits stay with the operator).
REM ==========================================================

set "HERMES_ROOT=%LOCALAPPDATA%\hermes"
set "SCRIPTS=%HERMES_ROOT%\scripts"
set "REPO=%~dp0"
if "%REPO:~-1%"=="\" set "REPO=%REPO:~0,-1%"
set "TICKET=%~1"
set "TITLE=%~2"
set "TIER=%~3"
set "ALLOW_IMPL=%~4"
set "ALLOW_IMPL_ARGS="
if /i "%TIER%"=="allow-implementation" (
    set "TIER="
    set "ALLOW_IMPL=allow-implementation"
)
if /i "%ALLOW_IMPL%"=="allow-implementation" set "ALLOW_IMPL_ARGS=-AllowImplementation"

if "%TICKET%"=="" (
    echo Usage: council.bat TICKET [TITLE] [TIER] [allow-implementation]
    echo Example: council.bat JH-002 "Checkout fix" audit
    echo.
    echo Options:
    echo   council.bat status   - List council runs in .doa\council\
    echo   council.bat probe    - Live health-check of all seat CLIs
    echo   council.bat validate - Fast setup validation, no live model probes
    echo   council.bat smoke    - Live seat smoke probes with timeout
    exit /b 1
)

if /i "%TICKET%"=="status" (
    echo Council runs in %REPO%\.doa\council\ :
    for /d %%d in ("%REPO%\.doa\council\*") do (
        if exist "%%d\minutes.md" (
            echo   %%~nxd - COMPLETED
        ) else (
            echo   %%~nxd - incomplete
        )
    )
    exit /b 0
)

if /i "%TICKET%"=="probe" (
    powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%SCRIPTS%\council-preflight-jazyshouse.ps1" -Probe
    exit /b %ERRORLEVEL%
)

if /i "%TICKET%"=="validate" (
    powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%SCRIPTS%\council-fast-validate.ps1" -RepoPath "%REPO%"
    exit /b %ERRORLEVEL%
)

if /i "%TICKET%"=="smoke" (
    powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%SCRIPTS%\council-smoke.ps1" -RepoPath "%REPO%"
    exit /b %ERRORLEVEL%
)

if "%TITLE%"=="" set "TITLE=%TICKET%"
set "TIER_ARGS="
set "TIER_DISPLAY=%TIER%"
if not "%TIER%"=="" set TIER_ARGS=-Tier "%TIER%"
if "%TIER_DISPLAY%"=="" set "TIER_DISPLAY=(hermes-config default)"

if not exist "%REPO%\.doa\council\%TICKET%\brief.md" (
    echo BLOCKED: %REPO%\.doa\council\%TICKET%\brief.md not found.
    echo This repo has no TaskBoard - brief.md IS the intake. Write it first
    echo ^(objective, current state, key questions, constraints^), then re-run.
    exit /b 1
)

echo.
echo ========================================================
echo   COUNCIL OF KANGS -- JAZY'S HOUSE
echo   Ticket: #%TICKET%  Tier: %TIER_DISPLAY%
echo ========================================================
echo.
echo Artifacts: %REPO%\.doa\council\%TICKET%\
echo.

powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%SCRIPTS%\council-run.ps1" -Ticket "%TICKET%" -Title "%TITLE%" %TIER_ARGS% -RepoPath "%REPO%" %ALLOW_IMPL_ARGS%
set "COUNCIL_EXIT=%ERRORLEVEL%"

if not "%COUNCIL_EXIT%"=="0" (
    echo.
    echo Council failed with exit code %COUNCIL_EXIT%.
    exit /b %COUNCIL_EXIT%
)

echo.
echo ========================================================
echo  Council complete. Artifacts at:
echo  %REPO%\.doa\council\%TICKET%\
echo ========================================================
