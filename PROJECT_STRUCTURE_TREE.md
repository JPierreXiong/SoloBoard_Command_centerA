# Digital Heirloom 项目结构树状图

## 📁 完整目录树

```
shipany_Digital Heirloom/
│
├── 📄 配置文件
│   ├── package.json                    # 依赖和脚本
│   ├── tsconfig.json                  # TypeScript 配置
│   ├── next.config.mjs                # Next.js 配置
│   ├── postcss.config.mjs             # PostCSS 配置
│   ├── components.json                # Shadcn UI 配置
│   ├── vercel.json                    # Vercel 部署配置（含 Cron Jobs）
│   ├── Dockerfile                     # Docker 配置
│   └── .env.local                     # 环境变量（本地）
│
├── 📚 文档目录
│   ├── README.md                      # 项目说明
│   ├── ADMIN_DASHBOARD_*.md           # 管理员界面文档（5个文件）
│   ├── BENEFICIARY_*.md               # 受益人相关文档（2个文件）
│   ├── API_ROUTES_*.md                # API 路由文档
│   ├── ENVIRONMENT_VARIABLES.md       # 环境变量说明
│   └── PROJECT_STRUCTURE*.md          # 项目结构文档（本文件）
│
├── 📂 public/                         # 静态资源
│   ├── imgs/                          # 图片资源
│   │   ├── icons/                     # 图标
│   │   ├── logos/                     # Logo
│   │   └── [其他图片]
│   ├── robots.txt                     # SEO 配置
│   └── sitemap.xml                    # 网站地图
│
├── 📂 scripts/                        # 脚本文件（65个文件）
│   ├── migrate-*.sql                  # 数据库迁移脚本（2个）
│   ├── set-admin-user.ts              # 设置管理员
│   ├── init-rbac.ts                   # RBAC 初始化
│   ├── test-*.ts                      # 测试脚本（多个）
│   ├── monitor-*.ts                   # 监控脚本（2个）
│   └── [其他脚本文件]
│
├── 📂 src/                            # 源代码（533个文件）
│   │
│   ├── 📂 app/                        # Next.js App Router（141个文件）
│   │   │
│   │   ├── 📂 [locale]/              # 国际化路由
│   │   │   │
│   │   │   ├── 📂 (admin)/          # 管理员路由组
│   │   │   │   └── admin/
│   │   │   │       └── digital-heirloom/
│   │   │   │           ├── page.tsx                    # 主看板
│   │   │   │           ├── vaults/page.tsx            # 金库管理
│   │   │   │           ├── compensations/page.tsx      # 补偿审计
│   │   │   │           ├── costs/page.tsx             # 成本监控
│   │   │   │           ├── security/page.tsx          # 安全监控
│   │   │   │           ├── alerts/page.tsx            # 报警历史
│   │   │   │           └── reports/page.tsx           # 自定义报表
│   │   │   │
│   │   │   ├── 📂 (dashboard)/       # 用户仪表板路由组
│   │   │   │   └── digital-heirloom/
│   │   │   │       ├── dashboard/page.tsx              # 用户看板
│   │   │   │       ├── vault/page.tsx                  # 金库详情
│   │   │   │       ├── beneficiaries/
│   │   │   │       │   ├── page.tsx                   # 受益人管理
│   │   │   │       │   └── inheritance-center/
│   │   │   │       │       ├── page.tsx               # 继承中心（解密页面）⭐
│   │   │   │       │       └── _components/
│   │   │   │       │           └── decryption-preview.tsx
│   │   │   │       ├── check-in/page.tsx               # 心跳签到
│   │   │   │       ├── setup/                          # 设置向导
│   │   │   │       │   ├── step-1-master-password/
│   │   │   │       │   ├── step-2-assets/
│   │   │   │       │   ├── step-3-beneficiaries/
│   │   │   │       │   └── step-4-trigger/
│   │   │   │       └── settings/page.tsx               # 设置页面
│   │   │   │
│   │   │   ├── 📂 (landing)/         # 落地页路由组
│   │   │   │   └── [各种公开页面]
│   │   │   │
│   │   │   └── 📂 inherit/           # 受益人继承路由（公开）
│   │   │       ├── [token]/page.tsx                   # Token 验证和重定向
│   │   │       └── error/page.tsx                      # 错误页面
│   │   │
│   │   └── 📂 api/                   # API 路由（53个文件）
│   │       │
│   │       ├── 📂 admin/
│   │       │   └── digital-heirloom/
│   │       │       ├── stats/route.ts                 # 统计信息
│   │       │       ├── vaults/
│   │       │       │   ├── route.ts                  # 金库列表
│   │       │       │   ├── export/route.ts            # 数据导出
│   │       │       │   ├── batch-compensate/route.ts  # 批量补偿
│   │       │       │   └── [vaultId]/
│   │       │       │       ├── grant-compensation/route.ts
│   │       │       │       ├── pause/route.ts
│   │       │       │       ├── reset-heartbeat/route.ts
│   │       │       │       └── trigger-now/route.ts
│   │       │       ├── compensations/route.ts         # 补偿审计日志
│   │       │       ├── costs/route.ts                 # 成本监控
│   │       │       ├── security/route.ts              # 安全监控
│   │       │       ├── alerts/route.ts                # 报警历史
│   │       │       └── reports/route.ts                # 自定义报表
│   │       │
│   │       ├── 📂 cron/              # Cron Job API（3个文件）
│   │       │   ├── dead-man-switch-check/route.ts
│   │       │   ├── system-health-check/route.ts
│   │       │   └── cost-alerts-check/route.ts
│   │       │
│   │       └── 📂 digital-heirloom/
│   │           ├── vault/
│   │           │   ├── create/route.ts
│   │           │   ├── update/route.ts
│   │           │   └── get/route.ts
│   │           └── beneficiaries/
│   │               ├── add/route.ts
│   │               ├── decrypt/route.ts               # 解密 API ⭐
│   │               ├── inheritance-center/route.ts
│   │               └── verify-fragment/route.ts
│   │
│   ├── 📂 shared/                    # 共享代码（155个文件）
│   │   │
│   │   ├── 📂 components/            # React 组件（92个文件）
│   │   │   ├── admin/digital-heirloom/                # 管理员组件（13个）
│   │   │   │   ├── alert-banner.tsx
│   │   │   │   ├── alerts-table.tsx
│   │   │   │   ├── batch-compensation-form.tsx
│   │   │   │   ├── compensation-form.tsx
│   │   │   │   ├── compensation-logs-table.tsx
│   │   │   │   ├── cost-alert-gauge.tsx
│   │   │   │   ├── cost-monitoring.tsx
│   │   │   │   ├── dashboard-content.tsx
│   │   │   │   ├── high-risk-vaults-table.tsx
│   │   │   │   ├── security-monitoring.tsx
│   │   │   │   ├── stats-cards.tsx
│   │   │   │   ├── vaults-management.tsx
│   │   │   │   └── reports.tsx
│   │   │   │
│   │   │   ├── digital-heirloom/                     # Digital Heirloom 组件（12个）
│   │   │   │   ├── beneficiary-form.tsx
│   │   │   │   ├── feature-lock.tsx
│   │   │   │   └── upgrade-prompt.tsx
│   │   │   │
│   │   │   └── ui/                                   # UI 基础组件（Shadcn）
│   │   │       ├── button.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── input.tsx
│   │   │       ├── select.tsx
│   │   │       └── [其他 UI 组件]
│   │   │
│   │   ├── 📂 lib/                  # 工具库（28个文件）
│   │   │   ├── encryption.ts                        # 加密/解密 ⭐
│   │   │   ├── recovery-kit.ts                      # 恢复包生成 ⭐
│   │   │   ├── pdf-fragment-parser.ts                # PDF 解析 ⭐
│   │   │   ├── beneficiary-auth.ts                   # 受益人认证 ⭐
│   │   │   ├── digital-heirloom-plan-limits.ts      # 计划限制 ⭐
│   │   │   ├── file-encryption.ts
│   │   │   ├── storage-utils.ts
│   │   │   └── streaming-crypto-helper.ts
│   │   │
│   │   ├── 📂 models/               # 数据模型（16个文件）
│   │   │   ├── digital-vault.ts                      # 金库模型
│   │   │   ├── beneficiary.ts                       # 受益人模型
│   │   │   ├── dead-man-switch-event.ts             # 死信开关事件
│   │   │   └── heartbeat-log.ts                     # 心跳日志
│   │   │
│   │   ├── 📂 services/             # 服务层（16个文件）
│   │   │   ├── digital-heirloom/
│   │   │   │   ├── email-service.ts                 # 邮件服务
│   │   │   │   └── email-templates.ts                # 邮件模板
│   │   │   ├── email.ts                              # 邮件服务接口
│   │   │   ├── rbac.ts                               # RBAC 权限服务
│   │   │   └── storage.ts                            # 存储服务接口
│   │   │
│   │   └── 📂 blocks/                # 页面块组件（74个文件）
│   │       ├── dashboard/                            # 仪表板块
│   │       ├── common/                                # 通用块
│   │       └── generator/                             # 生成器块
│   │
│   ├── 📂 config/                   # 配置文件
│   │   ├── db/
│   │   │   └── schema.ts                             # 数据库 Schema ⭐
│   │   └── locale/messages/                          # 国际化翻译
│   │       ├── en/                                   # 英文（33个文件）
│   │       ├── zh/                                   # 中文（33个文件）
│   │       └── fr/                                   # 法文（33个文件）
│   │
│   ├── 📂 core/                     # 核心功能（14个文件）
│   │   ├── db/index.ts                               # 数据库连接
│   │   ├── rbac/permission.ts                        # 权限系统 ⭐
│   │   └── i18n/                                     # 国际化
│   │
│   └── 📂 extensions/               # 扩展功能
│       ├── email/                                    # 邮件扩展
│       ├── payment/                                  # 支付扩展
│       └── storage/                                  # 存储扩展
│
└── 📂 supabase/                     # Supabase 配置
    └── functions/                                    # Edge Functions
        ├── cleanup-orphaned-files/
        └── dead-man-check/
```

---

## 🎯 关键文件索引

### ⭐ 核心功能文件

#### 解密相关
- `src/app/[locale]/(dashboard)/digital-heirloom/beneficiaries/inheritance-center/page.tsx` - 解密页面
- `src/app/api/digital-heirloom/beneficiaries/decrypt/route.ts` - 解密 API
- `src/shared/lib/encryption.ts` - 加密/解密函数
- `src/shared/lib/pdf-fragment-parser.ts` - PDF Fragment 解析
- `src/shared/lib/recovery-kit.ts` - 恢复包生成

#### 管理员相关
- `src/app/[locale]/(admin)/admin/digital-heirloom/page.tsx` - 管理员主看板
- `src/app/api/admin/digital-heirloom/stats/route.ts` - 统计 API
- `src/shared/components/admin/digital-heirloom/` - 管理员组件（13个）

#### 数据库相关
- `src/config/db/schema.ts` - 数据库 Schema 定义
- `scripts/migrate-admin-audit-logs.sql` - 审计日志表迁移
- `scripts/migrate-system-alerts.sql` - 系统报警表迁移

#### 权限相关
- `src/core/rbac/permission.ts` - 权限定义和检查
- `scripts/init-rbac.ts` - RBAC 初始化
- `scripts/set-admin-user.ts` - 设置管理员用户

---

## 📊 文件统计

### 按类型分类

| 类型 | 数量 | 说明 |
|------|------|------|
| `.tsx` | ~279 | React 组件文件 |
| `.ts` | ~150 | TypeScript 代码文件 |
| `.json` | ~99 | 配置文件（翻译、配置等） |
| `.md` | ~20+ | Markdown 文档文件 |
| `.sql` | 2 | 数据库迁移脚本 |
| `.mdx` | 16 | MDX 内容文件 |

### 按功能分类

| 功能模块 | 文件数 | 主要目录 |
|---------|--------|---------|
| 管理员界面 | ~30 | `src/app/[locale]/(admin)/admin/digital-heirloom/` |
| 用户界面 | ~15 | `src/app/[locale]/(dashboard)/digital-heirloom/` |
| API 路由 | ~53 | `src/app/api/` |
| 共享组件 | ~92 | `src/shared/components/` |
| 工具库 | ~28 | `src/shared/lib/` |
| 数据模型 | ~16 | `src/shared/models/` |
| 服务层 | ~16 | `src/shared/services/` |
| 配置文件 | ~99 | `src/config/` |

---

## 🔍 快速导航

### 查找特定功能

#### 解密功能
```
src/app/[locale]/(dashboard)/digital-heirloom/beneficiaries/inheritance-center/
src/app/api/digital-heirloom/beneficiaries/decrypt/
src/shared/lib/encryption.ts
src/shared/lib/pdf-fragment-parser.ts
```

#### 管理员功能
```
src/app/[locale]/(admin)/admin/digital-heirloom/
src/app/api/admin/digital-heirloom/
src/shared/components/admin/digital-heirloom/
```

#### 数据库相关
```
src/config/db/schema.ts
scripts/migrate-*.sql
```

#### 权限系统
```
src/core/rbac/permission.ts
scripts/init-rbac.ts
scripts/set-admin-user.ts
```

---

## 📝 重要说明

1. **⭐ 标记**：表示关键文件，涉及核心功能
2. **路由组**：`(admin)`, `(dashboard)`, `(landing)` 用于组织代码，不影响 URL
3. **国际化**：所有页面都在 `[locale]` 路由下，支持多语言
4. **API 路由**：所有 API 都在 `src/app/api/` 目录下
5. **共享代码**：可复用的代码都在 `src/shared/` 目录下

---

**最后更新**: 项目结构树状图已创建 ✅
