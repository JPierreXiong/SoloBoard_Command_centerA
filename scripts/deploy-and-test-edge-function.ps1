# ============================================
# Edge Function 一键部署和测试脚本（PowerShell 版本）
# 用途：自动部署 Edge Function 并运行测试
# 
# 使用方法：
# .\scripts\deploy-and-test-edge-function.ps1
# ============================================

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 Edge Function 一键部署和测试" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# Step 1: 检查环境
# ============================================
Write-Host "📝 Step 1: 检查环境..." -ForegroundColor Yellow

# 检查 Supabase CLI
try {
    $supabaseVersion = supabase --version 2>&1
    Write-Host "✅ Supabase CLI 已安装: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI 未安装" -ForegroundColor Red
    Write-Host "   请安装: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# 检查环境变量
if (-not $env:SUPABASE_URL) {
    Write-Host "⚠️  SUPABASE_URL 未设置，使用默认值" -ForegroundColor Yellow
    $env:SUPABASE_URL = "https://vkafrwwskupsyibrvcvd.supabase.co"
}

if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "❌ SUPABASE_SERVICE_ROLE_KEY 未设置" -ForegroundColor Red
    Write-Host "   请设置: `$env:SUPABASE_SERVICE_ROLE_KEY='your-key'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 环境变量检查通过" -ForegroundColor Green
Write-Host ""

# ============================================
# Step 2: 设置 Edge Function Secrets
# ============================================
Write-Host "📝 Step 2: 设置 Edge Function Secrets..." -ForegroundColor Yellow

# 检查必要的 Secrets
if ($env:RESEND_API_KEY) {
    supabase secrets set RESEND_API_KEY="$env:RESEND_API_KEY" 2>&1 | Out-Null
    Write-Host "✅ RESEND_API_KEY 已设置" -ForegroundColor Green
} else {
    Write-Host "⚠️  RESEND_API_KEY 未设置，跳过邮件服务配置" -ForegroundColor Yellow
}

if ($env:SHIPANY_API_KEY) {
    supabase secrets set SHIPANY_API_KEY="$env:SHIPANY_API_KEY" 2>&1 | Out-Null
    Write-Host "✅ SHIPANY_API_KEY 已设置" -ForegroundColor Green
} else {
    Write-Host "⚠️  SHIPANY_API_KEY 未设置，跳过 ShipAny 配置" -ForegroundColor Yellow
}

# 设置发件人信息（可选）
if ($env:SHIPANY_SENDER_NAME) {
    supabase secrets set SHIPANY_SENDER_NAME="$env:SHIPANY_SENDER_NAME" 2>&1 | Out-Null
}
if ($env:SHIPANY_SENDER_PHONE) {
    supabase secrets set SHIPANY_SENDER_PHONE="$env:SHIPANY_SENDER_PHONE" 2>&1 | Out-Null
}
if ($env:SHIPANY_SENDER_EMAIL) {
    supabase secrets set SHIPANY_SENDER_EMAIL="$env:SHIPANY_SENDER_EMAIL" 2>&1 | Out-Null
}
if ($env:SHIPANY_SENDER_ADDRESS_LINE1) {
    supabase secrets set SHIPANY_SENDER_ADDRESS_LINE1="$env:SHIPANY_SENDER_ADDRESS_LINE1" 2>&1 | Out-Null
}
if ($env:SHIPANY_SENDER_CITY) {
    supabase secrets set SHIPANY_SENDER_CITY="$env:SHIPANY_SENDER_CITY" 2>&1 | Out-Null
}
if ($env:SHIPANY_SENDER_ZIP_CODE) {
    supabase secrets set SHIPANY_SENDER_ZIP_CODE="$env:SHIPANY_SENDER_ZIP_CODE" 2>&1 | Out-Null
}
if ($env:SHIPANY_SENDER_COUNTRY_CODE) {
    supabase secrets set SHIPANY_SENDER_COUNTRY_CODE="$env:SHIPANY_SENDER_COUNTRY_CODE" 2>&1 | Out-Null
}

Write-Host "✅ Secrets 配置完成" -ForegroundColor Green
Write-Host ""

# ============================================
# Step 3: 部署 Edge Function
# ============================================
Write-Host "📝 Step 3: 部署 Edge Function..." -ForegroundColor Yellow

try {
    supabase functions deploy dead-man-check --no-verify-jwt
    Write-Host "✅ Edge Function 部署成功" -ForegroundColor Green
} catch {
    Write-Host "❌ Edge Function 部署失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# Step 4: 运行测试
# ============================================
Write-Host "📝 Step 4: 运行测试..." -ForegroundColor Yellow
Write-Host ""
Write-Host "请在 Supabase SQL Editor 中执行以下脚本：" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. scripts/one-click-test-asset-release.sql" -ForegroundColor White
Write-Host ""
Write-Host "或者手动执行：" -ForegroundColor Cyan
Write-Host "   - 创建测试数据" -ForegroundColor White
Write-Host "   - 调用 Edge Function" -ForegroundColor White
Write-Host "   - 验证结果" -ForegroundColor White
Write-Host ""

Write-Host "✅ 部署完成！" -ForegroundColor Green
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📋 下一步操作：" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "1. 在 Supabase SQL Editor 中执行测试脚本" -ForegroundColor White
Write-Host "2. 查看 Edge Function 日志验证执行结果" -ForegroundColor White
Write-Host "3. 配置 Cron Job（如果需要自动运行）" -ForegroundColor White
Write-Host ""



