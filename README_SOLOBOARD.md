# 🎯 SoloBoard - 多 SaaS 监控仪表板

> 一个仪表板，监控所有业务 | One Dashboard, All Your SaaS

[![Next.js](https://img.shields.io/badge/Next.js-16.1.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📖 项目简介

SoloBoard 是一个为独立开发者和小团队打造的多 SaaS 监控解决方案。无需在多个后台之间切换，一个仪表板即可监控所有业务数据。

### 核心特性

✅ **6 大平台集成**
- Google Analytics 4 - 流量分析
- Stripe - 支付数据
- Lemon Squeezy - 订阅管理
- Shopify - 电商数据
- Uptime Monitor - 站点监控
- Custom API - 自定义集成

✅ **AI 智能周报**
- GPT-4 驱动的数据分析
- 自动生成洞察和建议
- 支持日报、周报、月报
- 邮件自动发送

✅ **异常报警系统**
- 4 种报警类型（宕机、响应慢、收入下降、流量激增）
- 3 种通知渠道（Email、Telegram、Webhook）
- 智能冷却期机制
- 完整的报警历史

✅ **团队协作**
- 多团队管理
- 4 种角色权限（Owner、Admin、Editor、Viewer）
- 站点共享
- 成员邀请

✅ **自定义指标**
- 支持任意 REST API
- 灵活的认证方式
- JSON 路径提取
- JavaScript 转换函数

✅ **现代化 UI**
- 九宫格布局
- 拖拽排序
- 实时数据刷新
- 趋势图表

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/soloboard.git
cd soloboard
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local` 并填写必要的配置：

```bash
# 数据库
DATABASE_URL=postgresql://...

# 认证
BETTER_AUTH_SECRET=your-secret

# 加密密钥
ENCRYPTION_KEY=your-encryption-key

# OpenAI (AI 周报)
OPENAI_API_KEY=sk-proj-xxx

# Resend (邮件通知)
RESEND_API_KEY=re_xxx

# Cron 保护
CRON_SECRET=your-cron-secret
```

### 4. 数据库迁移

```bash
npm run db:generate
npm run db:push
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3002

---

## 📚 文档

- [快速开始指南](GET_STARTED.md) - 5 分钟快速上手
- [Phase 3 完成报告](PHASE3_COMPLETE.md) - 最新功能详解
- [Phase 3 快速启动](PHASE3_QUICKSTART.md) - 部署指南
- [Phase 3 总结](PHASE3_SUMMARY.md) - 项目统计

---

## 🏗️ 技术架构

### 技术栈

- **框架**: Next.js 16.1.0 (App Router)
- **UI**: React 19 + TailwindCSS
- **数据库**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **认证**: Better Auth
- **数据获取**: SWR
- **图表**: Recharts
- **拖拽**: @dnd-kit
- **AI**: OpenAI GPT-4

### 项目结构

```
soloboard/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── soloboard/           # SoloBoard API
│   │   │   ├── sites/           # 站点管理
│   │   │   ├── alerts/          # 报警系统
│   │   │   ├── reports/         # AI 报告
│   │   │   ├── teams/           # 团队协作
│   │   │   └── custom-api/      # 自定义 API
│   │   └── cron/                # 定时任务
│   └── [locale]/(dashboard)/    # 仪表板页面
├── src/
│   ├── components/              # React 组件
│   │   └── soloboard/          # SoloBoard 组件
│   ├── config/                  # 配置文件
│   │   └── db/                 # 数据库配置
│   ├── shared/
│   │   ├── lib/                # 工具库
│   │   └── services/           # 业务服务
│   │       └── soloboard/      # SoloBoard 服务
├── migrations/                  # 数据库迁移
├── docs/                        # 文档
└── public/                      # 静态资源
```

---

## 🔧 API 端点

### 站点管理
- `POST /api/soloboard/sites/add` - 添加站点
- `GET /api/soloboard/sites` - 获取站点列表
- `DELETE /api/soloboard/sites/[id]` - 删除站点
- `GET /api/soloboard/sites/[id]/history` - 获取历史数据

### 报警系统
- `POST /api/soloboard/alerts/rules` - 创建报警规则
- `GET /api/soloboard/alerts/history` - 获取报警历史

### AI 报告
- `POST /api/soloboard/reports/generate` - 生成 AI 报告
- `GET /api/soloboard/reports` - 获取报告列表

### 团队协作
- `POST /api/soloboard/teams` - 创建团队
- `POST /api/soloboard/teams/[teamId]/invite` - 邀请成员
- `POST /api/soloboard/teams/[teamId]/share` - 共享站点

### 自定义 API
- `POST /api/soloboard/custom-api/test` - 测试配置
- `POST /api/soloboard/custom-api/add` - 添加站点

### Cron Jobs
- `GET /api/cron/sync-sites` - 同步所有站点（每 10 分钟）
- `GET /api/cron/check-alerts` - 检查报警规则（每 5 分钟）

---

## 🎨 功能演示

### 1. 九宫格仪表板
```
┌─────────┬─────────┬─────────┐
│ Site 1  │ Site 2  │ Site 3  │
│ GA4     │ Stripe  │ Shopify │
├─────────┼─────────┼─────────┤
│ Site 4  │ Site 5  │ Site 6  │
│ Lemon   │ Custom  │ Uptime  │
├─────────┼─────────┼─────────┤
│ Site 7  │ Site 8  │ Site 9  │
│   +     │         │         │
└─────────┴─────────┴─────────┘
```

### 2. 实时数据刷新
- 自动每 30 秒刷新
- SWR 缓存优化
- lastSnapshot 秒开

### 3. 趋势图表
- 过去 7 天数据
- 收入、流量、性能趋势
- 交互式图表

### 4. AI 智能周报
```
📊 整体摘要
在过去 7 天中，您的 5 个站点总收入为 $12,345...

💡 关键洞察
• Site A 收入增长 45%，表现优异
• Site B 流量激增 120%
• Site C 响应时间较慢（2500ms）

🚀 优化建议
• 优化 Site C 的页面加载速度
• 检查 Site B 的服务器性能
• 继续保持 Site A 的运营策略
```

---

## 🔐 安全特性

1. **AES-256-CBC 加密**: 所有 API 密钥加密存储
2. **身份验证**: Better Auth 保护所有端点
3. **Cron 保护**: CRON_SECRET 保护定时任务
4. **权限控制**: 细粒度的团队权限管理
5. **数据隔离**: 用户数据完全隔离

---

## 📊 支持的平台

| 平台 | 状态 | 主要指标 |
|------|------|----------|
| Google Analytics 4 | ✅ | 活跃用户、浏览量、会话数 |
| Stripe | ✅ | 收入、交易数、客户数 |
| Lemon Squeezy | ✅ | 销售额、订单、MRR、订阅数 |
| Shopify | ✅ | 销售额、订单、库存、待处理订单 |
| Uptime Monitor | ✅ | 响应时间、在线状态 |
| Custom API | ✅ | 自定义指标（任意 REST API） |

---

## 🚀 部署

### Vercel 部署（推荐）

1. Fork 本项目
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署完成！

Cron Jobs 会自动配置（读取 `vercel.json`）

### Docker 部署

```bash
# 构建镜像
docker build -t soloboard .

# 运行容器
docker run -p 3002:3002 --env-file .env.local soloboard
```

### 手动部署

```bash
# 构建
npm run build

# 启动
npm start
```

---

## 🧪 测试

```bash
# 运行测试
npm test

# 测试覆盖率
npm run test:coverage

# E2E 测试
npm run test:e2e
```

---

## 📈 性能指标

- **同步成功率**: > 95%
- **报警响应时间**: < 5 分钟
- **AI 报告生成**: < 30 秒
- **API 响应时间**: < 500ms
- **页面加载时间**: < 2 秒

---

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📝 开发路线图

### ✅ Phase 1: 数据基础层（已完成）
- [x] 数据库 Schema 设计
- [x] 加密存储
- [x] 基础平台集成（GA4、Stripe、Uptime）
- [x] 数据同步服务

### ✅ Phase 2: 前端仪表板（已完成）
- [x] 九宫格布局
- [x] 拖拽排序
- [x] 实时刷新
- [x] 趋势图表

### ✅ Phase 3: 高级功能（已完成）
- [x] Lemon Squeezy 集成
- [x] Shopify 集成
- [x] AI 智能周报
- [x] 异常报警系统
- [x] 自定义指标
- [x] 团队协作

### 🔜 Phase 4: 企业功能（计划中）
- [ ] 更多平台集成（PayPal、Cloudflare）
- [ ] 移动端 App
- [ ] 实时 WebSocket 推送
- [ ] 高级数据分析
- [ ] 自定义仪表板布局

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Better Auth](https://www.better-auth.com/) - 认证解决方案
- [SWR](https://swr.vercel.app/) - 数据获取库
- [Recharts](https://recharts.org/) - 图表库
- [dnd-kit](https://dndkit.com/) - 拖拽库

---

## 📞 联系方式

- **项目主页**: https://github.com/yourusername/soloboard
- **问题反馈**: https://github.com/yourusername/soloboard/issues
- **邮箱**: your-email@example.com

---

**Made with ❤️ by Solo Developers**

⭐ 如果这个项目对你有帮助，请给个 Star！
























