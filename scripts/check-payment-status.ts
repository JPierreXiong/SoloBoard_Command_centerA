/**
 * 检查支付状态脚本
 * 用于诊断为什么付款后 billing 和权限没有更新
 */

import { db } from '@/core/db';
import { order, subscription, user } from '@/config/db/schema';
import { eq, desc } from 'drizzle-orm';

async function checkPaymentStatus(orderNo?: string) {
  console.log('🔍 开始检查支付状态...\n');

  try {
    // 1. 查找最近的订单
    console.log('📦 查询最近的订单...');
    const orders = await db()
      .select()
      .from(order)
      .orderBy(desc(order.createdAt))
      .limit(10);

    console.log(`找到 ${orders.length} 个订单:\n`);
    
    for (const ord of orders) {
      console.log(`订单 ${ord.orderNo}:`);
      console.log(`  - 状态: ${ord.status}`);
      console.log(`  - 金额: ${ord.amount ? `$${ord.amount / 100}` : '未设置'}`);
      console.log(`  - 用户ID: ${ord.userId}`);
      console.log(`  - 支付时间: ${ord.paidAt || '未支付'}`);
      console.log(`  - 订阅ID: ${ord.subscriptionId || '无'}`);
      console.log(`  - 创建时间: ${ord.createdAt}`);
      console.log('');

      // 如果订单已支付，检查对应的订阅
      if (ord.status === 'paid' && ord.userId) {
        console.log(`  ✅ 订单已支付，检查用户 ${ord.userId} 的订阅...\n`);

        // 查找用户信息
        const users = await db()
          .select()
          .from(user)
          .where(eq(user.id, ord.userId))
          .limit(1);

        if (users.length > 0) {
          const u = users[0];
          console.log(`  👤 用户信息:`);
          console.log(`    - 姓名: ${u.name}`);
          console.log(`    - 邮箱: ${u.email}`);
          console.log(`    - 计划类型: ${u.planType || '未设置'}`);
          console.log('');
        }

        // 查找订阅记录
        const subs = await db()
          .select()
          .from(subscription)
          .where(eq(subscription.userId, ord.userId))
          .orderBy(desc(subscription.createdAt))
          .limit(5);

        if (subs.length > 0) {
          console.log(`  📋 找到 ${subs.length} 个订阅记录:`);
          for (const sub of subs) {
            console.log(`    - 订阅号: ${sub.subscriptionNo}`);
            console.log(`      状态: ${sub.status}`);
            console.log(`      计划: ${sub.planName} (${sub.planType})`);
            console.log(`      金额: $${sub.amount / 100}`);
            console.log(`      周期: ${sub.currentPeriodStart} ~ ${sub.currentPeriodEnd}`);
            console.log(`      创建时间: ${sub.createdAt}`);
            console.log('');
          }
        } else {
          console.log(`  ❌ 未找到订阅记录！这是问题所在！\n`);
          console.log(`  🔧 可能的原因:`);
          console.log(`    1. Webhook 未被调用`);
          console.log(`    2. Webhook 处理失败`);
          console.log(`    3. 订阅创建逻辑有错误\n`);
        }
      }
    }

    // 2. 查找所有订阅
    console.log('\n📊 所有订阅记录:');
    const allSubs = await db()
      .select()
      .from(subscription)
      .orderBy(desc(subscription.createdAt))
      .limit(10);

    if (allSubs.length === 0) {
      console.log('❌ 数据库中没有任何订阅记录！\n');
    } else {
      console.log(`找到 ${allSubs.length} 个订阅:\n`);
      for (const sub of allSubs) {
        console.log(`订阅 ${sub.subscriptionNo}:`);
        console.log(`  - 用户ID: ${sub.userId}`);
        console.log(`  - 状态: ${sub.status}`);
        console.log(`  - 计划: ${sub.planName}`);
        console.log(`  - 金额: $${sub.amount / 100}`);
        console.log('');
      }
    }

    // 3. 检查特定订单号
    if (orderNo) {
      console.log(`\n🔎 检查特定订单: ${orderNo}`);
      const specificOrder = await db()
        .select()
        .from(order)
        .where(eq(order.orderNo, orderNo))
        .limit(1);

      if (specificOrder.length > 0) {
        const ord = specificOrder[0];
        console.log('订单详情:', JSON.stringify(ord, null, 2));
      } else {
        console.log('❌ 未找到该订单');
      }
    }

    console.log('\n✅ 检查完成！');

  } catch (error: any) {
    console.error('❌ 检查失败:', error.message);
    console.error(error.stack);
  }
}

// 运行检查
const orderNo = process.argv[2]; // 可选：指定订单号
checkPaymentStatus(orderNo);

