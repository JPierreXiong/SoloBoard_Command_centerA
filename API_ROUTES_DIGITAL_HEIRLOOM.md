# Digital Heirloom API 路由文档

## 概述

所有 API 路由都遵循 ShipAny 架构模式，使用统一的认证检查和响应格式。

---

## 认证

所有需要认证的路由都使用 `requireAuth()` 函数进行验证。

**响应格式**：
```json
{
  "code": 0,
  "message": "ok",
  "data": { ... }
}
```

**错误格式**：
```json
{
  "code": -1,
  "message": "error message"
}
```

---

## API 路由列表

### 1. 保险箱管理

#### 1.1 创建保险箱
**POST** `/api/digital-heirloom/vault/create`

**认证**：✅ 需要

**请求体**：
```json
{
  "encryptedData": "base64_encrypted_data",
  "encryptionSalt": "base64_salt",
  "encryptionIv": "base64_iv",
  "encryptionHint": "optional_hint",
  "heartbeatFrequency": 90,
  "gracePeriod": 7,
  "deadManSwitchEnabled": false
}
```

**响应**：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "vault": { ... },
    "message": "Digital vault created successfully"
  }
}
```

---

#### 1.2 获取保险箱
**GET** `/api/digital-heirloom/vault/get`

**认证**：✅ 需要

**响应**：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "vault": { ... },
    "beneficiaries": [ ... ],
    "latestHeartbeat": { ... },
    "recentEvents": [ ... ],
    "message": "Vault retrieved successfully"
  }
}
```

**注意**：响应中不包含 `encryptedData`，只返回元数据。

---

#### 1.3 更新保险箱
**PUT** `/api/digital-heirloom/vault/update`

**认证**：✅ 需要

**请求体**（所有字段可选）：
```json
{
  "encryptedData": "base64_encrypted_data",
  "encryptionSalt": "base64_salt",
  "encryptionIv": "base64_iv",
  "encryptionHint": "optional_hint",
  "heartbeatFrequency": 90,
  "gracePeriod": 7,
  "deadManSwitchEnabled": true
}
```

**验证规则**：
- `heartbeatFrequency`: 1-365 天
- `gracePeriod`: 1-30 天
- 更新 `encryptedData` 时必须提供 `encryptionSalt` 和 `encryptionIv`

---

#### 1.4 更新心跳
**POST** `/api/digital-heirloom/vault/heartbeat`

**认证**：✅ 需要

**功能**：
- 更新 `lastSeenAt` 时间
- 记录心跳日志
- 记录心跳事件
- 重置状态为 `active`

**响应**：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "vault": { ... },
    "message": "Heartbeat updated successfully",
    "lastSeenAt": "2025-01-09T..."
  }
}
```

---

### 2. 受益人管理

#### 2.1 添加受益人
**POST** `/api/digital-heirloom/beneficiaries/add`

**认证**：✅ 需要

**请求体 - 单个添加**：
```json
{
  "beneficiary": {
    "name": "John Doe",
    "email": "john@example.com",
    "relationship": "spouse",
    "language": "en",
    "phone": "+1234567890",
    "receiverName": "John Doe",
    "addressLine1": "123 Main St",
    "city": "New York",
    "zipCode": "10001",
    "countryCode": "US"
  }
}
```

**请求体 - 批量添加**：
```json
{
  "beneficiaries": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      ...
    },
    {
      "name": "Jane Doe",
      "email": "jane@example.com",
      ...
    }
  ]
}
```

**必需字段**：`name`, `email`

---

#### 2.2 获取受益人列表
**GET** `/api/digital-heirloom/beneficiaries/list`

**认证**：✅ 需要

**响应**：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "beneficiaries": [ ... ],
    "count": 2,
    "message": "Beneficiaries retrieved successfully"
  }
}
```

---

#### 2.3 删除受益人
**DELETE** `/api/digital-heirloom/beneficiaries/remove`

**认证**：✅ 需要

**请求体**：
```json
{
  "beneficiaryId": "uuid"
}
```

**限制**：
- 不能删除已释放资产的受益人（`status === 'released'`）

---

### 3. 资产释放

#### 3.1 请求资产释放
**POST** `/api/digital-heirloom/release/request`

**认证**：❌ 不需要（使用 Token）

**请求体**：
```json
{
  "releaseToken": "uuid_token"
}
```

**流程**：
1. 验证 Token 有效性
2. 如果状态是 `notified`：
   - 请求解锁（设置 24 小时延迟）
   - 向原用户发送通知
   - 返回延迟信息
3. 如果状态是 `unlock_requested`：
   - 检查延迟期是否已过
   - 如果未过，返回剩余时间
   - 如果已过，返回加密数据

**响应 - 延迟期**：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "message": "Unlock request submitted...",
    "unlockRequestedAt": "2025-01-09T...",
    "unlockDelayUntil": "2025-01-10T...",
    "beneficiaryId": "uuid"
  }
}
```

**响应 - 可解锁**：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "message": "Unlock delay period expired...",
    "vault": {
      "id": "uuid",
      "encryptedData": "base64...",
      "encryptionSalt": "base64...",
      "encryptionIv": "base64...",
      "encryptionHint": "..."
    },
    "beneficiaryId": "uuid"
  }
}
```

---

#### 3.2 验证并获取数据
**POST** `/api/digital-heirloom/release/verify`

**认证**：❌ 不需要（使用 Token）

**请求体**：
```json
{
  "releaseToken": "uuid_token",
  "emailVerificationCode": "optional_code"
}
```

**功能**：
- 验证 Token
- 检查延迟期（如果适用）
- 标记资产为已释放
- 记录释放事件
- 返回加密数据

**响应**：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "message": "Assets released successfully...",
    "vault": {
      "id": "uuid",
      "encryptedData": "base64...",
      "encryptionSalt": "base64...",
      "encryptionIv": "base64...",
      "encryptionHint": "..."
    },
    "beneficiary": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "releasedAt": "2025-01-09T..."
  }
}
```

---

## 安全特性

### 1. 认证检查
- 所有需要认证的路由都使用 `requireAuth()`
- 自动检查用户 session
- 返回统一的 401 错误

### 2. 权限验证
- 保险箱操作验证所有权
- 受益人操作验证所属保险箱
- 防止越权访问

### 3. 数据保护
- 响应中不返回敏感加密数据（除非明确需要）
- Token 验证包含过期检查
- 延迟解锁机制防止误操作

### 4. 输入验证
- 所有必需字段都进行验证
- 数值范围验证（heartbeatFrequency, gracePeriod）
- 状态验证（不能删除已释放的受益人）

---

## 错误处理

所有错误都返回统一的格式：
```json
{
  "code": -1,
  "message": "error message"
}
```

**常见错误**：
- `401`: 未认证
- `403`: 无权限
- `400`: 参数错误
- `404`: 资源不存在
- `500`: 服务器错误

---

## 注意事项

1. **加密数据**：所有加密操作都在前端完成，API 只存储和返回密文
2. **延迟解锁**：24 小时延迟是硬性要求，不能绕过
3. **Token 有效期**：释放令牌有效期为 24 小时
4. **批量操作**：受益人支持批量添加，提高效率
5. **事件记录**：所有重要操作都记录事件日志

---

**最后更新**：2025-01-09




