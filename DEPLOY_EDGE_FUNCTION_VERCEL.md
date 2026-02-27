# Edge Function 部署指南（Vercel + Supabase 环境）

**环境**: Vercel + Supabase  
**部署方式**: 使用 Supabase Dashboard（推荐）或 Supabase CLI

---

## 🚀 方法 1: 使用 Supabase Dashboard（最简单，推荐）

如果你的 Supabase 项目是通过 Vercel 集成的，最简单的方式是直接在 Supabase Dashboard 中部署 Edge Function。

### Step 1: 访问 Supabase Dashboard

1. 访问 https://supabase.com/dashboard
2. 登录你的账号
3. 选择项目: `vkafrwwskupsyibrvcvd`

### Step 2: 创建 Edge Function

1. 在左侧菜单中，点击 **Edge Functions**
2. 点击 **Create a new function** 按钮
3. 函数名称输入: `dead-man-check`
4. 点击 **Create function**

### Step 3: 复制代码

1. 打开项目中的文件: `supabase/functions/dead-man-check/index.ts`
2. 复制全部内容
3. 粘贴到 Supabase Dashboard 的代码编辑器中

### Step 4: 设置环境变量（Secrets）

在函数编辑器中，找到 **Settings** 或 **Secrets** 标签页，添加以下环境变量：

#### 必需的环境变量

```
RESEND_API_KEY=your-resend-api-key
```

#### 可选的环境变量（Pro 版物理资产需要）

```
SHIPANY_API_KEY=e50e2b3d-a412-4f90-95eb-aafc9837b9ea
SHIPANY_API_URL=https://api.shipany.io/v1
SHIPANY_SENDER_NAME=Digital Heirloom Vault
SHIPANY_SENDER_PHONE=+852-XXXX-XXXX
SHIPANY_SENDER_EMAIL=noreply@afterglow.app
SHIPANY_SENDER_ADDRESS_LINE1=Your Warehouse Address
SHIPANY_SENDER_CITY=Hong Kong
SHIPANY_SENDER_ZIP_CODE=000000
SHIPANY_SENDER_COUNTRY_CODE=HKG
```

#### 开发环境（可选，启用 Mock 模式）

```
ENVIRONMENT=development
```

**注意**: 在 Dashboard 中设置 Secrets 的方式：
- 点击函数设置中的 **Secrets** 标签
- 点击 **Add secret**
- 输入 Key 和 Value
- 点击 **Save**

### Step 5: 部署函数

1. 点击编辑器右上角的 **Deploy** 按钮
2. 等待部署完成（通常几秒钟）
3. 看到 "Function deployed successfully" 提示

### Step 6: 验证部署

部署成功后，你应该能看到：
- 函数状态: **Active**
- 函数 URL: `https://vkafrwwskupsyibrvcvd.supabase.co/functions/v1/dead-man-check`

---

## 🔧 方法 2: 使用 Supabase CLI（如果已安装）

如果你已经安装了 Supabase CLI，也可以使用命令行部署：

### Step 1: 安装 Supabase CLI（如果未安装）

```powershell
# 使用 npm 安装
npm install -g supabase

# 或使用 pnpm
pnpm add -g supabase
```

### Step 2: 登录 Supabase

```powershell
supabase login
```

这会打开浏览器，让你登录 Supabase 账号。

### Step 3: 链接项目

```powershell
supabase link --project-ref vkafrwwskupsyibrvcvd
```

### Step 4: 设置环境变量

```powershell
# 必需
supabase secrets set RESEND_API_KEY="your-resend-api-key"

# 可选（Pro 版物理资产需要）
supabase secrets set SHIPANY_API_KEY="e50e2b3d-a412-4f90-95eb-aafc9837b9ea"
supabase secrets set SHIPANY_API_URL="https://api.shipany.io/v1"
supabase secrets set SHIPANY_SENDER_NAME="Digital Heirloom Vault"
supabase secrets set SHIPANY_SENDER_PHONE="+852-XXXX-XXXX"
supabase secrets set SHIPANY_SENDER_EMAIL="noreply@afterglow.app"
supabase secrets set SHIPANY_SENDER_ADDRESS_LINE1="Your Warehouse Address"
supabase secrets set SHIPANY_SENDER_CITY="Hong Kong"
supabase secrets set SHIPANY_SENDER_ZIP_CODE="000000"
supabase secrets set SHIPANY_SENDER_COUNTRY_CODE="HKG"
```

### Step 5: 部署 Edge Function

```powershell
supabase functions deploy dead-man-check --no-verify-jwt
```

**注意**: `--no-verify-jwt` 标志允许使用 Service Role Key 调用函数，这对于 Cron Job 调用是必需的。

---

## 🧪 测试部署

部署完成后，运行测试脚本：

```powershell
# 设置环境变量
$env:SUPABASE_URL="https://vkafrwwskupsyibrvcvd.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# 运行完整测试
npx tsx scripts/run-complete-test.ts
```

或者使用 PowerShell 脚本手动调用：

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
.\scripts\call-edge-function-manually.ps1
```

---

## 📋 在 Vercel 中配置环境变量（如果需要）

如果你的 Next.js 应用部署在 Vercel 上，并且需要从 Vercel 调用 Edge Function，可以在 Vercel Dashboard 中设置环境变量：

### 在 Vercel Dashboard 中：

1. 进入你的项目
2. 点击 **Settings** → **Environment Variables**
3. 添加以下变量：

```
SUPABASE_URL=https://vkafrwwskupsyibrvcvd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**注意**: 
- Edge Function 的环境变量（Secrets）是在 Supabase Dashboard 中设置的，不是在 Vercel 中
- Vercel 的环境变量只用于 Next.js 应用本身
- Edge Function 运行在 Supabase 的服务器上，不依赖 Vercel 的环境变量

---

## 🔄 Vercel 集成说明

### Vercel 和 Supabase 的关系

- **Vercel**: 托管你的 Next.js 前端应用
- **Supabase**: 提供数据库和 Edge Functions 后端服务
- **Edge Functions**: 运行在 Supabase 的服务器上，不运行在 Vercel 上

### 调用 Edge Function 的方式

从 Vercel 部署的 Next.js 应用中调用 Edge Function：

```typescript
// 在 Next.js API Route 或 Server Component 中
const response = await fetch(
  `${process.env.SUPABASE_URL}/functions/v1/dead-man-check`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({}),
  }
);
```

---

## 📊 配置 Cron Job（定时任务）

部署 Edge Function 后，可以配置定时任务自动运行：

### 在 Supabase SQL Editor 中执行：

```sql
-- 启用 pg_net 扩展（如果未启用，可能需要管理员权限）
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 创建定时任务（每天 UTC 0:00 执行）
SELECT cron.schedule(
  'dead-man-check-daily',
  '0 0 * * *',  -- 每天 UTC 0:00
  $$
  SELECT net.http_post(
    url := 'https://vkafrwwskupsyibrvcvd.supabase.co/functions/v1/dead-man-check',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

**注意**: 
- 将 `YOUR_SERVICE_ROLE_KEY` 替换为实际的 Service Role Key
- 如果 `pg_net` 扩展未启用，可能需要联系 Supabase 支持启用

---

## ⚠️ 常见问题

### 1. "Function not found" 错误

**原因**: Edge Function 未部署或名称不匹配

**解决**: 
- 在 Supabase Dashboard 中检查 Edge Functions 列表
- 确认函数名称是否为 `dead-man-check`
- 确认函数状态为 **Active**

### 2. "Unauthorized" 错误

**原因**: Service Role Key 不正确

**解决**: 
- 检查 `SUPABASE_SERVICE_ROLE_KEY` 环境变量
- 确认使用的是 Service Role Key（不是 Anon Key）
- Service Role Key 可以在 Supabase Dashboard → Settings → API 中找到

### 3. "RESEND_API_KEY not found" 错误

**原因**: Resend API Key 未在 Supabase Secrets 中设置

**解决**: 
- 在 Supabase Dashboard → Edge Functions → dead-man-check → Settings → Secrets 中设置
- 或使用 CLI: `supabase secrets set RESEND_API_KEY="your-key"`

### 4. 如何在 Vercel 中查看 Edge Function 日志？

**答案**: Edge Function 日志不在 Vercel 中，而是在 Supabase Dashboard 中：
- 进入 Supabase Dashboard → Edge Functions → dead-man-check
- 点击 **Logs** 标签页
- 查看实时日志和错误信息

---

## 📝 快速检查清单

- [ ] 在 Supabase Dashboard 中创建 Edge Function `dead-man-check`
- [ ] 复制 `supabase/functions/dead-man-check/index.ts` 的代码
- [ ] 设置必需的环境变量（RESEND_API_KEY）
- [ ] 设置可选的环境变量（SHIPANY_API_KEY 等，如果需要）
- [ ] 部署 Edge Function
- [ ] 验证函数状态为 **Active**
- [ ] 运行测试脚本验证功能
- [ ] （可选）配置 Cron Job 定时任务

---

## 🎯 推荐流程

对于 Vercel + Supabase 环境，推荐使用 **Supabase Dashboard** 方式部署：

1. ✅ 最简单，无需安装 CLI
2. ✅ 可视化界面，易于管理
3. ✅ 可以直接查看日志和错误
4. ✅ 适合不熟悉命令行的开发者

---

**最后更新**: 2025-01-15  
**适用环境**: Vercel + Supabase



