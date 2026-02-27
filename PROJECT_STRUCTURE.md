# Digital Heirloom 项目结构文档

## 📁 项目根目录结构

```
d:\AIsoftware\shipany_Digital Heirloom\
├── .env.local                    # 环境变量配置（本地开发）
├── .env.example.txt             # 环境变量示例
├── .gitignore                   # Git 忽略文件
├── components.json              # Shadcn UI 组件配置
├── Dockerfile                   # Docker 容器配置
├── LICENSE                      # 许可证文件
├── package.json                 # Node.js 依赖配置
├── postcss.config.mjs           # PostCSS 配置
├── README.md                    # 项目说明文档
├── source.config.ts             # 源码配置
├── tsconfig.json                # TypeScript 配置
├── vercel.json                  # Vercel 部署配置
├── wrangler.toml.example        # Cloudflare Workers 配置示例
│
├── content\                     # 内容文件（MDX）
│   └── [16个 .mdx 文件]
│
├── public\                      # 静态资源
│   ├── _headers                 # 静态文件头配置
│   ├── robots.txt               # 搜索引擎爬虫配置
│   ├── sitemap.xml              # 网站地图
│   └── imgs\                    # 图片资源
│       ├── icons\               # 图标
│       └── logos\               # Logo
│
├── scripts\                     # 脚本文件
│   ├── [54个 .ts 文件]          # TypeScript 脚本
│   ├── [7个 .ps1 文件]          # PowerShell 脚本
│   ├── [3个 .sh 文件]           # Shell 脚本
│   ├── migrate-admin-audit-logs.sql    # 数据库迁移脚本
│   └── migrate-system-alerts.sql       # 数据库迁移脚本
│
├── src\                         # 源代码目录
│   ├── app\                     # Next.js App Router 页面和 API
│   ├── config\                  # 配置文件
│   ├── core\                    # 核心功能模块
│   ├── extensions\              # 扩展功能
│   ├── shared\                  # 共享组件和工具
│   ├── themes\                  # 主题文件
│   └── [其他配置文件]
│
├── supabase\                    # Supabase 配置
│   └── [2个 .ts 文件]
│
└── [文档文件]
    ├── ADMIN_DASHBOARD_*.md     # 管理员界面文档
    ├── BENEFICIARY_*.md          # 受益人相关文档
    ├── API_ROUTES_*.md          # API 路由文档
    └── [其他文档]
```

---

## 📂 核心目录详细结构

### 1. `src/app/` - Next.js App Router

```
src/app/
├── [locale]\                    # 国际化路由
│   ├── (admin)\                # 管理员路由组
│   │   └── admin\
│   │       └── digital-heirloom\
│   │           ├── page.tsx                    # 主看板
│   │           ├── vaults\
│   │           │   └── page.tsx                 # 金库管理
│   │           ├── compensations\
│   │           │   └── page.tsx                 # 补偿审计
│   │           ├── costs\
│   │           │   └── page.tsx                 # 成本监控
│   │           ├── security\
│   │           │   └── page.tsx                 # 安全监控
│   │           ├── alerts\
│   │           │   └── page.tsx                 # 报警历史
│   │           └── reports\
│   │               └── page.tsx                # 自定义报表
│   │
│   ├── (dashboard)\            # 用户仪表板路由组
│   │   └── digital-heirloom\
│   │       ├── beneficiaries\
│   │       │   ├── page.tsx                     # 受益人管理
│   │       │   └── inheritance-center\
│   │       │       ├── page.tsx                 # 继承中心（解密页面）
│   │       │       └── _components\
│   │       │           └── decryption-preview.tsx
│   │       └── [其他用户页面]
│   │
│   ├── (landing)\              # 落地页路由组
│   │   └── [各种公开页面]
│   │
│   └── inherit\                # 受益人继承路由（公开）
│       ├── [token]\
│       │   └── page.tsx                         # Token 验证和重定向
│       └── error\
│           └── page.tsx                         # 错误页面
│
└── api\                        # API 路由
    ├── admin\
    │   └── digital-heirloom\
    │       ├── stats\
    │       │   └── route.ts                     # 统计信息 API
    │       ├── vaults\
    │       │   ├── route.ts                     # 金库列表 API
    │       │   ├── export\
    │       │   │   └── route.ts                 # 数据导出 API
    │       │   ├── batch-compensate\
    │       │   │   └── route.ts                 # 批量补偿 API
    │       │   └── [vaultId]\
    │       │       ├── grant-compensation\
    │       │       │   └── route.ts             # 补偿操作 API
    │       │       ├── pause\
    │       │       │   └── route.ts             # 暂停 API
    │       │       ├── reset-heartbeat\
    │       │       │   └── route.ts             # 重置心跳 API
    │       │       └── trigger-now\
    │       │           └── route.ts             # 立即触发 API
    │       ├── compensations\
    │       │   └── route.ts                     # 补偿审计日志 API
    │       ├── costs\
    │       │   └── route.ts                     # 成本监控 API
    │       ├── security\
    │       │   └── route.ts                     # 安全监控 API
    │       ├── alerts\
    │       │   └── route.ts                     # 报警历史 API
    │       └── reports\
    │           └── route.ts                     # 自定义报表 API
    │
    ├── cron\                    # Cron Job API
    │   ├── dead-man-switch-check\
    │   │   └── route.ts                         # 死信开关检查
    │   ├── system-health-check\
    │   │   └── route.ts                         # 系统健康检查
    │   └── cost-alerts-check\
    │       └── route.ts                         # 成本报警检查
    │
    └── digital-heirloom\
        ├── vault\
        │   ├── create\
        │   │   └── route.ts                     # 创建金库 API
        │   ├── update\
        │   │   └── route.ts                     # 更新金库 API
        │   └── get\
        │       └── route.ts                     # 获取金库 API
        │
        └── beneficiaries\
            ├── add\
            │   └── route.ts                     # 添加受益人 API
            ├── list\
            │   └── route.ts                     # 受益人列表 API
            ├── decrypt\
            │   └── route.ts                     # 解密 API
            ├── verify-fragment\
            │   └── route.ts                     # 验证 Fragment API
            └── inheritance-center\
                └── route.ts                     # 继承中心信息 API
```

---

### 2. `src/shared/` - 共享组件和工具

```
src/shared/
├── blocks\                     # 页面块组件
│   ├── common\                 # 通用块组件
│   ├── dashboard\              # 仪表板块组件
│   └── generator\              # 生成器块组件
│
├── components\                 # React 组件
│   ├── admin\
│   │   └── digital-heirloom\
│   │       ├── alert-banner.tsx                 # 报警横幅
│   │       ├── alerts-table.tsx                 # 报警表格
│   │       ├── batch-compensation-form.tsx      # 批量补偿表单
│   │       ├── compensation-form.tsx           # 补偿表单
│   │       ├── compensation-logs-table.tsx      # 补偿日志表格
│   │       ├── cost-alert-gauge.tsx             # 成本预警仪表盘
│   │       ├── cost-monitoring.tsx               # 成本监控组件
│   │       ├── dashboard-content.tsx             # 看板内容
│   │       ├── high-risk-vaults-table.tsx       # 高风险金库表格
│   │       ├── security-monitoring.tsx           # 安全监控组件
│   │       ├── stats-cards.tsx                  # 统计卡片
│   │       ├── vaults-management.tsx             # 金库管理组件
│   │       └── reports.tsx                      # 报表组件
│   │
│   ├── digital-heirloom\
│   │   ├── beneficiary-form.tsx                # 受益人表单
│   │   ├── feature-lock.tsx                    # 功能锁定组件
│   │   ├── upgrade-prompt.tsx                  # 升级提示组件
│   │   └── [其他组件]
│   │
│   └── ui\                     # UI 基础组件（Shadcn）
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── textarea.tsx
│       ├── badge.tsx
│       ├── card.tsx
│       └── [其他 UI 组件]
│
├── config\                     # 配置文件
│   └── digital-heirloom-plans.ts                # 计划配置
│
├── hooks\                      # React Hooks
│   └── [各种自定义 Hooks]
│
├── lib\                        # 工具库
│   ├── api-auth.ts                             # API 认证
│   ├── beneficiary-auth.ts                     # 受益人认证
│   ├── digital-heirloom-plan-limits.ts         # 计划限制检查
│   ├── encryption.ts                           # 加密/解密函数
│   ├── file-encryption.ts                      # 文件加密
│   ├── pdf-fragment-parser.ts                  # PDF Fragment 解析
│   ├── recovery-kit.ts                         # 恢复包生成
│   ├── resp.ts                                 # API 响应工具
│   ├── storage-utils.ts                        # 存储工具
│   └── streaming-crypto-helper.ts              # 流式加密辅助
│
├── models\                     # 数据模型
│   ├── beneficiary.ts                          # 受益人模型
│   ├── dead-man-switch-event.ts                # 死信开关事件模型
│   ├── digital-vault.ts                        # 数字金库模型
│   └── user.ts                                 # 用户模型
│
└── services\                   # 服务层
    ├── digital-heirloom\
    │   ├── email-service.ts                    # 邮件服务
    │   └── email-templates.ts                  # 邮件模板
    ├── email.ts                                 # 邮件服务接口
    ├── rbac.ts                                  # RBAC 权限服务
    └── storage.ts                               # 存储服务接口
```

---

### 3. `src/core/` - 核心功能模块

```
src/core/
├── db\                         # 数据库
│   └── index.ts                                # 数据库连接
│
├── i18n\                       # 国际化
│   └── navigation.ts                           # 导航工具
│
├── rbac\                       # 权限控制
│   └── permission.ts                           # 权限定义和检查
│
└── theme\                      # 主题
    └── index.ts                                # 主题配置
```

---

### 4. `src/config/` - 配置文件

```
src/config/
├── db\
│   └── schema.ts                                # 数据库 Schema 定义
│
├── locale\
│   └── messages\
│       ├── en\                                  # 英文翻译
│       ├── zh\                                  # 中文翻译
│       └── fr\                                  # 法文翻译
│           ├── admin\
│           │   └── sidebar.json                # 管理员侧边栏
│           ├── digital-heirloom.json            # Digital Heirloom 翻译
│           ├── landing.json                    # 落地页翻译
│           └── [其他翻译文件]
│
└── index.ts                                     # 配置入口
```

---

### 5. `scripts/` - 脚本文件

```
scripts/
├── 数据库相关\
│   ├── migrate-admin-audit-logs.sql            # 审计日志表迁移
│   ├── migrate-system-alerts.sql               # 系统报警表迁移
│   ├── init-rbac.ts                            # RBAC 初始化
│   └── set-admin-user.ts                       # 设置管理员用户
│
├── 测试相关\
│   ├── test-admin-apis.ts                      # 管理员 API 测试
│   ├── test-admin-simple.ts                    # 简单测试脚本
│   ├── test-phase-4-7.ts                       # Phase 4-7 测试
│   └── [其他测试脚本]
│
├── 配置相关\
│   ├── configure-creem-db.ts                   # Creem 数据库配置
│   ├── configure-resend-db.ts                  # Resend 数据库配置
│   └── [其他配置脚本]
│
└── 监控相关\
    ├── monitor-system-health.ts                 # 系统健康监控
    └── monitor-cost-alerts.ts                  # 成本监控报警
```

---

## 🗄️ 数据库表结构

### 核心表

1. **user** - 用户表
2. **digital_vaults** - 数字金库表
3. **beneficiaries** - 受益人表
4. **heartbeat_logs** - 心跳日志表
5. **dead_man_switch_events** - 死信开关事件表
6. **email_notifications** - 邮件通知表

### 管理员相关表

7. **admin_audit_logs** - 管理员审计日志表
8. **system_alerts** - 系统报警历史记录表

### 权限相关表

9. **role** - 角色表
10. **permission** - 权限表
11. **user_role** - 用户角色关联表
12. **role_permission** - 角色权限关联表

---

## 🔑 关键文件说明

### API 路由文件

| 文件路径 | 功能 |
|---------|------|
| `src/app/api/admin/digital-heirloom/stats/route.ts` | 统计信息 API |
| `src/app/api/admin/digital-heirloom/vaults/route.ts` | 金库列表 API |
| `src/app/api/admin/digital-heirloom/vaults/batch-compensate/route.ts` | 批量补偿 API |
| `src/app/api/admin/digital-heirloom/vaults/export/route.ts` | 数据导出 API |
| `src/app/api/admin/digital-heirloom/compensations/route.ts` | 补偿审计日志 API |
| `src/app/api/admin/digital-heirloom/costs/route.ts` | 成本监控 API |
| `src/app/api/admin/digital-heirloom/security/route.ts` | 安全监控 API |
| `src/app/api/admin/digital-heirloom/alerts/route.ts` | 报警历史 API |
| `src/app/api/admin/digital-heirloom/reports/route.ts` | 自定义报表 API |
| `src/app/api/digital-heirloom/beneficiaries/decrypt/route.ts` | 受益人解密 API |
| `src/app/api/cron/dead-man-switch-check/route.ts` | 死信开关检查 Cron |
| `src/app/api/cron/system-health-check/route.ts` | 系统健康检查 Cron |
| `src/app/api/cron/cost-alerts-check/route.ts` | 成本报警检查 Cron |

### 页面组件文件

| 文件路径 | 功能 |
|---------|------|
| `src/app/[locale]/(admin)/admin/digital-heirloom/page.tsx` | 管理员主看板 |
| `src/app/[locale]/(admin)/admin/digital-heirloom/vaults/page.tsx` | 金库管理页面 |
| `src/app/[locale]/(admin)/admin/digital-heirloom/compensations/page.tsx` | 补偿审计页面 |
| `src/app/[locale]/(admin)/admin/digital-heirloom/costs/page.tsx` | 成本监控页面 |
| `src/app/[locale]/(admin)/admin/digital-heirloom/security/page.tsx` | 安全监控页面 |
| `src/app/[locale]/(admin)/admin/digital-heirloom/alerts/page.tsx` | 报警历史页面 |
| `src/app/[locale]/(admin)/admin/digital-heirloom/reports/page.tsx` | 自定义报表页面 |
| `src/app/[locale]/(dashboard)/digital-heirloom/beneficiaries/page.tsx` | 受益人管理页面 |
| `src/app/[locale]/(dashboard)/digital-heirloom/beneficiaries/inheritance-center/page.tsx` | 继承中心（解密页面） |
| `src/app/[locale]/inherit/[token]/page.tsx` | 受益人 Token 验证页面 |

### 核心工具库文件

| 文件路径 | 功能 |
|---------|------|
| `src/shared/lib/encryption.ts` | 加密/解密函数 |
| `src/shared/lib/recovery-kit.ts` | 恢复包生成 |
| `src/shared/lib/pdf-fragment-parser.ts` | PDF Fragment 解析 |
| `src/shared/lib/beneficiary-auth.ts` | 受益人认证 |
| `src/shared/lib/digital-heirloom-plan-limits.ts` | 计划限制检查 |
| `src/core/rbac/permission.ts` | 权限定义和检查 |
| `src/config/db/schema.ts` | 数据库 Schema 定义 |

### 数据库迁移脚本

| 文件路径 | 功能 |
|---------|------|
| `scripts/migrate-admin-audit-logs.sql` | 创建管理员审计日志表 |
| `scripts/migrate-system-alerts.sql` | 创建系统报警历史记录表 |

---

## 📊 功能模块划分

### 1. 用户端功能模块

- **金库管理** (`src/app/[locale]/(dashboard)/digital-heirloom/`)
  - 创建/更新金库
  - 受益人管理
  - 心跳签到
  - 继承中心（解密）

### 2. 管理员功能模块

- **看板和统计** (`src/app/[locale]/(admin)/admin/digital-heirloom/`)
  - 主看板
  - 统计信息
  - 高风险金库监控

- **金库管理** (`src/app/[locale]/(admin)/admin/digital-heirloom/vaults/`)
  - 金库列表
  - 搜索和筛选
  - 批量操作
  - 数据导出

- **补偿管理** (`src/app/[locale]/(admin)/admin/digital-heirloom/compensations/`)
  - 补偿操作
  - 审计日志
  - 操作记录查询

- **监控功能**
  - 成本监控 (`costs/`)
  - 安全监控 (`security/`)
  - 报警历史 (`alerts/`)

- **报表功能** (`reports/`)
  - 概览报表
  - 转化报表
  - 补偿报表
  - 活动报表

### 3. 自动化功能模块

- **Cron Jobs** (`src/app/api/cron/`)
  - 死信开关检查
  - 系统健康检查
  - 成本报警检查

- **监控脚本** (`scripts/`)
  - 系统健康监控
  - 成本监控报警

---

## 🔧 配置文件

### 环境变量配置

- `.env.local` - 本地开发环境变量
- `.env.example.txt` - 环境变量示例

### 部署配置

- `vercel.json` - Vercel 部署配置（包含 Cron Jobs）
- `Dockerfile` - Docker 容器配置
- `wrangler.toml.example` - Cloudflare Workers 配置示例

### 构建配置

- `package.json` - Node.js 依赖和脚本
- `tsconfig.json` - TypeScript 编译配置
- `postcss.config.mjs` - PostCSS 配置
- `components.json` - Shadcn UI 组件配置

---

## 📚 文档文件

### 管理员相关文档

- `ADMIN_DASHBOARD_DESIGN.md` - 管理员界面设计方案
- `ADMIN_DASHBOARD_COMPLETE.md` - 管理员界面完整实施总结
- `ADMIN_DASHBOARD_PHASE1_COMPLETE.md` - Phase 1 完成总结
- `ADMIN_DASHBOARD_PHASE2_COMPLETE.md` - Phase 2 完成总结
- `ADMIN_DASHBOARD_PHASE3_COMPLETE.md` - Phase 3 完成总结
- `ADMIN_DASHBOARD_PHASE4_COMPLETE.md` - Phase 4 完成总结
- `ADMIN_DASHBOARD_PHASE5_COMPLETE.md` - Phase 5 完成总结
- `ADMIN_LOGIN_TEST_GUIDE.md` - 管理员登录和测试指南
- `ADMIN_TESTING_SUMMARY.md` - 测试总结

### 受益人相关文档

- `BENEFICIARY_DECRYPTION_GUIDE.md` - 受益人解密操作指南
- `BENEFICIARY_DECRYPTION_SIMULATION.md` - 受益人解密操作模拟指南

### API 文档

- `API_ROUTES_DIGITAL_HEIRLOOM.md` - API 路由文档
- `SHIPANY_API_CONFIG.md` - ShipAny API 配置
- `SHIPANY_INTEGRATION_PRINCIPLE.md` - ShipAny 集成原则

### 其他文档

- `ENVIRONMENT_VARIABLES.md` - 环境变量说明
- `DEPLOY_EDGE_FUNCTION_VERCEL.md` - Vercel Edge Function 部署指南
- `UI_API_INTEGRATION_COMPLETE.md` - UI API 集成完成报告

---

## 🎯 关键目录说明

### `src/app/` - Next.js App Router
- 包含所有页面和 API 路由
- 使用文件系统路由
- 支持国际化（`[locale]`）
- 路由组用于组织代码（`(admin)`, `(dashboard)`, `(landing)`）

### `src/shared/` - 共享代码
- 可复用的组件、工具、模型
- 不依赖特定路由
- 可在客户端和服务器端使用

### `src/core/` - 核心功能
- 数据库连接
- 权限系统
- 国际化
- 主题配置

### `src/config/` - 配置文件
- 数据库 Schema
- 国际化翻译
- 业务配置

### `scripts/` - 脚本文件
- 数据库迁移
- 测试脚本
- 配置脚本
- 监控脚本

---

## 📈 项目统计

- **总文件数**: 约 533 个文件
- **TypeScript 文件**: 约 279 个 `.tsx` + 150 个 `.ts`
- **JSON 配置文件**: 约 99 个
- **文档文件**: 约 20+ 个 Markdown 文件
- **脚本文件**: 约 65 个（包括 SQL、TS、PS1、SH）

---

## 🔍 快速查找指南

### 查找 API 路由
- 路径：`src/app/api/`
- 按功能分类：`admin/`, `digital-heirloom/`, `cron/`

### 查找页面组件
- 路径：`src/app/[locale]/`
- 按用户类型分类：`(admin)/`, `(dashboard)/`, `(landing)/`

### 查找共享组件
- 路径：`src/shared/components/`
- 按功能分类：`admin/`, `digital-heirloom/`, `ui/`

### 查找工具函数
- 路径：`src/shared/lib/`
- 功能：加密、认证、解析、工具函数

### 查找数据模型
- 路径：`src/shared/models/`
- 功能：数据库操作封装

### 查找配置文件
- 路径：`src/config/`
- 功能：数据库 Schema、国际化、业务配置

---

**最后更新**: 项目结构文档已创建 ✅
