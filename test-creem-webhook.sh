#!/bin/bash

# Creem Webhook 测试脚本
# 用途：测试用户店铺监控 Webhook (/api/webhooks/creem)
# 
# 注意：这不是测试 SoloBoard 收款的 Webhook
# SoloBoard 收款 Webhook 在: /api/payment/notify/creem

# ============================================
# 配置区域
# ============================================

# 你的 SoloBoard 域名
SOLOBOARD_URL="https://soloboard-command-center-b.vercel.app"

# Webhook Secret (从环境变量中获取，或直接填写)
WEBHOOK_SECRET="${CREEM_WEBHOOK_SECRET:-+GzfvXVFt2HFVY0PzU1YcaY74exEdOMO/Mp7mPH8sxI=}"

# 测试用的 Site ID (需要从你的数据库中获取)
# 运行前请先在 SoloBoard 中添加一个站点，然后填写这里
SITE_ID="your-site-id-here"

# ============================================
# 测试脚本
# ============================================

echo "🧪 开始测试 Creem Webhook..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 目标 URL: ${SOLOBOARD_URL}/api/webhooks/creem"
echo "🔑 使用 Secret: ${WEBHOOK_SECRET:0:20}..."
echo "🆔 Site ID: ${SITE_ID}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 测试 1: GET 请求（检查端点是否存在）
echo "📡 测试 1: 检查 Webhook 端点是否存在..."
response=$(curl -s -X GET "${SOLOBOARD_URL}/api/webhooks/creem")
echo "响应: ${response}"
echo ""

# 测试 2: POST 请求（模拟订单完成）
echo "📡 测试 2: 模拟订单完成事件..."
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${SOLOBOARD_URL}/api/webhooks/creem" \
  -H "Content-Type: application/json" \
  -H "x-creem-signature: ${WEBHOOK_SECRET}" \
  -d "{
    \"event_type\": \"order.completed\",
    \"data\": {
      \"order_id\": \"test_order_$(date +%s)\",
      \"site_id\": \"${SITE_ID}\",
      \"amount\": 99.00,
      \"currency\": \"USD\",
      \"customer_email\": \"test@example.com\",
      \"status\": \"completed\",
      \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }
  }")

# 提取 HTTP 状态码
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

echo "HTTP 状态码: ${http_code}"
echo "响应内容: ${body}"
echo ""

# 测试 3: 错误的签名（应该返回 401）
echo "📡 测试 3: 测试错误的签名（应该返回 401）..."
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${SOLOBOARD_URL}/api/webhooks/creem" \
  -H "Content-Type: application/json" \
  -H "x-creem-signature: wrong-secret" \
  -d "{
    \"event_type\": \"order.completed\",
    \"data\": {
      \"order_id\": \"test_order_invalid\",
      \"amount\": 50.00,
      \"currency\": \"USD\",
      \"customer_email\": \"test@example.com\",
      \"status\": \"completed\",
      \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }
  }")

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

echo "HTTP 状态码: ${http_code}"
echo "响应内容: ${body}"
echo ""

# ============================================
# 结果判断
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 测试结果总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [[ "$http_code" == "401" ]]; then
  echo "✅ 测试 3 通过: 错误签名被正确拒绝"
else
  echo "❌ 测试 3 失败: 错误签名应该返回 401"
fi

echo ""
echo "💡 下一步:"
echo "1. 检查 Vercel 日志: https://vercel.com/your-project/logs"
echo "2. 检查数据库中的 site_metrics_daily 表是否有新记录"
echo "3. 访问 Dashboard 查看收入是否更新"
echo ""
echo "🔗 相关链接:"
echo "   - Dashboard: ${SOLOBOARD_URL}/soloboard"
echo "   - Webhook 端点: ${SOLOBOARD_URL}/api/webhooks/creem"
echo ""

