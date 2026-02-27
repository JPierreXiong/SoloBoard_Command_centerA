/**
 * 设置管理员用户脚本
 * 
 * 将指定邮箱设置为超级管理员（super_admin）
 * 
 * 使用方法:
 *   npx tsx scripts/set-admin-user.ts
 * 
 * 环境变量:
 *   ADMIN_EMAIL=xiongjp_fr@163.com (可选，默认使用此邮箱)
 */

import { db } from '@/core/db';
import { user, role, userRole } from '@/config/db/schema';
import { getUuid } from '@/shared/lib/hash';
import { eq, and } from 'drizzle-orm';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'xiongjp_fr@163.com';

async function setAdminUser() {
  try {
    console.log('🚀 开始设置管理员用户...\n');
    console.log(`📧 目标邮箱: ${ADMIN_EMAIL}\n`);

    // 步骤1: 查找用户
    console.log(`🔍 查找用户: ${ADMIN_EMAIL}`);
    const [adminUser] = await db()
      .select()
      .from(user)
      .where(eq(user.email, ADMIN_EMAIL));

    if (!adminUser) {
      console.error(`❌ 错误: 未找到用户 ${ADMIN_EMAIL}`);
      console.log('\n💡 提示:');
      console.log('   1. 请确保该邮箱已注册并登录过系统');
      console.log('   2. 如果未注册，请先访问登录页面完成注册');
      console.log('   3. 或者使用环境变量指定其他邮箱:');
      console.log('      ADMIN_EMAIL=your@email.com npx tsx scripts/set-admin-user.ts');
      process.exit(1);
    }

    console.log(`✅ 找到用户: ${adminUser.name || 'N/A'} (${adminUser.email})`);
    console.log(`   用户 ID: ${adminUser.id}\n`);

    // 步骤2: 查找或创建 super_admin 角色
    console.log('🔍 查找 super_admin 角色...');
    let [superAdminRole] = await db()
      .select()
      .from(role)
      .where(eq(role.name, 'super_admin'));

    if (!superAdminRole) {
      console.log('⚠️  super_admin 角色不存在，正在创建...');
      
      // 创建 super_admin 角色
      const roleId = getUuid();
      await db().insert(role).values({
        id: roleId,
        name: 'super_admin',
        title: 'Super Admin',
        description: 'Full system access with all permissions',
        status: 'active',
        sort: 1,
      });

      [superAdminRole] = await db()
        .select()
        .from(role)
        .where(eq(role.id, roleId));

      console.log('✅ super_admin 角色创建成功');
    } else {
      console.log(`✅ 找到角色: ${superAdminRole.title} (${superAdminRole.name})`);
    }
    console.log(`   角色 ID: ${superAdminRole.id}\n`);

    // 步骤3: 检查用户是否已有该角色
    console.log('🔍 检查用户角色...');
    const [existingUserRole] = await db()
      .select()
      .from(userRole)
      .where(
        and(
          eq(userRole.userId, adminUser.id),
          eq(userRole.roleId, superAdminRole.id)
        )
      );

    if (existingUserRole) {
      console.log('ℹ️  用户已经是超级管理员，无需重复设置');
      console.log('\n✅ 设置完成！');
      console.log('\n📊 摘要:');
      console.log(`   用户: ${adminUser.name || 'N/A'} (${adminUser.email})`);
      console.log(`   角色: ${superAdminRole.title} (${superAdminRole.name})`);
      console.log('\n💡 下一步:');
      console.log('   1. 退出并重新登录以刷新权限');
      console.log('   2. 访问 http://localhost:3000/admin/digital-heirloom 验证权限');
      process.exit(0);
    }

    // 步骤4: 分配角色
    console.log('🔄 正在分配 super_admin 角色...');
    await db().insert(userRole).values({
      id: getUuid(),
      userId: adminUser.id,
      roleId: superAdminRole.id,
    });

    console.log('✅ 角色分配成功\n');

    console.log('🎉 设置完成！');
    console.log('\n📊 摘要:');
    console.log(`   用户: ${adminUser.name || 'N/A'} (${adminUser.email})`);
    console.log(`   角色: ${superAdminRole.title} (${superAdminRole.name})`);
    console.log('\n💡 下一步:');
    console.log('   1. 退出并重新登录以刷新权限');
    console.log('   2. 访问 http://localhost:3000/admin/digital-heirloom 验证权限');
    console.log('   3. 如果无法访问，请检查 RBAC 权限是否正确初始化');
    console.log('      (运行: npx tsx scripts/init-rbac.ts)');
    console.log('');

  } catch (error: any) {
    console.error('\n❌ 设置失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// 执行脚本
setAdminUser();
