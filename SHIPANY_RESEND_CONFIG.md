# ShipAny & Resend 配置信息

**更新日期**: 2025-01-15  
**项目**: Digital Heirloom / Afterglow

---

## 🔑 API 密钥配置

### ShipAny 配置（物理资产寄送）

**Merchandise ID**:
```
1955cf99-daf3-4587-a698-2c28ea9180cc
```

**API Key**:
```
e50e2b3d-a412-4f90-95eb-aafc9837b9ea
```

**API URL**:
```
https://api.shipany.io/v1
```

**配置位置**:
- 环境变量: `SHIPANY_API_KEY`
- 环境变量: `SHIPANY_MERCHANDISE_ID`
- 代码默认值: `src/shared/services/shipany/shipment.ts`

---

### Resend 配置（邮件通知）

**API Key**:
```
re_JrzLE2sa_HAe9ZVgzmszQ1iepVhRUS4Ci
```

**产品标识**: XJP_product

**配置位置**:
- 环境变量: `RESEND_API_KEY`
- Edge Function: `supabase/functions/dead-man-check/index.ts`

---

## 📋 环境变量配置

### 开发环境 (`.env.local`)

```env
# ShipAny 配置
SHIPANY_API_KEY=e50e2b3d-a412-4f90-95eb-aafc9837b9ea
SHIPANY_MERCHANDISE_ID=1955cf99-daf3-4587-a698-2c28ea9180cc
SHIPANY_API_URL=https://api.shipany.io/v1

# Resend 配置
RESEND_API_KEY=re_JrzLE2sa_HAe9ZVgzmszQ1iepVhRUS4Ci
RESEND_DEFAULT_FROM=support@digitalheirloom.app
RESEND_SENDER_EMAIL=support@digitalheirloom.app
```

---

## 🔒 安全提示

1. **不要提交到版本控制**
   - `.env.local` 文件已添加到 `.gitignore`
   - 不要在代码中硬编码这些密钥

2. **生产环境配置**
   - 使用部署平台的环境变量管理（如 Vercel Environment Variables）
   - 不要在生产环境代码中暴露密钥

3. **密钥权限**
   - ShipAny API Key: 用于创建物流订单
   - Resend API Key: 用于发送邮件通知
   - 定期轮换密钥（如需要）

---

## ✅ 验证配置

### 检查环境变量

```bash
# Windows PowerShell
$env:SHIPANY_API_KEY
$env:SHIPANY_MERCHANDISE_ID
$env:RESEND_API_KEY

# Mac/Linux
echo $SHIPANY_API_KEY
echo $SHIPANY_MERCHANDISE_ID
echo $RESEND_API_KEY
```

### 测试 ShipAny API

在 Edge Function 或 API Route 中测试：

```typescript
import { createLegacyAssetShipment } from '@/shared/services/shipany/shipment';

// 测试创建物流订单
const result = await createLegacyAssetShipment(
  beneficiary,
  'Legacy Asset: Encrypted Recovery Kit',
  'sf_express'
);
```

### 测试 Resend API

在 Edge Function 中测试：

```typescript
// 测试发送邮件
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Digital Heirloom Support <support@digitalheirloom.app>',
    to: ['test@example.com'],
    subject: 'Test Email',
    html: '<p>Test email from Digital Heirloom</p>',
  }),
});
```

---

## 📝 使用场景

### ShipAny API 使用场景

1. **死信开关触发时**
   - 自动创建物理资产物流订单
   - 发送给受益人
   - 记录追踪号到 `shipping_logs` 表

2. **Edge Function 调用**
   - `supabase/functions/dead-man-check/index.ts`
   - 在资产释放时自动调用

### Resend API 使用场景

1. **预警邮件**
   - 死信开关进入预警期时
   - 发送给用户（多语言）

2. **受益人通知邮件**
   - 资产释放时
   - 发送给受益人（包含释放令牌和追踪号）

---

## 🔍 故障排查

### ShipAny API 调用失败

**可能原因**:
- API Key 无效或过期
- Merchandise ID 不匹配
- 发件人地址配置不完整

**解决方法**:
1. 检查环境变量是否正确设置
2. 验证 API Key 和 Merchandise ID
3. 检查 `SHIPANY_SENDER_*` 环境变量

### Resend API 调用失败

**可能原因**:
- API Key 无效或过期
- 发件人域名未验证
- 收件人地址格式错误

**解决方法**:
1. 检查环境变量是否正确设置
2. 验证 API Key
3. 检查发件人域名是否已验证

---

**最后更新**: 2025-01-15  
**配置状态**: ✅ 已配置


