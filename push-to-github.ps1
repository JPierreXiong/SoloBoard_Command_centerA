# ============================================
# GitHub 上传脚本
# ============================================

Write-Host "开始上传到 GitHub..." -ForegroundColor Green

# 检查是否在正确的目录
if (-not (Test-Path ".git")) {
    Write-Host "错误: 当前目录不是 Git 仓库" -ForegroundColor Red
    exit 1
}

# 显示当前状态
Write-Host "`n当前 Git 状态:" -ForegroundColor Yellow
git status

# 推送到 GitHub
Write-Host "`n正在推送到 GitHub..." -ForegroundColor Yellow
git push -u origin master

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ 成功上传到 GitHub!" -ForegroundColor Green
    Write-Host "仓库地址: https://github.com/JPierreXiong/SoloBoard_Command_centerA" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ 上传失败" -ForegroundColor Red
    Write-Host "`n可能的解决方案:" -ForegroundColor Yellow
    Write-Host "1. 检查网络连接" -ForegroundColor White
    Write-Host "2. 配置 Git 代理:" -ForegroundColor White
    Write-Host "   git config --global http.proxy http://127.0.0.1:7890" -ForegroundColor Gray
    Write-Host "   git config --global https.proxy http://127.0.0.1:7890" -ForegroundColor Gray
    Write-Host "3. 或使用 SSH 方式:" -ForegroundColor White
    Write-Host "   git remote set-url origin git@github.com:JPierreXiong/SoloBoard_Command_centerA.git" -ForegroundColor Gray
    Write-Host "   git push -u origin master" -ForegroundColor Gray
}

Write-Host "`n按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


