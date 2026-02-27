# SoloBoard - 多站点监控仪表盘

**一屏看透 10 个站，把时间还给咖啡 ☕**

基于 ShipAny SaaS 框架构建的多站点监控系统，专为一人公司创业者设计。

---

## 🎯 项目简介

SoloBoard 是一个强大的多站点监控工具，允许您在一个仪表盘中监控 3-10 个网站的关键指标：

- 📊 **网站流量** - Google Analytics 4 实时数据
- 💰 **销售数据** - Stripe 今日收入和交易
- 🟢 **在线状态** - Uptime 监控和响应时间
- 📈 **趋势分析** - 历史数据和图表

**核心价值**: 解决一人公司创业者的"上下文切换"效率杀手问题。

---

## ✅ 当前状态

**版本**: v0.2.0  
**阶段**: Phase 1 & 2 完成 - 完整可用  
**完成时间**: 2026-02-06

### Phase 1 交付成果 ✅

✅ 数据库 Schema 设计（3 张表）  
✅ AES-256-CBC 加密系统  
✅ 平台集成服务（GA4, Stripe, Uptime）  
✅ 数据同步调度器  
✅ RESTful API 路由（5 个端点）  
✅ 完整文档和测试脚本

### Phase 2 交付成果 ✅

✅ 主仪表盘页面（SWR 实时刷新）  
✅ 九宫格布局（@dnd-kit 拖拽排序）  
✅ 站点卡片（动态指标显示）  
✅ 添加站点对话框（多平台支持）  
✅ 趋势图表（Recharts）  
✅ 历史数据 API  
✅ 删除站点 API

---

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 生成加密密钥

```bash
pnpm tsx scripts/generate-env-keys.ts
```

### 3. 配置环境变量

复制输出到 `.env.local` 文件，并填写数据库连接等信息。

### 4. 数据库迁移

```bash
pnpm db:push
```

### 5. 测试加密功能

```bash
pnpm tsx scripts/test-encryption.ts
```

### 6. 启动开发服务器

```bash
pnpm dev
```

**详细指南**: 请查看 [SOLOBOARD_QUICKSTART.md](./SOLOBOARD_QUICKSTART.md)

---

## 📚 文档

### 核心文档
- **[SOLOBOARD_README.md](./SOLOBOARD_README.md)** - 完整项目文档
- **[SOLOBOARD_QUICKSTART.md](./SOLOBOARD_QUICKSTART.md)** - 快速开始指南
- **[SOLOBOARD_COMPLETE_SUMMARY.md](./SOLOBOARD_COMPLETE_SUMMARY.md)** - 完整实施总结

### Phase 文档
- **[SOLOBOARD_PHASE1_SUMMARY.md](./SOLOBOARD_PHASE1_SUMMARY.md)** - Phase 1 实施总结
- **[SOLOBOARD_PHASE2_COMPLETE.md](./SOLOBOARD_PHASE2_COMPLETE.md)** - Phase 2 完整报告
- **[SOLOBOARD_DELIVERY_REPORT.md](./SOLOBOARD_DELIVERY_REPORT.md)** - Phase 1 交付报告

### 测试文档
- **[PHASE2_TESTING_GUIDE.md](./PHASE2_TESTING_GUIDE.md)** - Phase 2 测试指南
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - 详细测试指南
- **[START_HERE.md](./START_HERE.md)** - 快速启动

---

## 🏗️ 技术栈

- **框架**: Next.js 16.1.0 + React 19
- **数据库**: Neon Postgres (Serverless)
- **ORM**: Drizzle ORM
- **认证**: Better Auth
- **支付**: Creem
- **部署**: Vercel
- **UI**: Tailwind CSS + shadcn/ui

---

## 🔐 安全特性

- ✅ AES-256-CBC 加密算法
- ✅ 用户 API Key 加密存储
- ✅ 完整的身份验证
- ✅ 数据隔离和保护

---

## 📊 支持的平台

### 已实现
- ✅ Google Analytics 4
- ✅ Stripe
- ✅ Uptime 监控

### 计划中
- ⏳ Lemon Squeezy
- ⏳ Shopify
- ⏳ PayPal
- ⏳ Cloudflare Analytics

---

## 🎯 核心原则

**铁律**: ✅ **不改变 ShipAny 结构**

所有代码严格遵循 ShipAny 的目录规范和设计原则。

---

## 📈 开发路线图

- [x] **Phase 1**: 数据底座构建 ✅
- [x] **Phase 2**: 前端 Dashboard UI ✅
- [ ] **Phase 3**: 更多平台集成
- [ ] **Phase 4**: 高级功能（AI 周报、报警）
- [ ] **Phase 5**: 订阅计划

---

## 💡 核心功能

### 已实现（Phase 1 & 2）

#### 数据管理
- ✅ 站点管理（添加、删除、查询）
- ✅ API 配置加密存储
- ✅ 数据同步调度器
- ✅ 历史数据记录
- ✅ 同步日志追踪

#### UI/UX
- ✅ 九宫格监控面板
- ✅ 实时数据刷新（30秒自动）
- ✅ 拖拽排序
- ✅ 趋势图表
- ✅ 响应式设计

### 计划中（Phase 3+）

- ⏳ 更多平台集成（Lemon Squeezy, Shopify）
- ⏳ AI 智能周报
- ⏳ 异常报警（邮件/Telegram）
- ⏳ 自定义指标
- ⏳ 团队协作

---

## 🛠️ 开发命令

```bash
# 开发
pnpm dev

# 构建
pnpm build

# 数据库
pnpm db:generate    # 生成迁移
pnpm db:push        # 推送到数据库
pnpm db:studio      # 打开 Drizzle Studio

# 测试
pnpm tsx scripts/test-encryption.ts    # 测试加密
pnpm tsx scripts/generate-env-keys.ts  # 生成密钥
```

---

## 📝 环境变量

**必需的环境变量：**

```env
# 应用
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 数据库
DATABASE_URL=postgresql://user:password@host:5432/soloboard

# 认证
AUTH_SECRET=your-auth-secret

# SoloBoard 核心
ENCRYPTION_KEY=your-32-byte-encryption-key
CRON_SECRET=your-cron-secret

# 存储
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

**详细配置**: 请查看 [env.example.txt](./env.example.txt)

---

## 🔒 安全提示

⚠️ **重要**:
1. 不要将 `.env.local` 文件提交到 Git
2. 生产环境使用不同的密钥
3. 定期轮换 API 密钥
4. `ENCRYPTION_KEY` 泄露将导致所有用户的 API Key 暴露

---

## 📄 许可证

基于 ShipAny 框架构建，遵循 ShipAny LICENSE。

⚠️ **请勿公开发布 ShipAny 的代码。非法使用将被追究责任。**

[ShipAny LICENSE](./LICENSE)

---

## 🙏 致谢

- **ShipAny** - 提供强大的 SaaS 框架
- **Neon** - Serverless PostgreSQL 数据库
- **Vercel** - 部署和 Cron Jobs
- **Creem** - 全球支付解决方案

---

## 📞 支持

如有问题，请查看文档或提交 Issue。

**构建时间**: 2026-02-06  
**版本**: v0.1.0  
**状态**: Phase 1 完成 ✅
