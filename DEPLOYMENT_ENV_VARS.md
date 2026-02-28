# 部署环境变量配置指南

## QStash 配置（Upstash Cron Jobs）

在你的部署平台（GitHub Actions、Vercel、Railway 等）设置以下环境变量：

```bash
# QStash Configuration
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=eyJVc2VySUQiOiIzNmRlMTBmYy04MzI5LTQ0MjEtOTRjYS0wNjE5MGM0YmEwYTYiLCJQYXNzd29yZCI6ImY3ODM0YWI5YWFjNjQ2ODQ4Y2YzNzliYWI4ODkwMWI0In0=
QSTASH_CURRENT_SIGNING_KEY=sig_4w6GALcpeNi9M46uAEkKVMCFbT7A
QSTASH_NEXT_SIGNING_KEY=sig_6cFSqmcZpCDciLEHfWnxqoZYGJiQ
```

## 数据库配置（Neon）

```bash
# Neon Database
DATABASE_URL=postgresql://[username]:[password]@[host]/[database]?sslmode=require
```

## 存储配置（Vercel Blob）

```bash
# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_[your_token]
```

## 其他必要的环境变量

根据你的项目需求，可能还需要：

```bash
# Authentication
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=https://yourdomain.com

# Email (Resend)
RESEND_API_KEY=re_[your_key]

# Payment (Creem)
CREEM_API_KEY=your-creem-key
CREEM_WEBHOOK_SECRET=your-webhook-secret

# Cron Secret (for manual testing)
CRON_SECRET=your-random-secret
```

## GitHub Actions 配置

如果你使用 GitHub Actions 部署，需要在仓库设置中添加 Secrets：

1. 进入 GitHub 仓库
2. Settings → Secrets and variables → Actions
3. 点击 "New repository secret"
4. 添加上述所有环境变量

## Docker 部署

如果直接使用 Docker 部署，可以创建 `.env` 文件或使用 `-e` 参数：

```bash
docker build -t soloboard .
docker run -p 3000:3000 \
  -e QSTASH_URL=https://qstash.upstash.io \
  -e QSTASH_TOKEN=your_token \
  -e QSTASH_CURRENT_SIGNING_KEY=your_key \
  -e QSTASH_NEXT_SIGNING_KEY=your_key \
  -e DATABASE_URL=your_db_url \
  -e BLOB_READ_WRITE_TOKEN=your_blob_token \
  soloboard
```

## 注意事项

⚠️ **重要**：
- 永远不要将真实的环境变量提交到 Git 仓库
- Dockerfile 中的占位符仅用于构建时，运行时会被真实值覆盖
- 确保在生产环境中使用强密钥和安全的连接字符串
- QStash 签名密钥用于验证 Cron 请求的真实性，必须正确配置

## 验证配置

部署后，可以通过以下方式验证：

1. 检查 Cron 端点：`GET /api/cron/cost-alerts-check` （需要 Bearer token）
2. 查看应用日志确认环境变量已加载
3. 在 Upstash Console 中测试 QStash 调度

