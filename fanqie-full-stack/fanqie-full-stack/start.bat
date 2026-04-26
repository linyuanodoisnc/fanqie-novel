@echo off
chcp 65001 > nul
echo ========================================
echo    番茄小说热榜分析系统 - 启动脚本
echo ========================================
echo.

:: 检查Python是否安装
python --version > nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Python，请先安装Python 3.x
    echo 下载地址：https://www.python.org/downloads/
    pause
    exit /b 1
)

:: 进入后端目录
cd /d "%~dp0backend"

:: 检查依赖是否安装
python -c "import flask" > nul 2>&1
if errorlevel 1 (
    echo [提示] 正在安装依赖...
    pip install -r requirements.txt
)

:: 启动后端服务
echo.
echo [提示] 正在启动后端服务...
echo [提示] 服务地址：http://localhost:5000
echo [提示] 按 Ctrl+C 停止服务
echo.
python server.py

pause
