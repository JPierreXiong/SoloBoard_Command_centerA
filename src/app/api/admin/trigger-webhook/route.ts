/**
 * 手动触发 Webhook 处理
 * 用于修复支付成功但 webhook 未处理的情况
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

    console.log(`🔧 [TriggerWebhook] 手动处理订单: ${orderNo}`);

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
        { error: '订单未支付' },
        { status: 400 }
      );
    }

    if (!ord.userId) {
      return NextResponse.json(
        { error: '订单缺少用户ID' },
        { status: 400 }
      );
    }

    console.log(`✅ [TriggerWebhook] 找到订单:`, {
      orderNo: ord.orderNo,
      userId: ord.userId,
      amount: ord.amount,
      status: ord.status,
    });

    // 2. 检查是否已有订阅
    const existingSubs = await db()
      .select()
      .from(subscription)
      .where(eq(subscription.userId, ord.userId))
      .limit(1);

    if (existingSubs.length > 0 && existingSubs[0].status === 'active') {
      console.log(`⚠️ [TriggerWebhook] 用户已有活跃订阅:`, existingSubs[0].subscriptionNo);
      return NextResponse.json({
        success: true,
        message: '用户已有活跃订阅',
        subscription: existingSubs[0],
      });
    }

    // 3. 创建订阅
    const amount = ord.amount || 1990;
    const planType = amount <= 2000 ? 'base' : 'pro';
    const planName = planType === 'base' ? 'Base Plan' : 'Pro Plan';

    const subscriptionNo = `SUB-${Date.now()}-${ord.id.substring(0, 8)}`;
    const subscriptionId = ord.subscriptionId || `creem_sub_${Date.now()}`;
    
    const now = new Date();
    const currentPeriodStart = ord.paidAt || now;
    const currentPeriodEnd = new Date(currentPeriodStart);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    console.log(`📋 [TriggerWebhook] 创建订阅:`, {
      subscriptionNo,
      planType,
      amount,
    });

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
        subscriptionResult: JSON.stringify({ 
          manual_trigger: true, 
          orderNo: ord.orderNo,
          triggeredAt: now.toISOString(),
        }),
        productId: planType,
        description: `${planName} - Manual Trigger`,
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

    console.log(`✅ [TriggerWebhook] 订阅创建成功:`, newSub[0].subscriptionNo);

    // 4. 更新用户计划
    const updatedUser = await db()
      .update(user)
      .set({
        planType,
        updatedAt: now,
      })
      .where(eq(user.id, ord.userId))
      .returning();

    console.log(`✅ [TriggerWebhook] 用户计划已升级:`, {
      userId: updatedUser[0].id,
      planType: updatedUser[0].planType,
    });

    // 5. 更新订单
    await db()
      .update(order)
      .set({
        subscriptionId: subscriptionId,
        updatedAt: now,
      })
      .where(eq(order.id, ord.id));

    console.log(`✅ [TriggerWebhook] 订单已关联订阅`);

    return NextResponse.json({
      success: true,
      message: '订阅创建成功',
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
    console.error('❌ [TriggerWebhook] 处理失败:', error);
    return NextResponse.json(
      {
        error: 'Trigger webhook failed',
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

