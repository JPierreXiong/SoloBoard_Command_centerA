# SoloBoard - 更新 Neon 数据库配置

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SoloBoard - 更新数据库配置" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location D:\AIsoftware\soloboard

# 读取现有的 .env.local
$envContent = Get-Content .env.local -Raw

# 替换数据库 URL
$newDatabaseUrl = "DATABASE_URL=postgresql://neondb_owner:npg_au5XJdonk1Es@ep-mute-smoke-ainrvel2-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"

# 使用正则表达式替换
$envContent = $envContent -replace 'DATABASE_URL=.*', $newDatabaseUrl

# 如果没有 DATABASE_URL_UNPOOLED，添加它
if ($envContent -notmatch 'DATABASE_URL_UNPOOLED') {
    $envContent += "`n# For uses requiring a connection without pgbouncer`n"
    $envContent += "DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_au5XJdonk1Es@ep-mute-smoke-ainrvel2.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require`n"
}

# 写回文件
$envContent | Set-Content .env.local -NoNewline

Write-Host "✅ 数据库配置已更新为 Neon 数据库" -ForegroundColor Green
Write-Host ""
Write-Host "数据库信息:" -ForegroundColor Yellow
Write-Host "  Host: ep-mute-smoke-ainrvel2-pooler.c-4.us-east-1.aws.neon.tech" -ForegroundColor White
Write-Host "  Database: neondb" -ForegroundColor White
Write-Host "  User: neondb_owner" -ForegroundColor White
Write-Host ""
Write-Host "下一步:" -ForegroundColor Yellow
Write-Host "  1. 运行数据库迁移: pnpm db:push" -ForegroundColor White
Write-Host "  2. 启动开发服务器: pnpm dev" -ForegroundColor White
Write-Host ""
























