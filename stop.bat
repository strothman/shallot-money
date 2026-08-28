@echo off
cd /d "%~dp0"
echo Stopping Shallot Money dev server on port 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo Done.
