# Creem 支付集成解决方案 - 基于现有 ShipAny 结构

## 📋 学习现有流程

### 1. 现有支付流程分析

**支付流程**:
```
用户点击购买 
  → /api/payment/checkout (创建订单)
  → Creem 支付页面
  → 支付成功回调 /api/payment/callback
  → 更新订单状态、积分、订阅
  → 跳转到成功页面 /payment/success
```

**关键文件**:
1. `src/app/api/payment/checkout/route.ts` - 创建支付订单
2. `src/app/api/payment/callback/route.ts` - 处理支付回调
3. `src/shared/services/payment.ts` - 支付服务核心逻辑
4. `src/app/[locale]/(landing)/payment/success/page.tsx` - 支付成功页面
5. `src/app/[locale]/(landing)/settings/billing/page.tsx` - 订阅管理页面
6. `src/app/[locale]/(landing)/settings/payments/page.tsx` - 支付记录页面

### 2. 现有数据库表结构

**Order 表** (订单):
- orderNo - 订单号
- userId - 用户ID
- amount - 金额
- currency - 货币
- productId - 产品ID
- paymentProvider - 支付提供商 (creem)
- status - 订单状态
- creditsAmount - 积分数量
- creditsValidDays - 积分有效期
- planName - 套餐名称

**Subscription 表** (订阅):
- userId - 用户ID
- planName - 套餐名称
- status - 订阅状态 (active/cancelled)
- currentPeriodStart - 当前周期开始
- currentPeriodEnd - 当前周期结束
- amount - 金额
- interval - 周期 (month/year)

**Credits 表** (积分):
- userId - 用户ID
- amount - 积分数量
- validUntil - 有效期

## ✅ 解决方案：只需配置环境变量

### 步骤 1: 更新 .env.local 文件

**需要添加/更新的环境变量**:

```bash
# Creem 支付配置
CREEM_ENABLED=true
CREEM_ENVIRONMENT=production
CREEM_API_KEY=creem_test_5JeYAJ7l8MEVmScHKMLnHZ

# Creem Webhook 配置
CREEM_WEBHOOK_SECRET=whsec_6MzmusMOCJe420udLkejHe
CREEM_WEBHOOK_URL=https://soloboard-command-center-b.vercel.app/api/webhooks/creem

# Creem 产品 ID 映射
CREEM_PRODUCT_IDS={"base-annual":"prod_3i3wLrjX9sQiwts95zv1FG","pro-annual":"prod_n1rGx5cxwauihvqwWRHxi"}

# 默认支付提供商
DEFAULT_PAYMENT_PROVIDER=creem
```

### 步骤 2: 更新定价配置文件

**文件**: `src/config/locale/messages/en/pricing.json`

**需要添加的配置**:

```json
{
  "pricing": {
    "items": [
      {
        "product_id": "base-annual",
        "product_name": "Base Plan",
        "title": "Base Plan",
        "description": "Perfect for small projects",
        "amount": 1990,
        "currency": "USD",
        "price": "$19.9",
        "unit": "/month",
        "interval": "month",
        "payment_product_id": "prod_3i3wLrjX9sQiwts95zv1FG",
        "payment_providers": ["creem"],
        "credits": 1000,
        "valid_days": 30,
        "plan_name": "Base",
        "features": [
          "Up to 5 sites",
          "Real-time monitoring",
          "Email notifications",
          "7-day data history"
        ]
      },
      {
        "product_id": "pro-annual",
        "product_name": "Pro Plan",
        "title": "Pro Plan",
        "description": "Perfect for professionals",
        "amount": 3990,
        "currency": "USD",
        "price": "$39.9",
        "unit": "/month",
        "interval": "month",
        "payment_product_id": "prod_n1rGx5cxwauihvqwWRHxi",
        "payment_providers": ["creem"],
        "credits": 5000,
        "valid_days": 30,
        "plan_name": "Pro",
        "features": [
          "Unlimited sites",
          "Advanced analytics",
          "API access",
          "90-day data history",
          "Priority support"
        ]
      }
    ]
  }
}
```

### 步骤 3: 验证现有代码已支持

**✅ 已有的功能** (无需修改):

1. **支付创建** - `checkout/route.ts` 已支持 Creem
2. **支付回调** - `callback/route.ts` 已处理订单完成
3. **积分更新** - `handleCheckoutSuccess()` 已自动添加积分
4. **订阅创建** - 自动创建订阅记录
5. **有效期管理** - 根据 `creditsValidDays` 设置
6. **权限更新** - 根据 `planName` 更新用户权限
7. **页面跳转** - 支付成功后跳转到 `/payment/success`
8. **订阅管理** - `/settings/billing` 显示订阅信息
9. **支付记录** - `/settings/payments` 显示支付历史

## 🔧 现有代码如何工作

### 1. 支付创建流程

**文件**: `src/app/api/payment/checkout/route.ts`

**关键代码**:
```typescript
// 1. 从定价配置获取产品信息
const pricingItem = pricing.items.find(
  (item: any) => item.product_id === product_id
);

// 2. 创建订单记录
const newOrder: NewOrder = {
  orderNo: orderNo,
  userId: user.id,
  amount: checkoutAmount,
  currency: checkoutCurrency,
  productId: pricingItem.product_id,
  paymentProvider: 'creem',
  creditsAmount: pricingItem.credits,      // ← 积分数量
  creditsValidDays: pricingItem.valid_days, // ← 有效期
  planName: pricingItem.plan_name,          // ← 套餐名称
};

// 3. 调用 Creem API 创建支付
const result = await paymentProvider.createPayment({
  order: checkoutOrder,
});
```

### 2. 支付成功处理

**文件**: `src/shared/services/payment.ts`

**关键函数**: `handleCheckoutSuccess()`

**自动处理**:
```typescript
// 1. 更新订单状态为已完成
await updateOrder(order.id, { status: 'completed' });

// 2. 添加积分
if (order.creditsAmount > 0) {
  await addCredits({
    userId: order.userId,
    amount: order.creditsAmount,
    validUntil: addDays(new Date(), order.creditsValidDays),
    source: 'purchase',
    orderId: order.id,
  });
}

// 3. 创建/更新订阅
if (order.paymentType === 'subscription') {
  await createOrUpdateSubscription({
    userId: order.userId,
    planName: order.planName,
    status: 'active',
    amount: order.amount,
    interval: order.paymentInterval,
    currentPeriodStart: new Date(),
    currentPeriodEnd: addMonths(new Date(), 1),
  });
}

// 4. 更新用户权限
await updateUserPermissions(order.userId, order.planName);
```

### 3. 页面显示

**支付成功页面** - `/payment/success`:
- ✅ 显示订阅信息
- ✅ 显示金额和周期
- ✅ 显示有效期
- ✅ 提供跳转链接

**订阅管理页面** - `/settings/billing`:
- ✅ 显示当前订阅
- ✅ 显示下次扣费日期
- ✅ 提供取消订阅功能

**支付记录页面** - `/settings/payments`:
- ✅ 显示所有支付记录
- ✅ 显示订单状态
- ✅ 显示金额和时间

## 🎯 实施步骤

### 第 1 步: 更新环境变量

```powershell
# 编辑 .env.local 文件
notepad .env.local

# 添加以下内容:
CREEM_ENABLED=true
CREEM_API_KEY=creem_test_5JeYAJ7l8MEVmScHKMLnHZ
CREEM_WEBHOOK_SECRET=whsec_6MzmusMOCJe420udLkejHe
CREEM_PRODUCT_IDS={"base-annual":"prod_3i3wLrjX9sQiwts95zv1FG","pro-annual":"prod_n1rGx5cxwauihvqwWRHxi"}
DEFAULT_PAYMENT_PROVIDER=creem
```

### 第 2 步: 更新定价配置

**文件**: `src/config/locale/messages/en/pricing.json`

添加 `payment_product_id` 字段到每个产品:
```json
{
  "product_id": "base-annual",
  "payment_product_id": "prod_3i3wLrjX9sQiwts95zv1FG",
  "credits": 1000,
  "valid_days": 30,
  "plan_name": "Base"
}
```

### 第 3 步: 重启服务器

```powershell
# 停止服务器 (Ctrl+C)
# 重新启动
pnpm dev
```

### 第 4 步: 测试支付流程

1. 访问 http://localhost:3003/zh/pricing
2. 点击 "Base Plan" 购买按钮
3. 应该跳转到 Creem 支付页面
4. 完成支付
5. 自动跳转回 `/payment/success`
6. 查看 `/settings/billing` 确认订阅
7. 查看 `/settings/payments` 确认支付记录

## 📊 数据流转图

```
用户购买
  ↓
创建订单 (Order)
  ├─ orderNo
  ├─ amount: 1990 (19.9 USD)
  ├─ creditsAmount: 1000
  ├─ creditsValidDays: 30
  └─ planName: "Base"
  ↓
Creem 支付
  ↓
支付成功回调
  ↓
handleCheckoutSuccess()
  ├─ 更新订单状态 → completed
  ├─ 添加积分 → Credits 表
  │   ├─ amount: 1000
  │   └─ validUntil: now + 30 days
  ├─ 创建订阅 → Subscription 表
  │   ├─ planName: "Base"
  │   ├─ status: "active"
  │   ├─ currentPeriodEnd: now + 1 month
  │   └─ amount: 1990
  └─ 更新用户权限
  ↓
跳转到成功页面
  ↓
用户查看订阅和积分
```

## ✅ 不改变 ShipAny 结构

### 保持的结构:
- ✅ Header + Hero + Footer 布局
- ✅ 定价页面结构
- ✅ 支付流程
- ✅ 回调处理
- ✅ 成功页面
- ✅ 订阅管理页面
- ✅ 支付记录页面

### 只需修改:
- ✅ 环境变量 (`.env.local`)
- ✅ 定价配置 (`pricing.json`)
- ✅ 产品 ID 映射

## 🔍 验证清单

- [ ] 环境变量已更新
- [ ] 定价配置已更新
- [ ] 服务器已重启
- [ ] 可以访问定价页面
- [ ] 点击购买跳转到 Creem
- [ ] 支付成功后跳转回网站
- [ ] 订阅已创建
- [ ] 积分已添加
- [ ] 有效期正确
- [ ] 权限已更新

## 📝 总结

**现有代码已经完整支持 Creem 支付**，只需要:

1. ✅ 配置环境变量 (API Key, Product IDs)
2. ✅ 更新定价配置文件
3. ✅ 重启服务器

**无需编写新代码**，所有功能都已实现:
- ✅ 支付创建
- ✅ 支付回调
- ✅ 积分管理
- ✅ 订阅管理
- ✅ 有效期管理
- ✅ 权限更新
- ✅ 页面跳转
- ✅ 数据展示

**完全保持 ShipAny 结构**，不改变任何页面布局和流程。












