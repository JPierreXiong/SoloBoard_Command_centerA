# ShipAny 集成核心原则

**核心原则**: ✅ **不改变 ShipAny 结构**

---

## 🎯 设计理念

### ShipAny 作为"纯粹的执行终端"

ShipAny 是一个成熟的物流平台，我们的系统将其视为一个**"纯粹的执行终端"**，不进行任何定制化开发。

```
┌─────────────────────────────────────────────────┐
│            Digital Heirloom 系统                │
│  ┌──────────────────────────────────────────┐  │
│  │  1. 资产加密与存储（我们的系统）          │  │
│  │  2. 受益人地址管理（我们的系统）          │  │
│  │  3. 物理分片生成（我们的系统）            │  │
│  └──────────────────────────────────────────┘  │
│                    ↓                            │
│  ┌──────────────────────────────────────────┐  │
│  │  ShipAny API 调用（标准接口）             │  │
│  │  - 仅传递地址信息                          │  │
│  │  - 不传递加密数据                          │  │
│  │  - 不传递解密密钥                          │  │
│  └──────────────────────────────────────────┘  │
│                    ↓                            │
┌─────────────────────────────────────────────────┐
│            ShipAny 物流平台                      │
│  ┌──────────────────────────────────────────┐  │
│  │  标准 API 接口（不改变结构）              │  │
│  │  - 接收发件人地址                          │  │
│  │  - 接收收件人地址                          │  │
│  │  - 接收包裹规格                            │  │
│  │  - 返回运单号                              │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 🔒 解耦逻辑

### 1. 数据分离

| 数据类型 | 存储位置 | ShipAny 是否感知 |
|---------|---------|-----------------|
| **加密资产** | Supabase Storage | ❌ 不感知 |
| **解密密钥** | 物理分片 A/B | ❌ 不感知 |
| **受益人地址** | PostgreSQL | ✅ 仅传递地址 |
| **包裹规格** | Edge Function | ✅ 仅传递规格 |
| **运单号** | ShipAny 返回 | ✅ 仅接收结果 |

### 2. API 调用流程

```typescript
// ✅ 正确：仅传递地址和规格信息
const shipanyPayload = {
  courier_id: 'sf_express',
  type: 'prepaid',
  sender: {
    name: 'Digital Heirloom Vault',
    phone: '+852-XXXX-XXXX',
    address: {
      line1: 'Warehouse Address',
      city: 'Hong Kong',
      country_code: 'HKG',
    },
  },
  receiver: {
    name: beneficiary.receiver_name,  // ← 仅传递地址信息
    phone: beneficiary.phone,
    address: {
      line1: beneficiary.address_line1,
      city: beneficiary.city,
      country_code: beneficiary.country_code,
    },
  },
  parcels: [{
    weight: 0.5,
    container_type: 'BOX',
    content: 'Encrypted Recovery Kit',  // ← 仅描述，不包含实际内容
  }],
};

// ❌ 错误：不要传递加密数据或密钥
const wrongPayload = {
  // ...
  encrypted_data: '...',  // ❌ 不要这样做
  decryption_key: '...',  // ❌ 不要这样做
  vault_id: '...',        // ❌ 不要这样做
};
```

---

## 📦 物理包作为载体

### 物理包内容（我们的系统生成）

```
物理信封内容：
├── Shard A (Index Key)
│   ├── 助记词前 12 位
│   └── Checksum A
│
└── Shard B (Secret Key)
    ├── 助记词后 12 位
    └── Checksum B
```

**ShipAny 的角色**：
- ✅ 接收物理信封
- ✅ 将信封送到受益人地址
- ✅ 返回运单号供追踪
- ❌ 不感知信封内容
- ❌ 不参与解密过程

---

## 💰 到付模式 (Freight Collect)

### 作为身份确认环节

```typescript
// ShipAny 支持到付模式
const payload = {
  // ...
  payment_method: 'collect',  // ← 到付模式
  // ...
};
```

**优势**：
- ✅ 受益人需要支付运费才能签收（身份确认）
- ✅ 无需在 ShipAny 端进行定制化开发
- ✅ 使用 ShipAny 原生功能

---

## 🔄 完整流程（不改动 ShipAny）

### Step 1: 资产释放触发

```
Edge Function 检测到宽限期结束
    ↓
查询受益人信息（从我们的数据库）
    ↓
生成释放令牌（我们的系统）
```

### Step 2: ShipAny API 调用

```
调用 ShipAny Create Order API
    ├─ 仅传递地址信息（发件人、收件人）
    ├─ 仅传递包裹规格（重量、尺寸）
    └─ 不传递任何加密数据或密钥
    ↓
ShipAny 返回运单号
```

### Step 3: 物流追踪

```
ShipAny Webhook（如果配置）
    ├─ 包裹状态更新
    └─ 签收确认
    ↓
更新我们的 shipping_logs 表
```

### Step 4: 受益人访问

```
受益人收到物理信封
    ↓
从 Shard A/B 组合出解密密钥
    ↓
访问我们的系统（使用释放令牌）
    ↓
下载加密文件并解密
```

**ShipAny 在整个流程中**：
- ✅ 仅负责物流执行
- ✅ 不参与加密/解密过程
- ✅ 不存储任何敏感数据
- ✅ 使用标准 API（不改变结构）

---

## 📋 实现检查清单

- [x] ShipAny API 封装（仅传递地址和规格）
- [x] 不传递加密数据或密钥
- [x] 使用标准 API 接口（不定制化）
- [x] 支持到付模式（身份确认）
- [x] 物流状态追踪（标准 Webhook）
- [x] 运单号记录（我们的数据库）

---

## ⚠️ 禁止事项

### ❌ 不要做：

1. **不要传递加密数据**
   ```typescript
   // ❌ 错误
   payload.encrypted_data = vault.encrypted_data;
   ```

2. **不要传递解密密钥**
   ```typescript
   // ❌ 错误
   payload.decryption_key = mnemonic;
   ```

3. **不要定制化 ShipAny API**
   ```typescript
   // ❌ 错误：添加自定义字段
   payload.custom_vault_id = vault.id;
   ```

4. **不要依赖 ShipAny 存储数据**
   ```typescript
   // ❌ 错误：期望 ShipAny 存储我们的数据
   // ShipAny 只负责物流，不存储业务数据
   ```

### ✅ 应该做：

1. **仅传递地址信息**
   ```typescript
   // ✅ 正确
   payload.receiver = {
     name: beneficiary.receiver_name,
     address: beneficiary.address,
   };
   ```

2. **使用标准 API**
   ```typescript
   // ✅ 正确：使用 ShipAny 标准接口
   POST /v1/orders/create
   ```

3. **记录运单号**
   ```typescript
   // ✅ 正确：在我们的数据库中记录
   await supabase.from('shipping_logs').insert({
     tracking_number: shipanyResponse.tracking_number,
   });
   ```

---

## 🎯 总结

**核心原则**：
- ✅ ShipAny 是物流执行器，不是数据存储
- ✅ 仅传递地址和规格信息
- ✅ 不传递加密数据或密钥
- ✅ 使用标准 API（不改变结构）
- ✅ 物理包内容由我们的系统生成

**优势**：
- ✅ 降低维护成本（不依赖 ShipAny 定制化）
- ✅ 提高安全性（ShipAny 不感知敏感数据）
- ✅ 易于迁移（可以替换为其他物流服务）
- ✅ 符合零知识证明原则

---

**最后更新**: 2025-01-15  
**核心原则**: ✅ **不改变 ShipAny 结构**



