# SoloBoard 快速配置脚本
# 用于创建 .env.local 文件

Write-Host "🚀 SoloBoard 数据库配置向导" -ForegroundColor Cyan
Write-Host ""

# 生成随机密钥
function Generate-Secret {
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# 检查 .env.local 是否存在
if (Test-Path ".env.local") {
    Write-Host "⚠️  .env.local 文件已存在" -ForegroundColor Yellow
    $overwrite = Read-Host "是否覆盖? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ 已取消" -ForegroundColor Red
        exit
    }
}

Write-Host ""
Write-Host "选择数据库类型:" -ForegroundColor Green
Write-Host "1. SQLite (推荐用于本地开发)"
Write-Host "2. PostgreSQL (推荐用于生产)"
Write-Host "3. Turso (云 SQLite)"
Write-Host ""

$choice = Read-Host "请选择 (1-3)"

$authSecret = Generate-Secret
Write-Host ""
Write-Host "✅ 已生成 AUTH_SECRET: $authSecret" -ForegroundColor Green

$envContent = @"
# ============================================
# SoloBoard 配置文件
# 自动生成于: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ============================================

# 应用基础配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=SoloBoard
NEXT_PUBLIC_THEME=default
NEXT_PUBLIC_APPEARANCE=system
NEXT_PUBLIC_DEFAULT_LOCALE=en

# 认证配置
AUTH_URL=http://localhost:3000
AUTH_SECRET=$authSecret

"@

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "📦 配置 SQLite 数据库..." -ForegroundColor Cyan
        $envContent += @"
# 数据库配置 - SQLite
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./local.db
DB_SINGLETON_ENABLED=true

"@
    }
    "2" {
        Write-Host ""
        Write-Host "🐘 配置 PostgreSQL 数据库..." -ForegroundColor Cyan
        $dbHost = Read-Host "数据库主机 (默认: localhost)"
        if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "localhost" }
        
        $dbPort = Read-Host "数据库端口 (默认: 5432)"
        if ([string]::IsNullOrWhiteSpace($dbPort)) { $dbPort = "5432" }
        
        $dbName = Read-Host "数据库名称 (默认: soloboard)"
        if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "soloboard" }
        
        $dbUser = Read-Host "数据库用户名"
        $dbPass = Read-Host "数据库密码" -AsSecureString
        $dbPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPass)
        )
        
        $envContent += @"
# 数据库配置 - PostgreSQL
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://${dbUser}:${dbPassPlain}@${dbHost}:${dbPort}/${dbName}
DB_SINGLETON_ENABLED=true

"@
    }
    "3" {
        Write-Host ""
        Write-Host "☁️  配置 Turso 数据库..." -ForegroundColor Cyan
        $tursoUrl = Read-Host "Turso 数据库 URL (libsql://...)"
        $tursoToken = Read-Host "Turso 认证令牌"
        
        $envContent += @"
# 数据库配置 - Turso
DATABASE_PROVIDER=turso
DATABASE_URL=$tursoUrl
DATABASE_AUTH_TOKEN=$tursoToken
DB_SINGLETON_ENABLED=true

"@
    }
    default {
        Write-Host "❌ 无效选择" -ForegroundColor Red
        exit
    }
}

$envContent += @"
# ============================================
# 可选服务 (不影响核心功能)
# ============================================

# Supabase (如果使用)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# ShipAny (支付集成)
SHIPANY_API_KEY=
SHIPANY_MERCHANDISE_ID=

# Resend (邮件服务)
RESEND_API_KEY=

# Google OAuth (可选)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub OAuth (可选)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
"@

# 写入文件
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host ""
Write-Host "✅ .env.local 文件已创建！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 下一步操作:" -ForegroundColor Cyan
Write-Host "1. 运行数据库迁移: pnpm db:push"
Write-Host "2. 启动开发服务器: pnpm dev"
Write-Host "3. 访问: http://localhost:3000/sign-up"
Write-Host ""

# 询问是否立即运行数据库迁移
$runMigration = Read-Host "是否立即运行数据库迁移? (Y/n)"
if ($runMigration -ne "n" -and $runMigration -ne "N") {
    Write-Host ""
    Write-Host "🔄 运行数据库迁移..." -ForegroundColor Cyan
    pnpm db:push
    
    Write-Host ""
    Write-Host "✅ 配置完成！" -ForegroundColor Green
    Write-Host ""
    Write-Host "现在可以启动服务器: pnpm dev" -ForegroundColor Yellow
}









