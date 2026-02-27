/**
 * 管理员配置
 */

export const ADMIN_CONFIG = {
  // 管理员邮箱列表
  adminEmails: [
    'xiongjp_fr@163.com',
  ],
  
  // 管理员角色
  adminRole: 'admin',
  
  // 管理员权限
  permissions: [
    'view_all_users',
    'view_all_orders',
    'view_all_subscriptions',
    'manage_users',
    'manage_plans',
    'view_analytics',
    'export_data',
  ],
};

/**
 * 检查是否为管理员
 */
export function isAdmin(email: string): boolean {
  return ADMIN_CONFIG.adminEmails.includes(email.toLowerCase());
}

/**
 * 检查管理员权限
 */
export function hasAdminPermission(email: string, permission: string): boolean {
  if (!isAdmin(email)) {
    return false;
  }
  
  return ADMIN_CONFIG.permissions.includes(permission);
}










