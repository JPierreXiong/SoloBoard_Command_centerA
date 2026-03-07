# 站点详情页改进方案
## Site Details Page Improvements Proposal

---

## 📋 问题清单 (Issues Identified)

### 1. ❌ 网站名称显示问题
**问题**: 显示 "WWW" 三次，应该显示实际网站名称
- **原因**: 网站名称可能未正确设置或默认为域名前缀
- **影响**: 用户体验差，无法识别网站

### 2. ❌ Sync 按钮无功能
**问题**: Sync 按钮点击后没有实际效果
- **原因**: `/api/soloboard/sites/${siteId}/sync` API 端点不存在
- **影响**: 用户无法手动刷新数据

### 3. ❌ Settings 按钮无功能
**问题**: Settings 按钮点击后没有跳转或弹窗
- **原因**: 未实现设置页面或对话框
- **影响**: 用户无法修改网站配置

### 4. ❌ 缺少 API 补填功能
**问题**: 添加网站时未填写 API Key/GA4，后续无法补填
- **原因**: 没有编辑网站配置的入口
- **影响**: 用户必须删除重新添加网站

---

## 🎯 解决方案 (Solutions)

### 方案 1: 修复网站名称显示 ✅ 优先级: P0

**实现步骤**:
1. 检查数据库中 `monitored_sites` 表的 `name` 字段
2. 如果 `name` 为空或为 "WWW"，使用域名作为后备
3. 添加名称格式化函数：
   ```typescript
   function formatSiteName(name: string, domain: string): string {
     // 如果名称为空、"WWW" 或只是域名前缀，使用域名
     if (!name || name === 'WWW' || name.toLowerCase() === 'www') {
       return domain.replace(/^(https?:\/\/)?(www\.)?/, '');
     }
     return name;
   }
   ```

**工作量**: 30 分钟
**风险**: 低

---

### 方案 2: 实现 Sync 功能 ✅ 优先级: P1

**功能说明**:
- 手动触发数据同步
- 从 GA4、Stripe 等平台拉取最新数据
- 更新站点状态（在线/离线）

**实现步骤**:

#### 2.1 创建 Sync API 端点
```typescript
// src/app/api/soloboard/sites/[siteId]/sync/route.ts
export async function POST(req: Request, { params }: { params: { siteId: string } }) {
  // 1. 验证用户权限
  // 2. 获取站点配置（API Keys）
  // 3. 调用各平台 API 获取最新数据
  // 4. 更新数据库
  // 5. 返回同步结果
}
```

#### 2.2 同步逻辑
- **GA4 同步**: 获取今日访客数
- **Stripe 同步**: 获取今日收入
- **Uptime 检查**: Ping 网站检查在线状态
- **更新时间戳**: 记录最后同步时间

**工作量**: 2-3 小时
**风险**: 中（需要处理 API 限流）

---

### 方案 3: 实现 Settings 功能 ✅ 优先级: P1

**功能说明**:
- 打开网站设置对话框
- 允许编辑网站名称、API Keys、监控配置
- 支持删除网站

**实现步骤**:

#### 3.1 创建设置对话框组件
```typescript
// src/components/soloboard/site-settings-dialog.tsx
interface SiteSettingsDialogProps {
  siteId: string;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

// 包含以下表单字段：
// - 网站名称
// - 域名（只读）
// - Stripe API Key
// - GA4 Property ID
// - Shopify 配置
// - 监控间隔
// - 删除网站按钮
```

#### 3.2 创建更新 API
```typescript
// src/app/api/soloboard/sites/[siteId]/route.ts
export async function PATCH(req: Request, { params }: { params: { siteId: string } }) {
  // 1. 验证用户权限
  // 2. 验证输入数据
  // 3. 加密 API Keys
  // 4. 更新数据库
  // 5. 返回更新后的站点信息
}
```

**工作量**: 3-4 小时
**风险**: 低

---

### 方案 4: API 补填功能 ✅ 优先级: P1

**功能说明**:
- 在设置对话框中允许添加/修改 API Keys
- 显示当前已配置的平台
- 支持测试 API Key 有效性

**实现步骤**:

#### 4.1 设置对话框集成
- 复用方案 3 的设置对话框
- 添加 "Test Connection" 按钮验证 API Key
- 显示配置状态（已配置/未配置）

#### 4.2 API Key 测试端点
```typescript
// src/app/api/soloboard/sites/[siteId]/test-connection/route.ts
export async function POST(req: Request, { params }: { params: { siteId: string } }) {
  const { platform, apiKey } = await req.json();
  
  // 根据平台类型测试连接
  switch (platform) {
    case 'STRIPE':
      // 测试 Stripe API Key
      break;
    case 'GA4':
      // 测试 GA4 Property ID
      break;
    // ...
  }
  
  return { success: true, message: 'Connection successful' };
}
```

**工作量**: 2 小时
**风险**: 低

---

## 📊 实现优先级和时间表

### Phase 1: 紧急修复 (1-2 小时)
- ✅ **P0**: 修复网站名称显示 (30 分钟)
- ✅ **P1**: 创建设置对话框 UI (1 小时)

### Phase 2: 核心功能 (4-5 小时)
- ✅ **P1**: 实现 Settings 功能完整流程 (2 小时)
- ✅ **P1**: 实现 Sync 功能 (2-3 小时)

### Phase 3: 增强功能 (2 小时)
- ✅ **P2**: API Key 测试功能 (1 小时)
- ✅ **P2**: 优化错误处理和用户反馈 (1 小时)

**总工作量**: 7-9 小时

---

## 🔧 技术实现细节

### 数据库更新
```sql
-- 确保 monitored_sites 表有必要字段
ALTER TABLE monitored_sites ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;
ALTER TABLE monitored_sites ADD COLUMN IF NOT EXISTS sync_interval INTEGER DEFAULT 3600; -- 秒
```

### API 端点清单
1. `POST /api/soloboard/sites/[siteId]/sync` - 手动同步
2. `PATCH /api/soloboard/sites/[siteId]` - 更新站点配置
3. `POST /api/soloboard/sites/[siteId]/test-connection` - 测试 API 连接

### 组件清单
1. `SiteSettingsDialog` - 设置对话框
2. `ApiKeyInput` - API Key 输入组件（带显示/隐藏）
3. `ConnectionTestButton` - 测试连接按钮

---

## 🎨 UI/UX 改进

### 设置对话框布局
```
┌─────────────────────────────────────┐
│  Site Settings                    ✕ │
├─────────────────────────────────────┤
│                                     │
│  Basic Information                  │
│  ├─ Site Name: [_______________]    │
│  └─ Domain: example.com (readonly)  │
│                                     │
│  Integrations                       │
│  ├─ Stripe API Key                  │
│  │  [●●●●●●●●●●●●] [Test] ✓        │
│  ├─ GA4 Property ID                 │
│  │  [G-XXXXXX] [Test] ✓            │
│  └─ Shopify (Not configured)        │
│     [+ Add Shopify]                 │
│                                     │
│  Monitoring                         │
│  └─ Sync Interval: [1 hour ▼]      │
│                                     │
│  Danger Zone                        │
│  └─ [Delete Site]                   │
│                                     │
│  [Cancel]              [Save]       │
└─────────────────────────────────────┘
```

---

## ✅ 验收标准

### 1. 网站名称显示
- [ ] 显示正确的网站名称，不是 "WWW"
- [ ] 如果名称为空，显示格式化的域名
- [ ] 支持中文、英文等多语言名称

### 2. Sync 功能
- [ ] 点击 Sync 按钮显示加载状态
- [ ] 成功同步后显示成功提示
- [ ] 失败时显示错误信息
- [ ] 更新页面数据（无需刷新）
- [ ] 显示最后同步时间

### 3. Settings 功能
- [ ] 点击 Settings 打开对话框
- [ ] 显示当前配置信息
- [ ] 可以编辑所有字段
- [ ] 保存后立即生效
- [ ] 支持取消操作

### 4. API 补填功能
- [ ] 可以添加之前未配置的 API Key
- [ ] 可以修改已有的 API Key
- [ ] 测试连接功能正常工作
- [ ] 显示配置状态（已配置/未配置）

---

## 🚨 风险和注意事项

### 安全性
- ✅ API Keys 必须加密存储（AES-256）
- ✅ 只返回 API Key 的前 4 位和后 4 位用于显示
- ✅ 验证用户权限（只能编辑自己的网站）

### 性能
- ⚠️ Sync 操作可能耗时，需要异步处理
- ⚠️ 避免频繁同步（添加冷却时间）
- ⚠️ API 限流处理（Stripe、GA4 都有限制）

### 用户体验
- ✅ 所有操作提供即时反馈
- ✅ 错误信息清晰易懂
- ✅ 支持多语言（英文、中文、法语）

---

## 📝 后续优化建议

### Phase 4: 高级功能（可选）
1. **自动同步**: 后台定时任务自动同步数据
2. **同步历史**: 记录每次同步的结果
3. **批量编辑**: 一次性更新多个网站的配置
4. **配置模板**: 保存常用配置为模板
5. **Webhook 通知**: 数据更新时推送通知

---

## 🎯 总结

本方案解决了站点详情页的 4 个核心问题：
1. ✅ 网站名称显示修复
2. ✅ Sync 功能实现
3. ✅ Settings 功能实现
4. ✅ API 补填功能

**预计总工作量**: 7-9 小时
**建议分 3 个阶段实施**，优先完成 P0 和 P1 功能。

---

## 📌 待批准

请审阅以上方案，确认后我将按照优先级顺序开始实施。

**需要确认的问题**:
1. ✅ 是否同意分 3 个阶段实施？
2. ✅ 是否需要调整优先级？
3. ✅ 是否有其他需求需要补充？
4. ✅ 是否需要先实现某个特定功能？

---

*文档创建时间: 2026-03-07*
*预计完成时间: Phase 1-2 可在 1 天内完成*


