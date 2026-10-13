@echo off
setlocal
cd /d "%~dp0.."
echo Stopping Intelligent Student 360 demo container...
docker compose down
endlocal
