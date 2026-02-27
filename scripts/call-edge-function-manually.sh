#!/bin/bash

# ============================================
# 手动调用 Edge Function 脚本
# 用途：当 pg_net 扩展未启用时，使用 curl 调用 Edge Function
# 
# 使用方法：
# chmod +x scripts/call-edge-function-manually.sh
# ./scripts/call-edge-function-manually.sh
# ============================================

# 配置
SUPABASE_URL="${SUPABASE_URL:-https://vkafrwwskupsyibrvcvd.supabase.co}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [ -z "$SERVICE_ROLE_KEY" ]; then
    echo "❌ 错误: SUPABASE_SERVICE_ROLE_KEY 未设置"
    echo "   请设置: export SUPABASE_SERVICE_ROLE_KEY=your-key"
    exit 1
fi

EDGE_FUNCTION_URL="${SUPABASE_URL}/functions/v1/dead-man-check"

echo "=========================================="
echo "🚀 调用 Edge Function: dead-man-check"
echo "=========================================="
echo ""
echo "URL: $EDGE_FUNCTION_URL"
echo ""

# 调用 Edge Function
response=$(curl -s -w "\n%{http_code}" -X POST "$EDGE_FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -d '{}')

# 分离响应体和状态码
http_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | sed '$d')

echo "HTTP 状态码: $http_code"
echo ""
echo "响应内容:"
echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
echo ""

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 202 ]; then
    echo "✅ Edge Function 调用成功"
    echo ""
    echo "💡 提示: 等待 5-10 秒后，在 Supabase SQL Editor 中执行验证查询"
else
    echo "❌ Edge Function 调用失败"
    echo ""
    echo "请检查:"
    echo "1. Edge Function 是否已部署"
    echo "2. SERVICE_ROLE_KEY 是否正确"
    echo "3. Edge Function 日志中的错误信息"
fi



