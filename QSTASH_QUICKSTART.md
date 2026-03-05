# 🚀 QStash 快速开始指南

## ⚡ 5 分钟快速配置

### Step 1: 获取 QStash 凭证 (2 分钟)

1. 访问 https://console.upstash.com/
2. 使用 GitHub 登录
3. 点击左侧 "QStash"
4. 复制以下凭证：
   - `QSTASH_TOKEN`
   - `QSTASH_CURRENT_SIGNING_KEY`
   - `QSTASH_NEXT_SIGNING_KEY`

---

### Step 2: 配置环境变量 (1 分钟)

#### 本地开发
在 `.env.local` 添加：

```env
# QStash 配置
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=qstash_xxxxxxxxxxxxxxxxxxxxx
QSTASH_CURRENT_SIGNING_KEY=sig_xxxxxxxxxxxxxxxxxxxxx
QSTASH_NEXT_SIGNING_KEY=sig_xxxxxxxxxxxxxxxxxxxxx

# 应用 URL
NEXT_PUBLIC_APP_URL=http://localhost:3003
```

#### Vercel 生产环境
在 Vercel Dashboard → Settings → Environment Variables 添加相同的变量，但修改：

```env
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

---

### Step 3: 部署到 Vercel (1 分钟)

```bash
git add .
git commit -m "feat: migrate to QStash for cron jobs"
git push origin master
```

等待 Vercel 自动部署完成。

---

### Step 4: 设置调度任务 (1 分钟)

部署完成后，运行：

```bash
npx tsx scripts/setup-qstash-schedules.ts
```

**输出示例**:
```
🔧 Setting up QStash schedules...
📍 App URL: https://your-domain.vercel.app

Creating sync-sites schedule...
✅ Sync schedule created: scd_xxxxx

Creating store-metrics schedule...
✅ Metrics schedule created: scd_xxxxx

🎉 All schedules created successfully!

📋 Schedule IDs (save these for future reference):
- Sync Sites: scd_xxxxx
- Store Metrics: scd_xxxxx
```

**保存这些 Schedule IDs！**

---

### Step 5: 验证 (1 分钟)

#### 5.1 查看调度列表
```bash
npx tsx scripts/manage-qstash.ts list
```

#### 5.2 在 QStash Dashboard 查看
访问: https://console.upstash.com/qstash

点击 "Schedules" 查看已创建的调度。

#### 5.3 查看执行日志
在 QStash Dashboard → Logs 查看执行历史。

---

## ✅ 完成！

现在您的站点将：
- ✅ 每 6 小时自动同步一次
- ✅ 每天凌晨存储指标
- ✅ 失败自动重试 3 次
- ✅ 完全免费（500 次/天）

---

## 📋 常用命令

```bash
# 列出所有调度
npx tsx scripts/manage-qstash.ts list

# 查看调度详情
npx tsx scripts/manage-qstash.ts get <scheduleId>

# 暂停调度
npx tsx scripts/manage-qstash.ts pause <scheduleId>

# 恢复调度
npx tsx scripts/manage-qstash.ts resume <scheduleId>

# 删除调度
npx tsx scripts/manage-qstash.ts delete <scheduleId>
```

---

## 🐛 故障排查

### 问题 1: "QSTASH_TOKEN is not set"

**解决**:
```bash
# 检查 .env.local 文件
cat .env.local | grep QSTASH

# 确保变量已设置
echo $QSTASH_TOKEN
```

### 问题 2: 调度未执行

**检查**:
1. 访问 QStash Dashboard → Logs
2. 查看错误信息
3. 确认 URL 正确
4. 确认签名验证通过

### 问题 3: 签名验证失败

**解决**:
1. 确认 `QSTASH_CURRENT_SIGNING_KEY` 和 `QSTASH_NEXT_SIGNING_KEY` 正确
2. 在 Vercel 环境变量中重新设置
3. 重新部署

---

## 📊 调度频率说明

| 任务 | 频率 | Cron 表达式 | 说明 |
|------|------|------------|------|
| 同步站点 | 每 6 小时 | `0 */6 * * *` | 00:00, 06:00, 12:00, 18:00 |
| 存储指标 | 每天 1 次 | `0 0 * * *` | 每天 00:00 |

**每日总调用**: 4 + 1 = 5 次  
**免费额度**: 500 次/天  
**剩余额度**: 495 次/天 ✅

---

## 🎯 下一步

1. ✅ 监控第一次执行
2. ✅ 查看执行日志
3. ✅ 验证数据同步
4. ✅ 根据需要调整频率

---

**配置时间**: 5 分钟  
**状态**: ✅ 完成  
**成本**: 免费





