# Digital Heirloom 管理员界面设计方案

## 📋 方案概述

本方案旨在设计一个**高效、安全、成本可控**的管理员界面，核心原则是：
- **异常管理**：只关注需要人工介入的 1% 异常情况，其余 99% 由系统自动化运行
- **成本控制**：监控资源消耗，防止滥用
- **安全优先**：权限分级，审计日志，异常报警

---

## 一、管理员界面功能规划

### 1.1 核心看板 (Dashboard Overview)

**路由**: `/admin/digital-heirloom`

**功能模块**:

#### A. 高风险预警卡片 (Urgent Alerts)
- **显示内容**：
  - `PENDING_VERIFICATION` 状态且剩余宽限期 < 48 小时的金库数量
  - 按计划等级排序（Pro > Base > Free）
  - 点击跳转到详细列表

#### B. 实时统计卡片 (Real-time Stats)
- **活跃度统计**：
  - Free / Base / Pro 会员分布（饼图）
  - 本周新增用户趋势（折线图）
- **系统健康度**：
  - Resend 邮件发送量（今日/本周/本月）
  - 数据库连接数（当前/峰值）
  - 存储使用量（总存储/平均每用户）

#### C. 今日活动摘要 (Today's Activity)
- 今日触发的 Dead Man's Switch 数量
- 今日发送的邮件数量（成功/失败）
- 今日 ShipAny 物流订单数量

---

### 1.2 高风险金库列表 (High-Risk Vaults)

**路由**: `/admin/digital-heirloom/vaults?urgent=true`

**功能**:
- **筛选条件**：
  - 状态：`PENDING_VERIFICATION`（默认）
  - 计划等级：Free / Base / Pro（可多选）
  - 剩余时间：< 24h / < 48h / < 7天
- **排序**：按剩余时间升序（最紧急的在前）
- **显示字段**：
  - 用户邮箱（可点击查看详情）
  - Vault ID（可复制）
  - 计划等级（Badge 显示）
  - 当前状态（Badge 显示，红色高亮）
  - 剩余宽限期（小时数，红色警示）
  - 解密进度（已使用次数 / 限制次数）
  - 受益人数量
  - 最后活跃时间

**操作按钮**：
- **+30 Days**：延长订阅期限（调用补偿 API）
- **Reset Decrypt**：重置解密次数（调用补偿 API）
- **Pause**：暂停 Vault（防止误触发）
- **View Details**：查看完整详情（新标签页）

---

### 1.3 全量金库管理 (All Vaults)

**路由**: `/admin/digital-heirloom/vaults`

**功能**:
- **搜索**：支持邮箱或 Vault ID 搜索
- **筛选**：
  - 状态：active / pending_verification / triggered / released
  - 计划等级：free / base / pro
  - 创建时间范围
- **分页**：每页 20 条（可配置）
- **批量操作**（Super Admin 权限）：
  - 批量延长订阅
  - 批量导出数据（CSV）

---

### 1.4 补偿审计日志 (Compensation Audit Log)

**路由**: `/admin/digital-heirloom/compensations`

**功能**:
- **显示内容**：
  - 管理员 ID / 姓名
  - 操作时间
  - 补偿类型（延期/重置解密/增加解密）
  - Vault ID
  - 补偿原因
  - 补偿前/后状态对比
- **筛选**：
  - 按管理员筛选
  - 按时间范围筛选
  - 按补偿类型筛选

---

### 1.5 成本监控 (Cost Monitoring)

**路由**: `/admin/digital-heirloom/costs`

**功能**:
- **邮件成本**：
  - Resend 月度消耗（当前/上限）
  - 邮件发送趋势（折线图）
  - 按计划等级统计邮件发送量
- **存储成本**：
  - 总存储使用量（MB）
  - 按计划等级统计存储分布
  - 存储增长趋势
- **物流成本**（Pro 用户）：
  - ShipAny 订单数量（本月）
  - 物流费用统计

**报警阈值**：
- 邮件发送量 > 500 封/天 → 黄色警告
- 邮件发送量 > 1000 封/天 → 红色警告 + 自动通知
- 存储使用量 > 90% → 红色警告

---

### 1.6 安全监控 (Security Monitoring)

**路由**: `/admin/digital-heirloom/security`

**功能**:
- **异常解密尝试**：
  - 显示多次失败的解密尝试（IP 地址、时间、Vault ID）
  - 自动标记可疑 IP
- **访问日志**：
  - 受益人访问记录（Token、时间、IP）
  - 异常访问模式检测

---

## 二、自动化 vs 人工干预流程

### 2.1 100% 自动化任务

| 任务 | 触发方式 | 执行频率 | 备注 |
|------|----------|----------|------|
| **状态流转** | Cron Job | 每日 UTC 00:00 | 自动检测 `lastSeenAt`，切换状态 |
| **邮件提醒** | 状态变更时 | 实时 | 自动调用 Resend 发送模板邮件 |
| **心跳更新** | 用户操作 | 实时 | 用户签到后自动更新 `lastSeenAt` |
| **Token 生成** | Dead Man's Switch 触发 | 实时 | 自动为受益人生成 Release Token |

### 2.2 半自动化任务（需要人工审核）

| 任务 | 自动化部分 | 人工干预部分 |
|------|------------|--------------|
| **ShipAny 物流** | 检测到 Pro 用户 `TRIGGERED` 后自动下单 | 地址校验失败时，管理员手动联系受益人修正地址 |
| **邮件发送失败** | 自动重试 3 次 | 3 次失败后，管理员手动检查邮箱有效性 |

### 2.3 100% 人工干预任务

| 任务 | 触发场景 | 操作方式 |
|------|----------|----------|
| **工作失误补偿** | 用户投诉或系统 Bug | 管理员在界面点击"补偿"按钮 |
| **高风险拦截** | 异常频繁的解密尝试 | 管理员手动锁定 Vault 或 IP |
| **状态回滚** | 误触发 `TRIGGERED` | 管理员手动将状态改回 `ACTIVE` |
| **批量操作** | 系统维护或促销活动 | Super Admin 执行批量补偿 |

---

## 三、成本控制策略

### 3.1 内存与计算资源优化

**问题**：随着用户增长，Cron Job 可能一次性加载数万用户导致 OOM

**解决方案**：
- **流式处理**：使用数据库游标（Cursor）分批查询
- **分批处理**：每次处理 100 个 Vault，处理完一批再查询下一批
- **索引优化**：确保 `lastSeenAt`、`status` 字段有索引

**代码示例**：
```typescript
// 分批处理，避免内存溢出
const BATCH_SIZE = 100;
let offset = 0;
let hasMore = true;

while (hasMore) {
  const vaults = await db()
    .select()
    .from(digitalVaults)
    .where(conditions)
    .limit(BATCH_SIZE)
    .offset(offset);
  
  if (vaults.length === 0) {
    hasMore = false;
    break;
  }
  
  // 处理这批数据
  await processBatch(vaults);
  
  offset += BATCH_SIZE;
}
```

### 3.2 存储成本控制

**策略**：
- **严格执行限制**：Free 10KB / Base 50MB / Pro 500MB
- **定期清理**：删除超过 1 年未活跃的 Free 用户数据（需用户同意）
- **压缩优化**：加密前对数据进行压缩（如果适用）

### 3.3 邮件成本控制

**策略**：
- **频率限制**：
  - Free 用户：最长提醒周期（180 天），减少邮件频率
  - Base/Pro 用户：按计划配置的提醒频率
- **批处理发送**：使用现有的 `sendEmailsInBatches` 函数，避免 Rate Limit
- **监控报警**：当日发送量 > 500 封时自动报警

### 3.4 物流成本控制（Pro 用户）

**策略**：
- **预付费机制**：Pro 用户订阅费用必须覆盖 ShipAny 邮寄费用
- **地址验证**：下单前验证地址有效性，减少退回率
- **批量处理**：同一地区的订单合并处理（如果 ShipAny 支持）

---

## 四、数据库安全与报警

### 4.1 权限分级 (RBAC)

**角色定义**：

| 角色 | 权限 | 使用场景 |
|------|------|----------|
| **ReadOnly Admin** | `admin.digital-heirloom.read` | 仅查看报表和统计 |
| **Support Admin** | `admin.digital-heirloom.read` + `admin.digital-heirloom.compensate` | 执行补偿操作 |
| **Super Admin** | `admin.digital-heirloom.*` | 所有操作，包括批量操作和系统参数修改 |

**权限检查**：
```typescript
// 在 API 路由中使用
await requirePermission({
  code: PERMISSIONS.DIGITAL_HEIRLOOM_COMPENSATE,
  redirectUrl: '/admin/no-permission',
  locale,
});
```

### 4.2 审计日志

**记录内容**：
- 管理员 ID
- 操作时间
- 操作类型（补偿/暂停/状态修改）
- Vault ID
- 操作前/后状态
- 操作原因

**存储位置**：
- 数据库表：`admin_audit_logs`（新建）
- 或使用现有的 `dead_man_switch_events` 表扩展

### 4.3 报警机制

#### A. 资源报警

**触发条件**：
- 数据库 CPU > 80%
- 数据库存储占用 > 90%
- 内存使用 > 85%

**通知方式**：
- Slack Webhook（如果配置）
- 邮件通知管理员
- 在管理员界面显示红色警告横幅

#### B. 业务报警

**触发条件**：
- 单日内 `TRIGGERED` 状态用户异常激增（超过预设阈值，如 50 个）
- Resend 邮件发送量 > 1000 封/天
- ShipAny API 调用失败率 > 5%

**处理方式**：
- 自动锁定 Cron Job（防止误触发）
- 发送紧急通知给 Super Admin
- 记录异常事件到审计日志

---

## 五、管理员周工作计划

### 周一：系统审计日

**工作重点**：检查上周所有 `TRIGGERED` 成功案例

**具体行动**：
1. 查看上周 `TRIGGERED` 状态的金库列表
2. 核实 ShipAny 物流妥投情况（Pro 用户）
3. 检查是否有地址错误导致的退回订单
4. 记录异常情况，反馈给技术团队

**时间分配**：1-2 小时

---

### 周二：用户关怀日

**工作重点**：关注高风险用户

**具体行动**：
1. 查看高风险预警列表（剩余 < 48 小时）
2. 优先处理 Pro 用户（成本最高）
3. 对即将失效的 Pro 用户进行必要的手工邮件跟进
4. 检查是否有用户投诉需要补偿

**时间分配**：1-2 小时

---

### 周三：成本评估日

**工作重点**：分析存储消耗和邮件发送量

**具体行动**：
1. 查看成本监控面板
2. 分析存储消耗趋势
3. 评估 Resend 邮件发送量
4. 计算当前各级会员的利润率
5. 如果 Free 用户增长过快，考虑调整策略

**时间分配**：1 小时

---

### 周四：补偿回顾日

**工作重点**：审核补偿日志，分析系统失误

**具体行动**：
1. 查看补偿审计日志
2. 分析补偿原因分类（系统 Bug / 用户投诉 / 促销活动）
3. 识别重复出现的系统失误
4. 反馈给技术团队进行修复
5. 更新操作手册（如果有）

**时间分配**：1 小时

---

### 周五：安全巡检日

**工作重点**：检查异常访问和解密记录

**具体行动**：
1. 查看安全监控面板
2. 检查 `access_logs` 中的异常解密记录
3. 识别可疑 IP 地址
4. 更新黑名单或安全策略
5. 检查数据库安全报警（CPU / 存储）

**时间分配**：1 小时

---

## 六、实现计划

### Phase 1: 核心看板和列表页面（优先级：高）

**任务清单**：
1. ✅ 创建管理员路由：`/admin/digital-heirloom`
2. ⏳ 创建统计 API：`GET /api/admin/digital-heirloom/stats`（已存在，需扩展）
3. ⏳ 创建高风险列表 API：`GET /api/admin/digital-heirloom/vaults?urgent=true`（已存在，需优化）
4. ⏳ 创建看板页面组件：`HighRiskVaultsTable`
5. ⏳ 创建统计卡片组件：`StatsCards`

**预计时间**：3-5 天

---

### Phase 2: 补偿功能和审计日志（优先级：高）

**任务清单**：
1. ✅ 补偿 API：`POST /api/admin/digital-heirloom/vaults/[vaultId]/grant-compensation`（已存在）
2. ⏳ 创建审计日志表：`admin_audit_logs`
3. ⏳ 在补偿 API 中记录审计日志
4. ⏳ 创建补偿审计页面：`/admin/digital-heirloom/compensations`

**预计时间**：2-3 天

---

### Phase 3: 成本监控和安全监控（优先级：中）

**任务清单**：
1. ⏳ 创建成本监控 API：`GET /api/admin/digital-heirloom/costs`
2. ⏳ 创建成本监控页面：`/admin/digital-heirloom/costs`
3. ⏳ 创建安全监控 API：`GET /api/admin/digital-heirloom/security`
4. ⏳ 创建安全监控页面：`/admin/digital-heirloom/security`

**预计时间**：3-4 天

---

### Phase 4: 报警机制（优先级：中）

**任务清单**：
1. ⏳ 创建报警检测脚本：`scripts/monitor-system-health.ts`
2. ⏳ 集成 Slack Webhook（可选）
3. ⏳ 在管理员界面显示报警横幅
4. ⏳ 创建报警历史记录页面

**预计时间**：2-3 天

---

### Phase 5: 批量操作和高级功能（优先级：低）

**任务清单**：
1. ⏳ 批量补偿功能（Super Admin）
2. ⏳ 数据导出功能（CSV）
3. ⏳ 高级筛选和搜索
4. ⏳ 自定义报表

**预计时间**：3-5 天

---

## 七、技术实现细节

### 7.1 API 路由结构

```
/api/admin/digital-heirloom/
  ├── stats                    # GET - 统计信息
  ├── costs                    # GET - 成本监控
  ├── security                 # GET - 安全监控
  ├── vaults                   # GET - 金库列表（已存在）
  │   └── [vaultId]/
  │       ├── grant-compensation  # POST - 补偿（已存在）
  │       ├── pause               # POST - 暂停（已存在）
  │       ├── reset-heartbeat     # POST - 重置心跳（已存在）
  │       └── trigger-now         # POST - 立即触发（已存在）
  └── compensations            # GET - 补偿审计日志
```

### 7.2 数据库 Schema 扩展

**新建表：`admin_audit_logs`**

```sql
CREATE TABLE admin_audit_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES "user"(id),
  action_type TEXT NOT NULL, -- 'compensate', 'pause', 'reset', etc.
  vault_id TEXT REFERENCES digital_vaults(id),
  beneficiary_id TEXT REFERENCES beneficiaries(id),
  action_data JSONB, -- 操作详情（补偿类型、值等）
  reason TEXT, -- 操作原因
  before_state JSONB, -- 操作前状态
  after_state JSONB, -- 操作后状态
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_admin_audit_admin ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_vault ON admin_audit_logs(vault_id);
CREATE INDEX idx_admin_audit_created ON admin_audit_logs(created_at);
```

### 7.3 组件结构

```
src/app/[locale]/(admin)/admin/digital-heirloom/
  ├── page.tsx                    # 看板首页
  ├── vaults/
  │   └── page.tsx                # 金库列表页
  ├── compensations/
  │   └── page.tsx                # 补偿审计日志页
  ├── costs/
  │   └── page.tsx                # 成本监控页
  └── security/
      └── page.tsx                # 安全监控页

src/shared/components/admin/digital-heirloom/
  ├── high-risk-vaults-table.tsx  # 高风险金库表格
  ├── stats-cards.tsx              # 统计卡片
  ├── compensation-form.tsx        # 补偿操作表单
  └── cost-charts.tsx              # 成本图表
```

---

## 八、侧边栏配置更新

**文件**: `src/config/locale/messages/*/admin/sidebar.json`

**更新内容**：
```json
{
  "title": "Digital Heirloom",
  "icon": "Shield",
  "children": [
    {
      "title": "Dashboard",
      "url": "/admin/digital-heirloom",
      "icon": "LayoutDashboard"
    },
    {
      "title": "Vaults",
      "url": "/admin/digital-heirloom/vaults",
      "icon": "Vault"
    },
    {
      "title": "Compensations",
      "url": "/admin/digital-heirloom/compensations",
      "icon": "Gift"
    },
    {
      "title": "Costs",
      "url": "/admin/digital-heirloom/costs",
      "icon": "DollarSign"
    },
    {
      "title": "Security",
      "url": "/admin/digital-heirloom/security",
      "icon": "ShieldAlert"
    },
    {
      "title": "Shipping Requests",
      "url": "/admin/shipping-requests",
      "icon": "Package"
    }
  ]
}
```

---

## 九、权限配置

**新增权限**：

```typescript
// src/core/rbac/permission.ts
export const PERMISSIONS = {
  // ... 现有权限
  
  // Digital Heirloom Admin
  DIGITAL_HEIRLOOM_READ: 'admin.digital-heirloom.read',
  DIGITAL_HEIRLOOM_COMPENSATE: 'admin.digital-heirloom.compensate',
  DIGITAL_HEIRLOOM_PAUSE: 'admin.digital-heirloom.pause',
  DIGITAL_HEIRLOOM_EXPORT: 'admin.digital-heirloom.export',
  DIGITAL_HEIRLOOM_ADMIN: 'admin.digital-heirloom.*',
};
```

**角色权限分配**：

- **ReadOnly Admin**：`admin.digital-heirloom.read`
- **Support Admin**：`admin.digital-heirloom.read` + `admin.digital-heirloom.compensate`
- **Super Admin**：`admin.digital-heirloom.*`

---

## 十、成本熔断器实现

**脚本**: `scripts/monitor-cost-alerts.ts`

**功能**：
- 检测单日邮件发送量
- 检测 ShipAny API 调用次数
- 超过阈值时发送报警邮件
- 记录到审计日志

**运行方式**：
- 作为 Cron Job 每小时运行一次
- 或集成到现有的 `dead-man-switch-check` Cron Job 中

---

## 十一、问题与解答

### Q1: 如何确保不改变 ShipAny 结构？

**A**: 
- 所有新功能都在 `/admin/digital-heirloom/` 路径下
- 使用现有的 DashboardLayout 和组件库
- 复用现有的 API 认证和权限检查机制
- 不修改 ShipAny 核心代码

### Q2: 如何处理大量用户时的性能问题？

**A**:
- 使用数据库索引优化查询
- 分批处理，避免一次性加载大量数据
- 使用分页和虚拟滚动（如果列表很长）
- 缓存统计信息（Redis，如果可用）

### Q3: 如何确保管理员操作的安全性？

**A**:
- 所有操作都需要权限检查
- 记录完整的审计日志
- 敏感操作（如批量操作）需要 Super Admin 权限
- 操作前显示确认对话框

---

## 十二、下一步行动

### 立即开始（本周）

1. **创建看板页面**：`/admin/digital-heirloom`
2. **创建高风险列表组件**：`HighRiskVaultsTable`
3. **扩展统计 API**：添加更多统计指标

### 下周计划

1. **创建补偿审计日志页面**
2. **实现成本监控功能**
3. **创建报警检测脚本**

### 后续优化

1. **批量操作功能**
2. **数据导出功能**
3. **自定义报表**

---

**方案状态**: ✅ 已批准，准备开始实施

**预计总时间**: 2-3 周（分阶段实施）
