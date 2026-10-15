@echo off
chcp 65001 >nul
cd /d "%~dp0"
if exist "Nightfall-Theme-Studio.exe" ("Nightfall-Theme-Studio.exe" & goto :eof)
where py >nul 2>nul && (py -3 desktop-scripts\bridge.py & goto :eof)
where python >nul 2>nul && (python desktop-scripts\bridge.py & goto :eof)
echo [Nightfall] Need Python 3 to run one-click local studio.
echo You may still open studio\index.html for offline preview only.
pause
