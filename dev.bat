@echo off
title ClipForge Live Dev Mode
echo ========================================================
echo   [ClipForge] Live Dev Mode (Vite HMR + Native Rust IPC)
echo ========================================================
echo.
echo [1/2] Starting Vite dev server in background...
cd /d "%~dp0frontend"
start "ClipForge Vite Dev" /min cmd /c "npx vite"

cd /d "%~dp0"
echo [2/2] Waiting for dev server to start...
timeout /t 2 /nobreak >nul

echo Launching ClipForge (connecting to http://localhost:5173)...
start "" "%~dp0clipforge.exe"
echo Done! Any changes in frontend/src will update live in ClipForge.
