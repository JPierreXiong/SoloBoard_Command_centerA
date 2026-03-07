# 🚀 SoloBoard 快速开始 - 端到端测试指南

## 📋 前置准备

### 1. 环境要求
- ✅ Node.js 18+
- ✅ PostgreSQL 数据库
- ✅ Stripe 账号（测试模式）
- ✅ Google Analytics 4 账号（可选）

### 2. 环境变量配置
确保 `.env.local` 包含：
```env
DATABASE_URL=postgresql://user:password@localhost:5432/soloboard
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
```

### 3. 启动项目
```bash
# 安装依赖
pnpm install

# 推送数据库 schema
pnpm db:push

# 启动开发服务器
pnpm dev
```

访问：http://localhost:3000

---

## 🎯 测试流程

### Step 1: 添加第一个网站 (2分钟)

1. **访问 SoloBoard**
   - 打开 http://localhost:3000/en/soloboard
   - 如果未登录，先注册/登录账号

2. **单个添加网站**
   - 点击 **"+ Add Website"** 按钮
   - 输入信息：
     ```
     Site Name: My Test Store
     Domain: example.com
     ```
   - 点击 **"Add Website"**

3. **验证结果**
   - ✅ 网站出现在仪表盘列表中
   - ✅ 显示网站名称和域名
   - ✅ 状态显示为 "Online" 或 "Offline"

---

### Step 2: 配置 Stripe API (3分钟)

#### 2.1 获取 Stripe API Key

1. 访问 https://dashboard.stripe.com/test/apikeys
2. 登录 Stripe 账号
3. 确保在 **Test Mode**（测试模式）
4. 复制 **Secret key**（以 `sk_test_` 开头）

#### 2.2 在 SoloBoard 中配置

1. 点击刚添加的网站卡片，进入详情页
2. 点击右上角 **"Settings"** 按钮
3. 在 **Integrations** 部分找到 **Stripe**
4. 粘贴 API Key
5. 点击 **"Test"** 按钮
6. ✅ 验证：显示 🟢 绿色指示器 = 连接成功
7. 点击 **"Save Changes"**

#### 2.3 配置 Webhook（重要！）

1. 在 Settings 对话框中，找到 Stripe 的 **Webhook URL**
2. 点击复制按钮（URL 格式：`http://localhost:3000/api/webhooks/stripe/[siteId]`）
3. 访问 https://dashboard.stripe.com/test/webhooks
4. 点击 **"Add endpoint"**
5. 粘贴 Webhook URL
6. 选择事件：
   - `charge.succeeded`
   - `payment_intent.succeeded`
7. 点击 **"Add endpoint"**

---

### Step 3: 创建测试支付 (2分钟)

#### 方法 1: 使用 Stripe Dashboard

1. 访问 https://dashboard.stripe.com/test/payments
2. 点击 **"+ New"**
3. 创建测试支付：
   ```
   Amount: $10.00
   Currency: USD
   Customer: test@example.com
   ```
4. 使用测试卡号：`4242 4242 4242 4242`
5. 完成支付

#### 方法 2: 使用 Stripe CLI（推荐）

```bash
# 安装 Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# 登录
stripe login

# 创建测试支付
stripe charges create \
  --amount=1000 \
  --currency=usd \
  --source=tok_visa \
  --description="Test payment"
```

---

### Step 4: 同步数据并查看结果 (1分钟)

1. **执行同步**
   - 在网站详情页，点击 **"Sync"** 按钮
   - 观察同步进度对话框

2. **验证同步进度**
   - ✅ 显示 4 个步骤
   - ✅ 每个步骤有状态指示器
   - ✅ 进度条实时更新
   - ✅ Stripe 步骤显示收入金额

3. **查看同步结果**
   - 💰 **Revenue**: 应该显示 $10.00（或您创建的金额）
   - 👥 **Visitors**: 显示 0（GA4 未配置）
   - ⚡ **Response Time**: 显示网站响应时间
   - 🌐 **Status**: 显示 Online/Offline

4. **验证数据展示**
   - 返回仪表盘
   - ✅ 网站卡片显示今日收入
   - ✅ 顶部统计卡片更新
   - ✅ 历史图表显示数据点

---

### Step 5: 测试其他功能 (5分钟)

#### 5.1 批量添加网站

1. 点击 **"⚡ Batch Add"** 按钮
2. 输入多个域名：
   ```
   store1.com
   store2.com
   store3.com
   ```
3. 点击 **"Next"**
4. 跳过 API 配置（或为每个站点配置）
5. 点击 **"Add All Sites"**
6. ✅ 验证：所有网站添加成功

#### 5.2 修改网站设置

1. 进入任意网站详情页
2. 点击 **"Settings"**
3. 修改 **Site Name**
4. 修改 **Sync Interval**（选择 6 hours）
5. 点击 **"Save Changes"**
6. ✅ 验证：设置保存成功

#### 5.3 测试 API Key 安全性

1. 打开 Settings 对话框
2. 查看 Stripe API Key
3. ✅ 验证：默认显示为 `sk_t****...****xyz`
4. 点击眼睛图标
5. ✅ 验证：显示完整 API Key
6. 再次点击眼睛图标
7. ✅ 验证：重新遮蔽

#### 5.4 测试删除确认

1. 在仪表盘，点击网站卡片的 **"⋮"** 菜单
2. 选择 **"Delete"**
3. ✅ 验证：弹出确认对话框
4. 尝试输入错误的域名
5. ✅ 验证：删除按钮禁用
6. 输入正确的域名
7. ✅ 验证：删除按钮启用
8. 点击 **"Cancel"**（不要真的删除）

---

## 🎨 UI/UX 验证清单

### 设置对话框
- [ ] 打开/关闭动画流畅
- [ ] 3个部分清晰展示（基本信息/集成/监控）
- [ ] API Key 默认遮蔽
- [ ] 眼睛图标切换正常
- [ ] 连接状态指示器显示正确
- [ ] Test 按钮功能正常
- [ ] Webhook URL 复制成功
- [ ] Save 按钮有加载状态
- [ ] 保存成功有 Toast 提示

### 同步进度对话框
- [ ] 自动打开
- [ ] 进度条平滑更新
- [ ] 4个步骤依次执行
- [ ] 每个步骤有图标和状态
- [ ] 运行中步骤有旋转动画
- [ ] 成功步骤显示绿色
- [ ] 错误步骤显示红色
- [ ] 完成后自动关闭
- [ ] 数据自动刷新

### 删除确认
- [ ] 显示警告图标
- [ ] 要求输入域名
- [ ] 输入验证实时生效
- [ ] 按钮状态正确切换
- [ ] 删除成功有 Toast 提示

---

## 🔍 数据验证

### 仪表盘数据
```
预期结果：
- Total Sites: 1-4（根据添加的数量）
- Total Revenue: $10.00（或您的测试金额）
- Total Visitors: 0（GA4 未配置）
```

### 网站卡片数据
```
预期结果：
- Revenue: $10.00
- Visitors: 0
- Response Time: 100-500ms（根据网络）
- Status: Online（如果域名可访问）
```

### 网站详情页数据
```
预期结果：
- 今日指标卡片显示正确
- 历史图表有数据点
- 最后同步时间更新
```

---

## 🐛 常见问题排查

### 问题 1: Stripe 连接失败
**症状**: 测试连接显示红色错误

**解决方案**:
1. 检查 API Key 格式（必须以 `sk_test_` 或 `sk_live_` 开头）
2. 确认使用的是 Secret Key，不是 Publishable Key
3. 检查 Stripe 账号是否在测试模式
4. 查看浏览器控制台错误信息

### 问题 2: 同步后没有数据
**症状**: Revenue 显示 $0.00

**解决方案**:
1. 确认 Stripe 中有测试支付
2. 检查支付时间（必须是今天）
3. 确认 API Key 配置正确
4. 查看同步进度对话框的错误信息
5. 检查浏览器控制台和服务器日志

### 问题 3: Webhook 不工作
**症状**: 创建支付后数据不自动更新

**解决方案**:
1. 确认 Webhook URL 配置正确
2. 使用 ngrok 或类似工具暴露本地服务器：
   ```bash
   ngrok http 3000
   ```
3. 使用 ngrok 提供的 URL 更新 Webhook
4. 在 Stripe Dashboard 查看 Webhook 日志

### 问题 4: 网站状态显示 Offline
**症状**: 所有网站都显示 Offline

**解决方案**:
1. 这是正常的（测试域名不存在）
2. 使用真实域名测试（如 google.com）
3. 状态不影响收入数据同步

---

## 📊 预期测试结果

### ✅ 成功标准

1. **添加网站**: 单个和批量添加都成功
2. **配置 API**: Stripe 连接测试通过
3. **同步数据**: 显示真实的收入数据
4. **UI/UX**: 所有交互流畅，反馈及时
5. **数据展示**: 仪表盘和详情页数据正确
6. **安全性**: API Key 遮蔽，删除需要确认

### 📈 性能指标

- 页面加载时间: < 2秒
- 同步完成时间: < 5秒
- UI 响应时间: < 100ms
- 数据刷新时间: < 1秒

---

## 🎯 下一步

测试完成后，您可以：

1. **部署到生产环境**
   ```bash
   pnpm build
   pnpm start
   ```

2. **配置真实 API Keys**
   - 切换到 Stripe Live Mode
   - 使用真实的 GA4 Property ID
   - 配置真实的 Webhook URL

3. **添加更多网站**
   - 使用批量添加功能
   - 为每个网站配置 API Keys
   - 设置自动同步间隔

4. **监控数据**
   - 定期查看仪表盘
   - 分析历史趋势
   - 导出数据报告

---

## 💡 提示

1. **测试环境**: 始终使用 Stripe 测试模式
2. **真实数据**: 使用真实域名获得准确的在线状态
3. **Webhook**: 本地开发需要 ngrok 等工具
4. **性能**: 首次同步可能较慢，后续会更快
5. **浏览器**: 推荐使用 Chrome/Edge 最新版本

---

## 📞 需要帮助？

如果遇到问题：
1. 查看浏览器控制台（F12）
2. 查看服务器日志
3. 检查网络请求（Network 标签）
4. 参考 `TESTING_GUIDE.md` 详细文档
5. 查看 `PHASE3_SUMMARY.md` 技术细节

---

**祝测试顺利！🎉**

