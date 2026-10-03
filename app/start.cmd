@echo off
cd /d "%~dp0"
set "GOAT_NODE=node"
where node >nul 2>nul
if errorlevel 1 (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    set "GOAT_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  ) else (
    echo Node.js was not found. Install Node.js, then run this launcher again.
    pause
    exit /b 1
  )
)
"%GOAT_NODE%" server.mjs
pause
