@echo off
echo ========================================
echo SoloBoard - 启动开发服务器
echo ========================================
echo.

cd /d D:\AIsoftware\soloboard

echo [1/4] 检查环境变量...
if not exist .env.local (
    echo ❌ .env.local 文件不存在
    echo 请先运行: copy env.example.txt .env.local
    pause
    exit /b 1
)
echo ✅ .env.local 文件存在

echo.
echo [2/4] 检查依赖...
if not exist node_modules (
    echo 正在安装依赖...
    call pnpm install
) else (
    echo ✅ 依赖已安装
)

echo.
echo [3/4] 设置端口为 3002...
set PORT=3002
echo ✅ 端口设置为 %PORT%

echo.
echo [4/4] 启动开发服务器...
echo.
echo 🚀 服务器将在 http://localhost:3002 启动
echo.
echo 按 Ctrl+C 停止服务器
echo.

call pnpm dev
























