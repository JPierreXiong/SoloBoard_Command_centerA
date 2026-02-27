/**
 * 修复支付状态 API
 * 用于手动修复已支付但未创建订阅的订单
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { order, subscription, user } from '@/config/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { orderNo } = await req.json();

    if (!orderNo) {
      return NextResponse.json(
        { error: 'orderNo is required' },
        { status: 400 }
      );
    }

    console.log(`🔧 开始修复订单: ${orderNo}`);

    // 1. 查找订单
    const orders = await db()
      .select()
      .from(order)
      .where(eq(order.orderNo, orderNo))
      .limit(1);

    if (orders.length === 0) {
      return NextResponse.json(
        { error: '订单不存在' },
        { status: 404 }
      );
    }

    const ord = orders[0];

    if (ord.status !== 'paid') {
      return NextResponse.json(
        { error: '订单未支付，无需修复' },
        { status: 400 }
      );
    }

    if (!ord.userId) {
      return NextResponse.json(
        { error: '订单缺少用户ID' },
        { status: 400 }
      );
    }

    console.log(`✅ 找到订单: ${ord.orderNo}, 用户: ${ord.userId}`);

    // 2. 检查是否已有订阅
    const existingSubs = await db()
      .select()
      .from(subscription)
      .where(eq(subscription.userId, ord.userId))
      .limit(1);

    if (existingSubs.length > 0) {
      console.log(`⚠️ 用户已有订阅: ${existingSubs[0].subscriptionNo}`);
      return NextResponse.json({
        message: '用户已有订阅，无需创建',
        subscription: existingSubs[0],
      });
    }

    // 3. 根据订单金额确定计划类型
    const amount = ord.amount || 1990; // 默认 $19.90
    const planType = amount <= 2000 ? 'base' : 'pro';
    const planName = planType === 'base' ? 'Base Plan' : 'Pro Plan';

    console.log(`📋 创建订阅: ${planType} (${amount / 100} USD)`);

    // 4. 创建订阅记录
    const subscriptionNo = `SUB-${Date.now()}-${ord.id.substring(0, 8)}`;
    const subscriptionId = ord.subscriptionId || `creem_sub_${Date.now()}`;
    
    const now = new Date();
    const currentPeriodStart = ord.paidAt || now;
    const currentPeriodEnd = new Date(currentPeriodStart);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // 1个月后

    const newSub = await db()
      .insert(subscription)
      .values({
        id: subscriptionId,
        subscriptionNo,
        userId: ord.userId,
        userEmail: ord.paymentEmail || '',
        status: 'active',
        paymentProvider: 'creem',
        paymentUserId: ord.paymentUserId || '',
        subscriptionId: subscriptionId,
        subscriptionResult: JSON.stringify({ manual_fix: true, orderNo: ord.orderNo }),
        productId: planType,
        description: `${planName} - Manual Fix`,
        amount: amount,
        currency: ord.currency || 'USD',
        interval: 'month',
        intervalCount: 1,
        currentPeriodStart,
        currentPeriodEnd,
        planType,
        planName,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    console.log(`✅ 订阅创建成功: ${newSub[0].subscriptionNo}`);

    // 5. 更新用户计划类型
    const updatedUser = await db()
      .update(user)
      .set({
        planType,
        updatedAt: now,
      })
      .where(eq(user.id, ord.userId))
      .returning();

    console.log(`✅ 用户计划已升级: ${planType}`);

    // 6. 更新订单的订阅ID
    await db()
      .update(order)
      .set({
        subscriptionId: subscriptionId,
        updatedAt: now,
      })
      .where(eq(order.id, ord.id));

    console.log(`✅ 订单已关联订阅`);

    return NextResponse.json({
      success: true,
      message: '修复成功',
      order: {
        orderNo: ord.orderNo,
        status: ord.status,
        amount: `$${amount / 100}`,
      },
      subscription: {
        subscriptionNo: newSub[0].subscriptionNo,
        planType: newSub[0].planType,
        planName: newSub[0].planName,
        status: newSub[0].status,
        currentPeriodEnd: newSub[0].currentPeriodEnd,
      },
      user: {
        id: updatedUser[0].id,
        email: updatedUser[0].email,
        planType: updatedUser[0].planType,
      },
    });

  } catch (error: any) {
    console.error('❌ 修复失败:', error);
    return NextResponse.json(
      {
        error: 'Fix failed',
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

