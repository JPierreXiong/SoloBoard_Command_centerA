# 设置 .env.local 文件的 PowerShell 脚本
# 基于 env.digital-heirloom.example.txt 创建基本配置

$projectRoot = Split-Path -Parent $PSScriptRoot
$envLocalPath = Join-Path $projectRoot ".env.local"
$examplePath = Join-Path $projectRoot "env.digital-heirloom.example.txt"

Write-Host "🔧 设置 .env.local 文件..." -ForegroundColor Cyan

# 检查示例文件是否存在
if (-not (Test-Path $examplePath)) {
    Write-Host "❌ 找不到示例文件: $examplePath" -ForegroundColor Red
    exit 1
}

# 如果 .env.local 已存在，询问是否覆盖
if (Test-Path $envLocalPath) {
    $response = Read-Host ".env.local 已存在，是否覆盖？(y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "已取消操作" -ForegroundColor Yellow
        exit 0
    }
}

# 读取示例文件
$content = Get-Content $examplePath -Raw

# 生成 AUTH_SECRET（如果还没有）
if ($content -notmatch "AUTH_SECRET=.*[a-zA-Z0-9]{20,}") {
    # 生成一个随机的 base64 字符串
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    $authSecret = [Convert]::ToBase64String($bytes)
    $content = $content -replace "AUTH_SECRET=.*", "AUTH_SECRET=$authSecret"
    Write-Host "✅ 已生成新的 AUTH_SECRET" -ForegroundColor Green
}

# 确保 SHIPANY_API_KEY 和 SHIPANY_MERCHANDISE_ID 有值
if ($content -notmatch "SHIPANY_API_KEY=.*[a-zA-Z0-9-]{20,}") {
    $content = $content -replace "SHIPANY_API_KEY=.*", "SHIPANY_API_KEY=e50e2b3d-a412-4f90-95eb-aafc9837b9ea"
    Write-Host "✅ 已设置 SHIPANY_API_KEY" -ForegroundColor Green
}

if ($content -notmatch "SHIPANY_MERCHANDISE_ID=.*[a-zA-Z0-9-]{20,}") {
    $content = $content -replace "SHIPANY_MERCHANDISE_ID=.*", "SHIPANY_MERCHANDISE_ID=1955cf99-daf3-4587-a698-2c28ea9180cc"
    Write-Host "✅ 已设置 SHIPANY_MERCHANDISE_ID" -ForegroundColor Green
}

# 写入 .env.local
$content | Out-File -FilePath $envLocalPath -Encoding utf8 -NoNewline

Write-Host ""
Write-Host "✅ .env.local 文件已创建/更新: $envLocalPath" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  请检查并更新以下必需变量:" -ForegroundColor Yellow
Write-Host "   - DATABASE_URL (数据库连接字符串)" -ForegroundColor Yellow
Write-Host "   - NEXT_PUBLIC_APP_URL (应用 URL)" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 可选变量（根据需要使用）:" -ForegroundColor Cyan
Write-Host "   - RESEND_API_KEY (邮件服务)" -ForegroundColor Cyan
Write-Host "   - NEXT_PUBLIC_SUPABASE_URL (Supabase 配置)" -ForegroundColor Cyan
Write-Host ""
