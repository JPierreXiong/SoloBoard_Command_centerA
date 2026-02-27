# ============================================
# Creem Payment Configuration for Vercel
# ============================================
# 复制以下环境变量到 Vercel Dashboard
# Project: soloboard-command-center-b
# Settings > Environment Variables
# ============================================

## 环境变量配置

### 1. Creem API Key (测试环境)
```
CREEM_API_KEY=creem_test_5JeYAJ7l8MEVmScHKMLnHZ
```

### 2. Creem Environment
```
CREEM_ENVIRONMENT=sandbox
```

### 3. Creem Webhook 配置
```
CREEM_WEBHOOK_URL=https://soloboard-command-center-b.vercel.app/api/webhooks/creem
CREEM_WEBHOOK_SECRET=whsec_6MzmusMOCJe420udLkejHe
CREEM_SIGNING_SECRET=whsec_6MzmusMOCJe420udLkejHe
```

### 4. Creem Product IDs Mapping

#### Base Plan - $19.9 USD
```
CREEM_PRODUCT_ID_BASE=prod_3i3wLrjX9sQiwts95zv1FG
```

#### Pro Plan - $39.9 USD
```
CREEM_PRODUCT_ID_PRO=prod_n1rGx5cxwauihvqwWRHxi
```

### 5. Payment Provider Settings
```
CREEM_ENABLED=true
DEFAULT_PAYMENT_PROVIDER=creem
```

### 6. Creem Product IDs JSON Mapping (可选)
```
CREEM_PRODUCT_IDS={"soloboard_base":"prod_3i3wLrjX9sQiwts95zv1FG","soloboard_pro":"prod_n1rGx5cxwauihvqwWRHxi"}
```

## Vercel CLI 配置命令

```bash
# Creem API Key
vercel env add CREEM_API_KEY production
# 输入: creem_test_5JeYAJ7l8MEVmScHKMLnHZ

# Creem Environment
vercel env add CREEM_ENVIRONMENT production
# 输入: sandbox

# Creem Webhook Configuration
vercel env add CREEM_WEBHOOK_URL production
# 输入: https://soloboard-command-center-b.vercel.app/api/webhooks/creem

vercel env add CREEM_WEBHOOK_SECRET production
# 输入: whsec_6MzmusMOCJe420udLkejHe

# Creem Signing Secret
vercel env add CREEM_SIGNING_SECRET production
# 输入: whsec_6MzmusMOCJe420udLkejHe

# Base Plan Product ID
vercel env add CREEM_PRODUCT_ID_BASE production
# 输入: prod_3i3wLrjX9sQiwts95zv1FG

# Pro Plan Product ID
vercel env add CREEM_PRODUCT_ID_PRO production
# 输入: prod_n1rGx5cxwauihvqwWRHxi

# Enable Creem
vercel env add CREEM_ENABLED production
# 输入: true

# Default Payment Provider
vercel env add DEFAULT_PAYMENT_PROVIDER production
# 输入: creem

# Product IDs JSON
vercel env add CREEM_PRODUCT_IDS production
# 输入: {"soloboard_base":"prod_3i3wLrjX9sQiwts95zv1FG","soloboard_pro":"prod_n1rGx5cxwauihvqwWRHxi"}
```

## 测试链接

- Base Plan: https://www.creem.io/test/payment/prod_3i3wLrjX9sQiwts95zv1FG
- Pro Plan: https://www.creem.io/test/payment/prod_n1rGx5cxwauihvqwWRHxi

## 配置完成后

1. 重新部署：
```bash
vercel --prod --yes
```

2. 测试支付流程：
   - 访问 Pricing 页面
   - 点击 "Get Base" 或 "Get Pro"
   - 应该跳转到 Creem 支付页面

## 401 错误解决

401 错误通常是因为：
1. AUTH_URL 配置错误
2. 用户未登录
3. Session 过期

确保：
- 用户已经登录
- AUTH_URL = `https://soloboard-command-center-b.vercel.app`
- NEXT_PUBLIC_APP_URL = `https://soloboard-command-center-b.vercel.app`

