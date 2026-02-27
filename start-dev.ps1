# SoloBoard - 启动开发服务器 (PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SoloBoard - 启动开发服务器" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location D:\AIsoftware\soloboard

# 1. 检查环境变量
Write-Host "[1/4] 检查环境变量..." -ForegroundColor Yellow
if (-not (Test-Path .env.local)) {
    Write-Host "❌ .env.local 文件不存在" -ForegroundColor Red
    Write-Host "请先运行: Copy-Item env.example.txt .env.local" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "✅ .env.local 文件存在" -ForegroundColor Green

# 2. 检查依赖
Write-Host ""
Write-Host "[2/4] 检查依赖..." -ForegroundColor Yellow
if (-not (Test-Path node_modules)) {
    Write-Host "正在安装依赖..." -ForegroundColor Yellow
    pnpm install
} else {
    Write-Host "✅ 依赖已安装" -ForegroundColor Green
}

# 3. 设置端口
Write-Host ""
Write-Host "[3/4] 设置端口为 3002..." -ForegroundColor Yellow
$env:PORT = "3002"
Write-Host "✅ 端口设置为 $env:PORT" -ForegroundColor Green

# 4. 启动服务器
Write-Host ""
Write-Host "[4/4] 启动开发服务器..." -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 服务器将在 http://localhost:3002 启动" -ForegroundColor Green
Write-Host ""
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Yellow
Write-Host ""

pnpm dev
























