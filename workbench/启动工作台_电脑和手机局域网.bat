@echo off
chcp 65001 >nul
cd /d "%~dp0"
python local_cpp_runner.py --lan --open
pause
