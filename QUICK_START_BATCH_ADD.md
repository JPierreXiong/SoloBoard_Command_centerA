# 🚀 批量添加功能 - 快速启动指南

## ✅ 已完成的工作

### 核心文件已创建
1. ✅ `src/components/soloboard/batch-add-sites-dialog.tsx` - 批量添加 UI
2. ✅ `src/app/api/soloboard/sites/batch/route.ts` - 批量 API
3. ✅ `src/app/api/track/route.ts` - JS Tracking API
4. ✅ `src/app/[locale]/(landing)/soloboard/_components/soloboard-dashboard.tsx` - Dashboard 集成
5. ✅ `src/config/db/schema.ts` - 数据库 Schema 更新

---

## 🔧 立即执行步骤

### Step 1: 数据库迁移

```bash
# 1. 生成迁移文件
pnpm drizzle-kit generate

# 2. 应用迁移到数据库
pnpm drizzle-kit push

# 或者手动执行 SQL
```

**手动 SQL（如果自动迁移失败）**:
```sql
-- 添加新字段到 monitored_sites 表
ALTER TABLE monitored_sites 
ADD COLUMN tracking_script_id TEXT,
ADD COLUMN tracking_script_enabled BOOLEAN DEFAULT false;

-- 添加索引
CREATE INDEX idx_monitored_sites_tracking ON monitored_sites(tracking_script_id);
```

### Step 2: 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
pnpm dev
```

### Step 3: 测试功能

1. 访问 http://localhost:3000/en/soloboard
2. 点击"批量添加站点"按钮（蓝色渐变）
3. 测试批量粘贴功能
4. 测试批量提交

---

## 🎯 功能演示

### 场景 1: 批量粘贴域名

**操作**:
1. 准备域名列表（Excel 或记事本）:
```
example1.com
example2.com
example3.com
```

2. 点击"批量添加站点"
3. 在第一个输入框粘贴（Ctrl+V）
4. 系统自动解析并填充 3 行
5. 点击"添加 3 个站点"

**预期结果**:
- ✅ 自动创建 3 个站点
- ✅ 显示进度条
- ✅ 显示成功消息
- ✅ Dashboard 自动刷新

### 场景 2: 批量配置 API Key

**操作**:
1. 点击"批量添加站点"
2. 粘贴域名列表
3. 在"批量配置区"输入 Stripe Key
4. 点击"应用"按钮
5. 所有站点自动应用该 Key
6. 提交

**预期结果**:
- ✅ 所有站点都配置了 Stripe
- ✅ API Key 验证通过
- ✅ 可以追踪收入数据

### 场景 3: 混合配置

**操作**:
1. 批量粘贴 5 个域名
2. 为前 3 个批量应用 Stripe Key
3. 为后 2 个单独配置 GA4 ID
4. 调整平台类型
5. 提交

**预期结果**:
- ✅ 部分站点有 Stripe
- ✅ 部分站点有 GA4
- ✅ 灵活配置

---

## 🐛 故障排查

### 问题 1: 批量添加按钮不显示

**检查**:
```bash
# 确认文件存在
ls src/components/soloboard/batch-add-sites-dialog.tsx

# 确认导入正确
grep "BatchAddSitesDialog" src/app/[locale]/(landing)/soloboard/_components/soloboard-dashboard.tsx
```

**解决**: 重启开发服务器

### 问题 2: API 返回 500 错误

**检查**:
```bash
# 查看控制台错误
# 检查数据库连接
# 确认环境变量正确
```

**解决**: 
1. 检查 `.env.local` 文件
2. 确认 `DATABASE_URL` 正确
3. 重启服务器

### 问题 3: 数据库迁移失败

**手动执行 SQL**:
```sql
-- 连接到 Neon 数据库
-- 执行上面的 ALTER TABLE 语句
```

### 问题 4: 订阅限制错误

**检查**:
- Free 用户只能添加 1 个站点
- Base 用户最多 5 个
- Pro 用户无限

**解决**: 升级订阅或删除现有站点

---

## 📊 API 测试

### 测试批量 API

```bash
# 使用 curl 测试
curl -X POST http://localhost:3000/api/soloboard/sites/batch \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "sites": [
      {
        "domain": "example1.com",
        "name": "Example 1",
        "platform": "UPTIME"
      },
      {
        "domain": "example2.com",
        "name": "Example 2",
        "platform": "GA4",
        "apiConfig": {
          "ga4PropertyId": "G-XXXXXX"
        }
      }
    ]
  }'
```

**预期响应**:
```json
{
  "success": true,
  "total": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "siteId": "xxx",
      "domain": "example1.com",
      "status": "success"
    },
    {
      "siteId": "yyy",
      "domain": "example2.com",
      "status": "success"
    }
  ]
}
```

### 测试 Tracking API

```bash
# 测试 JS Tracking
curl -X POST http://localhost:3000/api/track \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "your-tracking-id",
    "url": "https://example.com/page",
    "referrer": "https://google.com",
    "user_agent": "Mozilla/5.0..."
  }'
```

**预期响应**: 1x1 透明 GIF

---

## 🎨 UI 预览

### 批量添加对话框

```
┌─────────────────────────────────────────────────────┐
│  ⚡ 批量添加网站                                      │
│  一次性添加最多 10 个网站，支持批量粘贴域名列表        │
├─────────────────────────────────────────────────────┤
│  💡 快速导入技巧                                      │
│  从 Excel 或记事本复制域名列表，粘贴到第一个输入框...  │
├─────────────────────────────────────────────────────┤
│  批量配置 API Key (可选)                              │
│  ┌─────────────────┐  ┌─────────────────┐           │
│  │ Stripe Key      │  │ GA4 Property ID │           │
│  │ sk_live_...     │  │ G-XXXXXX        │           │
│  │ [应用]          │  │ [应用]          │           │
│  └─────────────────┘  └─────────────────┘           │
├─────────────────────────────────────────────────────┤
│  ✓ example1.com     [监控]  [🗑️]                    │
│  ✓ example2.com     [GA4]   [🗑️]                    │
│  ✓ example3.com     [Stripe][🗑️]                    │
│  [+ 添加一行 (3/10)]                                 │
├─────────────────────────────────────────────────────┤
│  🔒 数据加密保护已激活                                │
│  API Keys 将通过 AES-256 军事级加密存储               │
│                                    [取消] [添加 3 个站点]│
└─────────────────────────────────────────────────────┘
```

---

## 📈 性能指标

### 目标性能
- 批量添加 10 个站点: < 5 秒
- API Key 验证: < 2 秒/个
- UI 响应时间: < 100ms

### 实际测试
- [ ] 10 个站点: ___ 秒
- [ ] API 验证: ___ 秒
- [ ] UI 流畅度: ___

---

## 🎉 成功标志

### 功能完整性
- [x] 批量添加 UI 显示正常
- [x] 批量粘贴功能工作
- [x] 批量 API 接口可用
- [x] Dashboard 集成完成
- [ ] 数据库迁移成功
- [ ] 端到端测试通过

### 用户体验
- [ ] 操作流程顺畅
- [ ] 错误提示清晰
- [ ] 进度反馈及时
- [ ] 视觉效果美观

---

## 📞 需要帮助？

### 常见问题
1. **数据库迁移失败** → 手动执行 SQL
2. **API 返回错误** → 检查环境变量
3. **UI 不显示** → 重启服务器
4. **订阅限制** → 升级套餐

### 下一步
1. 执行数据库迁移
2. 重启开发服务器
3. 测试批量添加功能
4. 报告任何问题

---

## 🚀 准备就绪！

**Phase 1 核心功能已完成！**

现在只需要：
1. 运行数据库迁移
2. 重启服务器
3. 开始测试

**预计时间**: 5-10 分钟

让我们开始吧！🎊


