# 提交到 GitHub 脚本

Write-Host "================================" -ForegroundColor Cyan
Write-Host "提交代码到 GitHub" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 添加所有文件
Write-Host "添加文件..." -ForegroundColor Yellow
git add .

# 提交
Write-Host "提交更改..." -ForegroundColor Yellow
git commit -m "fix: 修复认证系统数据库连接和页面跳转问题

主要修复:
1. Better Auth 数据库连接
   - 添加 drizzleAdapter 到 authOptions
   - 确保 session 存储在 PostgreSQL
   - 修复 'Using memory adapter' 警告

2. 登录/注册页面跳转
   - 改用 router.push() 替代 window.location.href
   - 添加成功提示和延迟
   - 改进用户体验

3. Dashboard 访问修复
   - 修复 500 错误
   - 确保 session 正确验证
   - 支持页面刷新后保持登录

测试结果:
- ✅ 用户注册: 通过
- ✅ 用户登录: 通过
- ✅ Dashboard 访问: 通过
- ✅ 定价页面: 通过

不改变 ShipAny 原有结构，仅局部修复认证系统。"

# 推送到 GitHub
Write-Host "推送到 GitHub..." -ForegroundColor Yellow
git push origin master

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ 提交完成！" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green




