# SoloBoard 数据库初始化脚本
# 使用方法: .\init-database.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  SoloBoard 数据库初始化工具" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 检查 SQL 文件是否存在
$sqlFile = "src\config\db\migrations\0000_lush_scalphunter.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "错误: 找不到 SQL 文件: $sqlFile" -ForegroundColor Red
    Write-Host "请先运行: npm run db:generate" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ 找到 SQL 文件: $sqlFile" -ForegroundColor Green
Write-Host ""

# 显示数据库信息
Write-Host "数据库信息:" -ForegroundColor Cyan
Write-Host "  主机: ep-mute-smoke-ainrvel2-pooler.c-4.us-east-1.aws.neon.tech"
Write-Host "  数据库: neondb"
Write-Host "  用户: neondb_owner"
Write-Host ""

# 提供三种初始化方法
Write-Host "请选择初始化方法:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 使用 Drizzle Kit 自动推送 (推荐)" -ForegroundColor Green
Write-Host "   命令: npm run db:push"
Write-Host ""
Write-Host "2. 在 Neon 控制台手动执行" -ForegroundColor Yellow
Write-Host "   步骤:"
Write-Host "   a. 访问 https://console.neon.tech/"
Write-Host "   b. 打开 SQL Editor"
Write-Host "   c. 复制 $sqlFile 的内容"
Write-Host "   d. 粘贴并执行"
Write-Host ""
Write-Host "3. 使用 psql 命令行工具" -ForegroundColor Cyan
Write-Host "   命令:"
Write-Host '   $env:PGPASSWORD="npg_au5XJdonk1Es"'
Write-Host "   psql -h ep-mute-smoke-ainrvel2-pooler.c-4.us-east-1.aws.neon.tech \"
Write-Host "        -U neondb_owner -d neondb -f `"$sqlFile`""
Write-Host ""

# 询问用户选择
$choice = Read-Host "请输入选项 (1/2/3) 或按 Enter 跳过"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "正在执行: npm run db:push" -ForegroundColor Cyan
        Write-Host ""
        npm run db:push
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✓ 数据库初始化成功！" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "✗ 初始化失败，请尝试方法 2 或 3" -ForegroundColor Red
        }
    }
    "2" {
        Write-Host ""
        Write-Host "正在打开 SQL 文件..." -ForegroundColor Cyan
        notepad $sqlFile
        Write-Host ""
        Write-Host "请在 Neon 控制台执行 SQL 文件内容" -ForegroundColor Yellow
        Write-Host "控制台地址: https://console.neon.tech/" -ForegroundColor Cyan
    }
    "3" {
        Write-Host ""
        Write-Host "正在使用 psql 执行..." -ForegroundColor Cyan
        $env:PGPASSWORD = "npg_au5XJdonk1Es"
        psql -h ep-mute-smoke-ainrvel2-pooler.c-4.us-east-1.aws.neon.tech `
             -U neondb_owner `
             -d neondb `
             -f $sqlFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✓ 数据库初始化成功！" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "✗ psql 命令失败，请确保已安装 PostgreSQL 客户端" -ForegroundColor Red
            Write-Host "或使用方法 1 或 2" -ForegroundColor Yellow
        }
    }
    default {
        Write-Host ""
        Write-Host "已跳过自动初始化" -ForegroundColor Yellow
        Write-Host "请参考 DATABASE_INIT_GUIDE.md 手动初始化" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "详细文档: DATABASE_INIT_GUIDE.md" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan























