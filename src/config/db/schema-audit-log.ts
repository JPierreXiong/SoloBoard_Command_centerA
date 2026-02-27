/**
 * 服务日志审计表
 * 记录 Pro 版用户的所有关键操作，用于审计和纠纷处理
 * 
 * 注意：不改变 ShipAny 结构，仅用于记录操作日志
 */

import { pgTable, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

/**
 * 服务日志审计表
 * 记录所有关键操作，包括：
 * - 管理员操作（核验通过、拒绝等）
 * - ShipAny API 调用记录（原始响应）
 * - 打印分片操作记录
 * - 资产释放操作记录
 */
export const serviceLogs = pgTable(
  'service_logs',
  {
    id: text('id').primaryKey(),
    // 关联的保险箱 ID
    vaultId: text('vault_id').notNull(),
    // 关联的受益人 ID（如果有）
    beneficiaryId: text('beneficiary_id'),
    // 操作类型
    actionType: text('action_type').notNull(), // 'admin_review', 'shipany_api_call', 'print_shard', 'asset_release', 'error'
    // 操作者信息（管理员 ID 或系统）
    actorId: text('actor_id'), // 管理员用户 ID 或 'system'
    actorEmail: text('actor_email'), // 管理员邮箱
    // 操作详情（JSON 格式）
    actionData: jsonb('action_data'), // 包含操作参数、响应等
    // ShipAny API 原始响应（如果有）
    shipanyResponse: jsonb('shipany_response'), // ShipAny API 的完整响应（不改变 ShipAny 结构）
    // 错误信息（如果有）
    errorMessage: text('error_message'),
    errorStack: text('error_stack'),
    // 操作结果
    result: text('result').default('success'), // 'success', 'failed', 'pending'
    // 时间戳
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    // 查询保险箱的操作日志
    index('idx_service_log_vault').on(table.vaultId),
    // 查询受益人的操作日志
    index('idx_service_log_beneficiary').on(table.beneficiaryId),
    // 按操作类型查询
    index('idx_service_log_action_type').on(table.actionType),
    // 按操作者查询
    index('idx_service_log_actor').on(table.actorId),
    // 按时间查询（用于审计）
    index('idx_service_log_created_at').on(table.createdAt),
  ]
);



