#!/bin/bash

echo "========================================"
echo "   番茄小说热榜分析系统 - 启动脚本"
echo "========================================"
echo ""

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "[错误] 未检测到Python3，请先安装"
    exit 1
fi

# 进入后端目录
cd "$(dirname "$0")/backend"

# 安装依赖
if ! python3 -c "import flask" &> /dev/null; then
    echo "[提示] 正在安装依赖..."
    pip3 install -r requirements.txt
fi

# 启动服务
echo ""
echo "[提示] 正在启动后端服务..."
echo "[提示] 服务地址：http://localhost:5000"
echo "[提示] 按 Ctrl+C 停止服务"
echo ""
python3 server.py
