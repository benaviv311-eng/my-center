@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0publish-site.ps1"
if errorlevel 1 (
  echo.
  echo Publishing failed. Keep this window open and send the error message to ChatGPT.
  pause
)
