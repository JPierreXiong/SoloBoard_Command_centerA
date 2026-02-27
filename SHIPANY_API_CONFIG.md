# ShipAny API 配置说明

**重要**: 不修改 ShipAny 核心结构，所有 ShipAny API 调用仅作为封装服务

---

## 配置信息

### API 凭据（已提供）

- **API Key**: `e50e2b3d-a412-4f90-95eb-aafc9837b9ea`
- **Merchandise ID**: `1955cf99-daf3-4587-a698-2c28ea9180cc`

---

## 环境变量配置

### 在 Supabase Edge Functions Secrets 中配置：

```bash
SHIPANY_API_KEY=e50e2b3d-a412-4f90-95eb-aafc9837b9ea
SHIPANY_MERCHANDISE_ID=1955cf99-daf3-4587-a698-2c28ea9180cc
SHIPANY_API_URL=https://api.shipany.io/v1  # 或测试环境 URL
```

### 发件人地址配置（必需）：

```bash
SHIPANY_SENDER_NAME=Digital Heirloom Vault
SHIPANY_SENDER_PHONE=+852-XXXX-XXXX
SHIPANY_SENDER_EMAIL=noreply@afterglow.app
SHIPANY_SENDER_ADDRESS_LINE1=Your Warehouse Address
SHIPANY_SENDER_CITY=Hong Kong
SHIPANY_SENDER_ZIP_CODE=000000
SHIPANY_SENDER_COUNTRY_CODE=HKG
```

---

## 使用方式

### 1. 在 Edge Function 中调用

```typescript
import { createLegacyAssetShipment } from '@/shared/services/shipany/shipment';

// 在资产释放逻辑中
const shipmentResult = await createLegacyAssetShipment(
  beneficiary, // 受益人信息
  beneficiary.physicalAssetDescription, // 资产描述
  'sf_express' // 承运商 ID
);

// 获取追踪号
const trackingNumber = shipmentResult.tracking_number;
const orderId = shipmentResult.uid;
```

### 2. API 参数说明

**Merchandise ID 的使用**：
- 根据 ShipAny API 文档，Merchandise ID 可能需要在创建订单时作为 `merchandise_id` 字段传递
- 或者在请求头中作为 `X-Merchandise-Id` 传递
- **具体使用方式需要参考 ShipAny 官方 API 文档确认**

---

## 注意事项

1. **不修改 ShipAny 结构**：所有代码仅作为调用封装
2. **API 字段映射**：字段名可能需要根据 ShipAny 实际 API 文档调整（snake_case vs camelCase）
3. **Merchandise ID 位置**：需要在 ShipAny API 文档中确认 Merchandise ID 的传递方式

---

**下一步**: 根据 ShipAny 实际 API 文档调整 `merchandise_id` 的传递位置和方式



