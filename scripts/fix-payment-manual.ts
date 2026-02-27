/**
 * 手动修复支付记录
 * 用于 Creem webhook 未被调用的情况
 */

import { db } from '@/core/db';
import { order, subscription, user } from '@/config/db/schema';
import { eq, desc } from 'drizzle-orm';

async function fixPayment() {
  const userEmail = 'xiongjp_fr@hotmail.com';
  
  console.log('🔧 开始修复支付记录...');
  console.log('📧 用户邮箱:', userEmail);

  try {
    // 1. 查找用户
    console.log('\n1️⃣ 查找用户...');
    const users = await db().select()
      .from(user)
      .where(eq(user.email, userEmail))
      .limit(1);

    if (users.length === 0) {
      console.log('❌ 用户不存在，创建新用户...');
      const newUser = await db().insert(user).values({
        id: `user_${Date.now()}`,
        email: userEmail,
        name: userEmail.split('@')[0],
        emailVerified: false,
        planType: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      console.log('✅ 用户创建成功:', newUser[0].id);
      var userId = newUser[0].id;
    } else {
      var userId = users[0].id;
      console.log('✅ 找到用户:', userId);
    }

    // 2. 查找该用户的订单
    console.log('\n2️⃣ 查找订单...');
    const orders = await db().select()
      .from(order)
      .where(eq(order.userEmail, userEmail))
      .orderBy(desc(order.createdAt))
      .limit(10);

    console.log(`📦 找到 ${orders.length} 个订单`);

    if (orders.length === 0) {
      console.log('❌ 没有找到订单');
      return;
    }

    // 显示所有订单
    orders.forEach((ord, idx) => {
      console.log(`\n订单 ${idx + 1}:`);
      console.log(`  - 订单号: ${ord.orderNo}`);
      console.log(`  - 状态: ${ord.status}`);
      console.log(`  - 金额: $${ord.amount / 100}`);
      console.log(`  - 创建时间: ${ord.createdAt}`);
    });

    // 3. 找到最近的订单（假设是支付的那个）
    const latestOrder = orders[0];
    console.log(`\n3️⃣ 处理最新订单: ${latestOrder.orderNo}`);

    // 4. 更新订单状态为 paid
    console.log('\n4️⃣ 更新订单状态为 paid...');
    await db().update(order)
      .set({
        status: 'paid',
        paidAt: new Date(),
        paymentEmail: userEmail,
        updatedAt: new Date(),
      })
      .where(eq(order.id, latestOrder.id));

    console.log('✅ 订单状态已更新');

    // 5. 创建订阅
    console.log('\n5️⃣ 创建订阅...');
    const amount = latestOrder.amount || 1990;
    const planType = amount <= 2000 ? 'base' : 'pro';
    const planName = planType === 'base' ? 'Base Plan' : 'Pro Plan';

    const subscriptionNo = `SUB-${Date.now()}-${latestOrder.id.substring(0, 8)}`;
    const subscriptionId = `sub_${Date.now()}`;
    
    const now = new Date();
    const currentPeriodStart = now;
    const currentPeriodEnd = new Date(now);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    const newSub = await db().insert(subscription).values({
      id: subscriptionId,
      subscriptionNo,
      userId: userId,
      userEmail: userEmail,
      status: 'active',
      paymentProvider: 'creem',
      paymentUserId: userId,
      subscriptionId: subscriptionId,
      subscriptionResult: JSON.stringify({ manual_fix: true, fixedAt: now.toISOString() }),
      productId: latestOrder.productId || 'base',
      description: `${planName} - Manual Fix`,
      amount: amount,
      currency: latestOrder.currency || 'USD',
      interval: 'month',
      intervalCount: 1,
      currentPeriodStart,
      currentPeriodEnd,
      planType,
      planName,
      createdAt: now,
      updatedAt: now,
    }).returning();

    console.log('✅ 订阅创建成功:', newSub[0].subscriptionNo);

    // 6. 更新用户计划
    console.log('\n6️⃣ 更新用户计划...');
    await db().update(user)
      .set({
        planType,
        updatedAt: now,
      })
      .where(eq(user.id, userId));

    console.log('✅ 用户计划已升级为:', planType);

    console.log('\n🎉 修复完成！');
    console.log('\n📊 结果:');
    console.log(`  - 用户: ${userEmail}`);
    console.log(`  - 订单: ${latestOrder.orderNo} (已标记为 paid)`);
    console.log(`  - 订阅: ${newSub[0].subscriptionNo} (${planName})`);
    console.log(`  - 状态: Active`);
    console.log(`  - 周期: ${currentPeriodStart.toLocaleDateString()} - ${currentPeriodEnd.toLocaleDateString()}`);

  } catch (error: any) {
    console.error('❌ 修复失败:', error.message);
    console.error(error);
  }
}

// 运行修复
fixPayment();

