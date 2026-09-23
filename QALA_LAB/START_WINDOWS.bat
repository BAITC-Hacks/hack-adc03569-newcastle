@echo off
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
  py -3 server.py --open
) else (
  where python >nul 2>nul
  if errorlevel 1 (
    echo Python 3.11+ is required. See START_HERE_KK.md.
  ) else (
    python server.py --open
  )
)
pause
