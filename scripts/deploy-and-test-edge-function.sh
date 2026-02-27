#!/bin/bash

# ============================================
# Edge Function 一键部署和测试脚本
# 用途：自动部署 Edge Function 并运行测试
# 
# 使用方法：
# chmod +x scripts/deploy-and-test-edge-function.sh
# ./scripts/deploy-and-test-edge-function.sh
# ============================================

set -e  # 遇到错误立即退出

echo "=========================================="
echo "🚀 Edge Function 一键部署和测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================
# Step 1: 检查环境
# ============================================
echo "📝 Step 1: 检查环境..."

# 检查 Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI 未安装${NC}"
    echo "   请安装: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI 已安装${NC}"

# 检查环境变量
if [ -z "$SUPABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_URL 未设置，使用默认值${NC}"
    export SUPABASE_URL="https://vkafrwwskupsyibrvcvd.supabase.co"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_SERVICE_ROLE_KEY 未设置${NC}"
    echo "   请设置: export SUPABASE_SERVICE_ROLE_KEY=your-key"
    exit 1
fi

echo -e "${GREEN}✅ 环境变量检查通过${NC}"
echo ""

# ============================================
# Step 2: 设置 Edge Function Secrets
# ============================================
echo "📝 Step 2: 设置 Edge Function Secrets..."

# 检查必要的 Secrets
if [ -z "$RESEND_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  RESEND_API_KEY 未设置，跳过邮件服务配置${NC}"
else
    supabase secrets set RESEND_API_KEY="$RESEND_API_KEY" || echo -e "${YELLOW}⚠️  设置 RESEND_API_KEY 失败（可能已存在）${NC}"
fi

if [ -z "$SHIPANY_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  SHIPANY_API_KEY 未设置，跳过 ShipAny 配置${NC}"
else
    supabase secrets set SHIPANY_API_KEY="$SHIPANY_API_KEY" || echo -e "${YELLOW}⚠️  设置 SHIPANY_API_KEY 失败（可能已存在）${NC}"
fi

# 设置发件人信息（可选）
if [ ! -z "$SHIPANY_SENDER_NAME" ]; then
    supabase secrets set SHIPANY_SENDER_NAME="$SHIPANY_SENDER_NAME" || true
fi
if [ ! -z "$SHIPANY_SENDER_PHONE" ]; then
    supabase secrets set SHIPANY_SENDER_PHONE="$SHIPANY_SENDER_PHONE" || true
fi
if [ ! -z "$SHIPANY_SENDER_EMAIL" ]; then
    supabase secrets set SHIPANY_SENDER_EMAIL="$SHIPANY_SENDER_EMAIL" || true
fi
if [ ! -z "$SHIPANY_SENDER_ADDRESS_LINE1" ]; then
    supabase secrets set SHIPANY_SENDER_ADDRESS_LINE1="$SHIPANY_SENDER_ADDRESS_LINE1" || true
fi
if [ ! -z "$SHIPANY_SENDER_CITY" ]; then
    supabase secrets set SHIPANY_SENDER_CITY="$SHIPANY_SENDER_CITY" || true
fi
if [ ! -z "$SHIPANY_SENDER_ZIP_CODE" ]; then
    supabase secrets set SHIPANY_SENDER_ZIP_CODE="$SHIPANY_SENDER_ZIP_CODE" || true
fi
if [ ! -z "$SHIPANY_SENDER_COUNTRY_CODE" ]; then
    supabase secrets set SHIPANY_SENDER_COUNTRY_CODE="$SHIPANY_SENDER_COUNTRY_CODE" || true
fi

echo -e "${GREEN}✅ Secrets 配置完成${NC}"
echo ""

# ============================================
# Step 3: 部署 Edge Function
# ============================================
echo "📝 Step 3: 部署 Edge Function..."

if supabase functions deploy dead-man-check --no-verify-jwt; then
    echo -e "${GREEN}✅ Edge Function 部署成功${NC}"
else
    echo -e "${RED}❌ Edge Function 部署失败${NC}"
    exit 1
fi

echo ""

# ============================================
# Step 4: 运行测试
# ============================================
echo "📝 Step 4: 运行测试..."
echo ""
echo "请在 Supabase SQL Editor 中执行以下脚本："
echo ""
echo "1. scripts/one-click-test-asset-release.sql"
echo ""
echo "或者手动执行："
echo ""
echo "   - 创建测试数据"
echo "   - 调用 Edge Function"
echo "   - 验证结果"
echo ""

echo -e "${GREEN}✅ 部署完成！${NC}"
echo ""
echo "=========================================="
echo "📋 下一步操作："
echo "=========================================="
echo "1. 在 Supabase SQL Editor 中执行测试脚本"
echo "2. 查看 Edge Function 日志验证执行结果"
echo "3. 配置 Cron Job（如果需要自动运行）"
echo ""



