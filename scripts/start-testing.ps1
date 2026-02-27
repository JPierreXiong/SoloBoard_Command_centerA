# Phase 4-7 测试启动脚本
# PowerShell 脚本，用于快速启动测试

Write-Host "🚀 Phase 4-7 测试启动脚本" -ForegroundColor Cyan
Write-Host ""

# 步骤 1: 获取测试数据
Write-Host "📋 步骤 1: 获取测试数据" -ForegroundColor Yellow
Write-Host ""
Write-Host "请在 Supabase SQL Editor 中执行以下查询:" -ForegroundColor White
Write-Host ""
Write-Host "-- 获取 Free 用户的 Vault ID" -ForegroundColor Gray
Write-Host "SELECT id, `"planLevel`" FROM digital_vaults WHERE `"planLevel`" = 'free' LIMIT 1;" -ForegroundColor Green
Write-Host ""
Write-Host "-- 获取有效的 Release Token" -ForegroundColor Gray
Write-Host "SELECT id, `"releaseToken`" FROM beneficiaries WHERE `"releaseToken`" IS NOT NULL LIMIT 1;" -ForegroundColor Green
Write-Host ""

# 步骤 2: 设置环境变量
Write-Host "📋 步骤 2: 设置环境变量" -ForegroundColor Yellow
Write-Host ""
$vaultId = Read-Host "请输入 Vault ID (或按 Enter 跳过)"
$releaseToken = Read-Host "请输入 Release Token (或按 Enter 跳过)"

if ($vaultId) {
    $env:TEST_VAULT_ID = $vaultId
    Write-Host "✅ TEST_VAULT_ID 已设置: $vaultId" -ForegroundColor Green
} else {
    Write-Host "⚠️  TEST_VAULT_ID 未设置，将跳过 Phase 4 测试" -ForegroundColor Yellow
}

if ($releaseToken) {
    $env:TEST_RELEASE_TOKEN = $releaseToken
    Write-Host "✅ TEST_RELEASE_TOKEN 已设置: $releaseToken" -ForegroundColor Green
} else {
    Write-Host "⚠️  TEST_RELEASE_TOKEN 未设置，将跳过 Phase 6 测试" -ForegroundColor Yellow
}

Write-Host ""

# 步骤 3: 选择测试方式
Write-Host "📋 步骤 3: 选择测试方式" -ForegroundColor Yellow
Write-Host ""
Write-Host "请选择测试方式:" -ForegroundColor White
Write-Host "  A) 快速测试脚本 (推荐)" -ForegroundColor Cyan
Write-Host "  B) API 测试 (需要开发服务器)" -ForegroundColor Cyan
Write-Host "  C) UI 测试 (需要开发服务器)" -ForegroundColor Cyan
Write-Host "  D) 全部测试" -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "请输入选项 (A/B/C/D)"

switch ($choice.ToUpper()) {
    "A" {
        Write-Host ""
        Write-Host "🚀 运行快速测试脚本..." -ForegroundColor Cyan
        Write-Host ""
        npx tsx scripts/test-phase-4-7.ts
    }
    "B" {
        Write-Host ""
        Write-Host "🌐 启动开发服务器进行 API 测试..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "开发服务器将在后台启动..." -ForegroundColor Yellow
        Write-Host "请在新终端窗口中使用 Postman 或 PowerShell 测试 API" -ForegroundColor Yellow
        Write-Host "参考文档: TESTING_API_EXAMPLES.md" -ForegroundColor Yellow
        Write-Host ""
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
    }
    "C" {
        Write-Host ""
        Write-Host "🎨 启动开发服务器进行 UI 测试..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "开发服务器将在后台启动..." -ForegroundColor Yellow
        Write-Host "请在浏览器中访问: http://localhost:3000" -ForegroundColor Yellow
        Write-Host ""
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
        Start-Sleep -Seconds 3
        Write-Host "正在打开浏览器..." -ForegroundColor Yellow
        if ($releaseToken) {
            Start-Process "http://localhost:3000/en/inherit/$releaseToken"
        } else {
            Start-Process "http://localhost:3000"
        }
    }
    "D" {
        Write-Host ""
        Write-Host "🚀 运行全部测试..." -ForegroundColor Cyan
        Write-Host ""
        
        # 先运行快速测试
        Write-Host "1️⃣ 运行快速测试脚本..." -ForegroundColor Yellow
        npx tsx scripts/test-phase-4-7.ts
        
        Write-Host ""
        Write-Host "2️⃣ 启动开发服务器..." -ForegroundColor Yellow
        Write-Host "   开发服务器将在后台启动" -ForegroundColor Gray
        Write-Host "   请在新终端窗口中进行 API/UI 测试" -ForegroundColor Gray
        Write-Host ""
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
    }
    default {
        Write-Host "❌ 无效选项，请重新运行脚本" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ 测试启动完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 测试文档:" -ForegroundColor Cyan
Write-Host "   - TESTING_EXECUTION_GUIDE.md" -ForegroundColor Gray
Write-Host "   - TESTING_API_EXAMPLES.md" -ForegroundColor Gray
Write-Host "   - TESTING_CHECKLIST.md" -ForegroundColor Gray
Write-Host ""
