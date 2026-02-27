# Digital Heirloom 文件删除清单

## ✅ 保留的文件（不删除）

### Digital Heirloom 保留文件：
- `src/app/[locale]/(dashboard)/digital-heirloom/layout.tsx`
- `src/app/[locale]/(dashboard)/digital-heirloom/dashboard/page.tsx`
- `src/app/[locale]/(dashboard)/digital-heirloom/check-in/page.tsx`
- `src/app/[locale]/(dashboard)/digital-heirloom/settings/page.tsx`
- `src/app/[locale]/(admin)/admin/digital-heirloom/page.tsx`
- `src/app/api/admin/digital-heirloom/` - 整个目录
- `src/shared/services/digital-heirloom/` - 整个目录
- `src/config/locale/messages/en/digital-heirloom.json`
- `src/config/locale/messages/zh/digital-heirloom.json`
- `src/config/locale/messages/fr/digital-heirloom.json`

### Shipany 保留文件：
- `src/shared/services/shipany/` - 完整保留
- `src/app/api/admin/shipping/` - 完整保留
- `src/shared/models/shipping-log.ts`
- `src/shared/models/shipping-log-types.ts`

---

## 🗑️ 需要删除的文件

### 1. 前端页面

#### Dashboard 页面（部分删除）
```
src/app/[locale]/(dashboard)/digital-heirloom/
├── vault/page.tsx                                          ❌ 删除
├── print-recovery-kit/page.tsx                             ❌ 删除
├── beneficiaries/page.tsx                                  ❌ 删除
├── beneficiaries/inheritance-center/page.tsx               ❌ 删除
├── beneficiaries/inheritance-center/_components/
│   └── decryption-preview.tsx                              ❌ 删除
└── setup/
    ├── step-1-master-password/page.tsx                     ❌ 删除
    ├── step-2-assets/page.tsx                              ❌ 删除
    ├── step-3-beneficiaries/page.tsx                       ❌ 删除
    └── step-4-trigger/page.tsx                             ❌ 删除
```

#### Admin 页面（部分删除）
```
src/app/[locale]/(admin)/admin/digital-heirloom/
├── vaults/page.tsx                                         ❌ 删除
├── alerts/page.tsx                                         ❌ 删除
├── costs/page.tsx                                          ❌ 删除
├── compensations/page.tsx                                  ❌ 删除
├── reports/page.tsx                                        ❌ 删除
└── security/page.tsx                                       ❌ 删除
```

#### 继承页面
```
src/app/[locale]/inherit/
├── [token]/page.tsx                                        ❌ 删除
└── error/page.tsx                                          ❌ 删除
```

---

### 2. API 路由

```
src/app/api/digital-heirloom/                               ❌ 删除整个目录
├── vault/
├── assets/
├── beneficiaries/
├── heartbeat/
├── recovery-kit/
└── release/

src/app/api/cron/
├── dead-man-switch-check/route.ts                          ❌ 删除
├── cost-alerts-check/route.ts                              ❌ 删除
└── system-health-check/route.ts                            ❌ 删除
```

---

### 3. 组件

```
src/shared/components/digital-heirloom/                     ❌ 删除整个目录
├── asset-entry-form.tsx
├── asset-uploader.tsx
├── beneficiary-email-simulator.tsx
├── beneficiary-form.tsx
├── beneficiary-unlock.tsx
├── feature-lock.tsx
├── heirloom-document.tsx
├── recovery-kit-download.tsx
├── shipany-simulator.tsx
├── test-hub.tsx
├── upgrade-modal.tsx
└── upgrade-prompt.tsx

src/shared/components/admin/digital-heirloom/               ❌ 删除整个目录
├── alert-banner.tsx
├── alerts-table.tsx
├── batch-compensation-form.tsx
├── compensation-form.tsx
├── compensation-logs-table.tsx
├── cost-alert-gauge.tsx
├── cost-monitoring.tsx
├── dashboard-content.tsx
├── high-risk-vaults-table.tsx
├── reports.tsx
├── security-monitoring.tsx
├── stats-cards.tsx
└── vaults-management.tsx
```

---

### 4. 数据模型

```
src/shared/models/
├── beneficiary.ts                                          ❌ 删除
├── digital-vault.ts                                        ❌ 删除
├── dead-man-switch-event.ts                                ❌ 删除
└── heartbeat-log.ts                                        ❌ 删除
```

---

### 5. 工具库

```
src/shared/lib/
├── beneficiary-auth.ts                                     ❌ 删除
├── digital-heirloom-plan-limits.ts                         ❌ 删除
├── encryption.ts                                           ❌ 删除
├── file-encryption.ts                                      ❌ 删除
├── fragment-merger.ts                                      ❌ 删除
├── pdf-fragment-parser.ts                                  ❌ 删除
├── pdf-parser.ts                                           ❌ 删除
├── physical-sync-detector.ts                               ❌ 删除
├── recovery-kit.ts                                         ❌ 删除
├── recovery-kit-pdf.ts                                     ❌ 删除
├── site-crypto.ts                                          ❌ 删除
└── streaming-crypto-helper.ts                              ❌ 删除
```

---

### 6. 配置文件

```
src/shared/config/
└── digital-heirloom-plans.ts                               ❌ 删除

src/config/style/
└── heirloom-print.css                                      ❌ 删除
```

---

### 7. 脚本

```
scripts/
├── create-test-beneficiary.ts                              ❌ 删除
├── execute-digital-heirloom-migration.ts                   ❌ 删除
├── find-test-user-and-vault.ts                             ❌ 删除
├── simulate-heartbeat-workflow.ts                          ❌ 删除
├── test-digital-heirloom.ts                                ❌ 删除
├── test-encryption.ts                                      ❌ 删除
├── test-vault-setup.ts                                     ❌ 删除
└── test-vault-setup-simple.ts                              ❌ 删除
```

---

### 8. Supabase Edge Functions

```
supabase/functions/
├── dead-man-check/index.ts                                 ❌ 删除
└── cleanup-orphaned-files/index.ts                         ❌ 删除
```

---

### 9. 文档和配置

```
根目录：
├── API_ROUTES_DIGITAL_HEIRLOOM.md                          ❌ 删除
├── BENEFICIARY_DECRYPTION_SIMULATION.md                    ❌ 删除
├── drop_digital_heirloom_tables.sql                        ❌ 删除
├── env.digital-heirloom.example.txt                        ❌ 删除
└── FILES_TO_REMOVE_DIGITAL_HEIRLOOM.md                     ❌ 删除
```

---

### 10. 数据库 Schema 修改

**文件**: `src/config/db/schema.ts`

需要删除的表定义：
- `digitalVault`
- `vaultAsset`
- `beneficiary`
- `heartbeatLog`
- `deadManSwitchEvent`
- `assetReleaseLog`
- `compensationLog`

需要从 `user` 表中删除的字段：
- `lastCheckinDate`

---

## 📊 统计

- **前端页面**: 15 个文件
- **API 路由**: 整个 digital-heirloom 目录 + 3 个 cron 文件
- **组件**: 25 个文件
- **模型**: 4 个文件
- **工具库**: 12 个文件
- **配置**: 2 个文件
- **脚本**: 8 个文件
- **Edge Functions**: 2 个文件
- **文档**: 5 个文件
- **数据库表**: 7 个表 + 1 个字段

**总计**: 约 **73 个文件** + 数据库修改

---

## ⚠️ 删除前注意

1. 确保已备份重要数据
2. 删除后需要运行 `pnpm build` 检查编译错误
3. 检查是否有其他文件引用了这些被删除的模块
4. 更新导航菜单配置

---

**请确认是否批准删除？**
