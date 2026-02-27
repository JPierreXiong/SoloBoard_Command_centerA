# Creem Webhook 测试脚本 (PowerShell)
# 用途：测试用户店铺监控 Webhook (/api/webhooks/creem)
# 
# 注意：这不是测试 SoloBoard 收款的 Webhook
# SoloBoard 收款 Webhook 在: /api/payment/notify/creem

# ============================================
# 配置区域
# ============================================

# 你的 SoloBoard 域名
$SOLOBOARD_URL = "https://soloboard-command-center-b.vercel.app"

# Webhook Secret
$WEBHOOK_SECRET = "+GzfvXVFt2HFVY0PzU1YcaY74exEdOMO/Mp7mPH8sxI="

# 测试用的 Site ID (需要从你的数据库中获取)
# 运行前请先在 SoloBoard 中添加一个站点，然后填写这里
$SITE_ID = "your-site-id-here"

# ============================================
# 测试脚本
# ============================================

Write-Host "🧪 开始测试 Creem Webhook..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📍 目标 URL: $SOLOBOARD_URL/api/webhooks/creem" -ForegroundColor Yellow
Write-Host "🔑 使用 Secret: $($WEBHOOK_SECRET.Substring(0,20))..." -ForegroundColor Yellow
Write-Host "🆔 Site ID: $SITE_ID" -ForegroundColor Yellow
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# 测试 1: GET 请求（检查端点是否存在）
Write-Host "📡 测试 1: 检查 Webhook 端点是否存在..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$SOLOBOARD_URL/api/webhooks/creem" -Method Get
    Write-Host "响应: $($response | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "错误: $_" -ForegroundColor Red
}
Write-Host ""

# 测试 2: POST 请求（模拟订单完成）
Write-Host "📡 测试 2: 模拟订单完成事件..." -ForegroundColor Cyan

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$isoDate = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")

$body = @{
    event_type = "order.completed"
    data = @{
        order_id = "test_order_$timestamp"
        site_id = $SITE_ID
        amount = 99.00
        currency = "USD"
        customer_email = "test@example.com"
        status = "completed"
        created_at = $isoDate
    }
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "x-creem-signature" = $WEBHOOK_SECRET
}

try {
    $response = Invoke-RestMethod -Uri "$SOLOBOARD_URL/api/webhooks/creem" -Method Post -Headers $headers -Body $body
    Write-Host "HTTP 状态码: 200" -ForegroundColor Green
    Write-Host "响应内容: $($response | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "HTTP 状态码: $statusCode" -ForegroundColor Red
    Write-Host "错误: $_" -ForegroundColor Red
}
Write-Host ""

# 测试 3: 错误的签名（应该返回 401）
Write-Host "📡 测试 3: 测试错误的签名（应该返回 401）..." -ForegroundColor Cyan

$body = @{
    event_type = "order.completed"
    data = @{
        order_id = "test_order_invalid"
        amount = 50.00
        currency = "USD"
        customer_email = "test@example.com"
        status = "completed"
        created_at = $isoDate
    }
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "x-creem-signature" = "wrong-secret"
}

try {
    $response = Invoke-RestMethod -Uri "$SOLOBOARD_URL/api/webhooks/creem" -Method Post -Headers $headers -Body $body
    Write-Host "HTTP 状态码: 200" -ForegroundColor Red
    Write-Host "❌ 测试失败: 错误签名应该返回 401" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "HTTP 状态码: 401" -ForegroundColor Green
        Write-Host "✅ 测试通过: 错误签名被正确拒绝" -ForegroundColor Green
    } else {
        Write-Host "HTTP 状态码: $statusCode" -ForegroundColor Red
        Write-Host "❌ 测试失败: 应该返回 401" -ForegroundColor Red
    }
}
Write-Host ""

# ============================================
# 结果总结
# ============================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📊 测试结果总结" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 下一步:" -ForegroundColor Yellow
Write-Host "1. 检查 Vercel 日志: https://vercel.com/your-project/logs"
Write-Host "2. 检查数据库中的 site_metrics_daily 表是否有新记录"
Write-Host "3. 访问 Dashboard 查看收入是否更新"
Write-Host ""
Write-Host "🔗 相关链接:" -ForegroundColor Yellow
Write-Host "   - Dashboard: $SOLOBOARD_URL/soloboard"
Write-Host "   - Webhook 端点: $SOLOBOARD_URL/api/webhooks/creem"
Write-Host ""

# ============================================
# 快速测试命令（复制粘贴使用）
# ============================================

Write-Host "📋 快速测试命令（如果需要手动测试）:" -ForegroundColor Cyan
Write-Host ""
Write-Host @"
# 使用 curl (如果已安装)
curl -X POST $SOLOBOARD_URL/api/webhooks/creem \`
  -H "Content-Type: application/json" \`
  -H "x-creem-signature: $WEBHOOK_SECRET" \`
  -d '{
    "event_type": "order.completed",
    "data": {
      "order_id": "test_order_12345",
      "site_id": "$SITE_ID",
      "amount": 99.00,
      "currency": "USD",
      "customer_email": "test@example.com",
      "status": "completed",
      "created_at": "$isoDate"
    }
  }'
"@ -ForegroundColor Gray
Write-Host ""

