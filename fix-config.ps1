# 修复脚本：清理缓存并重启开发服务器

Write-Host "=== 开始修复 Next.js 配置和缓存问题 ===" -ForegroundColor Green

# 1. 停止所有 Node 进程
Write-Host "`n[1/5] 停止所有 Node 进程..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. 删除 .next 缓存
Write-Host "`n[2/5] 删除 .next 缓存目录..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ .next 缓存已删除" -ForegroundColor Green
} else {
    Write-Host "✓ .next 目录不存在，跳过" -ForegroundColor Gray
}

# 3. 删除 Turbopack 缓存
Write-Host "`n[3/5] 删除 Turbopack 缓存..." -ForegroundColor Yellow
if (Test-Path ".turbo") {
    Remove-Item -Path ".turbo" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ .turbo 缓存已删除" -ForegroundColor Green
} else {
    Write-Host "✓ .turbo 目录不存在，跳过" -ForegroundColor Gray
}

# 4. 验证关键文件
Write-Host "`n[4/5] 验证关键配置文件..." -ForegroundColor Yellow

$files = @(
    "next.config.mjs",
    "src/core/i18n/request.ts",
    "src/core/i18n/config.ts",
    "src/config/locale/index.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✓ $file 存在" -ForegroundColor Green
    } else {
        Write-Host "✗ $file 不存在！" -ForegroundColor Red
    }
}

# 5. 启动开发服务器
Write-Host "`n[5/5] 启动开发服务器..." -ForegroundColor Yellow
Write-Host "执行命令: pnpm dev" -ForegroundColor Cyan
Write-Host "`n提示：服务器启动后，请访问 http://localhost:3000/en 测试" -ForegroundColor Magenta
Write-Host "=== 修复脚本执行完成 ===" -ForegroundColor Green
Write-Host "`n"

# 启动开发服务器
pnpm dev


Write-Host "=== 开始修复 Next.js 配置和缓存问题 ===" -ForegroundColor Green

# 1. 停止所有 Node 进程
Write-Host "`n[1/5] 停止所有 Node 进程..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. 删除 .next 缓存
Write-Host "`n[2/5] 删除 .next 缓存目录..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ .next 缓存已删除" -ForegroundColor Green
} else {
    Write-Host "✓ .next 目录不存在，跳过" -ForegroundColor Gray
}

# 3. 删除 Turbopack 缓存
Write-Host "`n[3/5] 删除 Turbopack 缓存..." -ForegroundColor Yellow
if (Test-Path ".turbo") {
    Remove-Item -Path ".turbo" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ .turbo 缓存已删除" -ForegroundColor Green
} else {
    Write-Host "✓ .turbo 目录不存在，跳过" -ForegroundColor Gray
}

# 4. 验证关键文件
Write-Host "`n[4/5] 验证关键配置文件..." -ForegroundColor Yellow

$files = @(
    "next.config.mjs",
    "src/core/i18n/request.ts",
    "src/core/i18n/config.ts",
    "src/config/locale/index.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✓ $file 存在" -ForegroundColor Green
    } else {
        Write-Host "✗ $file 不存在！" -ForegroundColor Red
    }
}

# 5. 启动开发服务器
Write-Host "`n[5/5] 启动开发服务器..." -ForegroundColor Yellow
Write-Host "执行命令: pnpm dev" -ForegroundColor Cyan
Write-Host "`n提示：服务器启动后，请访问 http://localhost:3000/en 测试" -ForegroundColor Magenta
Write-Host "=== 修复脚本执行完成 ===" -ForegroundColor Green
Write-Host "`n"

# 启动开发服务器
pnpm dev



















