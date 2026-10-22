@echo off
set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;C:\Program Files\nodejs;%USERPROFILE%\.cargo\bin;C:\Users\PC\AppData\Local\Microsoft\WinGet\Packages\BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\mingw64\bin;%PATH%"
title ClipForge Fast Test
echo ========================================================
echo   [ClipForge] Fast Testing Mode (No Rust rebuild)
echo ========================================================
echo.
echo [1/2] Quick frontend build (vite)...
cd /d "%~dp0frontend"
call npx vite build --emptyOutDir
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend build failed!
    pause
    exit /b %ERRORLEVEL%
)

cd /d "%~dp0"
echo.
echo [2/2] Launching ClipForge...
start "" "%~dp0clipforge.exe"
echo Done! ClipForge is running.
