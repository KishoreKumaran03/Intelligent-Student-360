@echo off
setlocal
cd /d "%~dp0.."

docker --version >nul 2>&1
if errorlevel 1 (
  echo Docker is not installed or not available in PATH.
  exit /b 1
)

echo Starting Intelligent Student 360 demo container...
docker compose up -d --build student360-web
if errorlevel 1 exit /b 1

echo.
echo Student 360 is available at http://localhost:3000
echo Demo data stays in this browser. No backend or institutional system is connected.
endlocal
