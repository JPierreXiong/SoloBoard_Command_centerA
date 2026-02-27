/**
 * 检查支付状态 API
 * 用于诊断为什么付款后 billing 和权限没有更新
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { order, subscription, user } from '@/config/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNo = searchParams.get('orderNo');
    const userId = searchParams.get('userId');

    const report: any = {
      timestamp: new Date().toISOString(),
      summary: {},
      orders: [],
      subscriptions: [],
      users: [],
      issues: [],
    };

    // 1. 查找最近的订单
    console.log('📦 查询最近的订单...');
    const orders = await db()
      .select()
      .from(order)
      .orderBy(desc(order.createdAt))
      .limit(20);

    report.summary.totalOrders = orders.length;
    report.summary.paidOrders = orders.filter(o => o.status === 'paid').length;
    report.summary.pendingOrders = orders.filter(o => o.status === 'pending').length;

    for (const ord of orders) {
      const orderInfo: any = {
        orderNo: ord.orderNo,
        status: ord.status,
        amount: ord.amount ? `$${ord.amount / 100}` : 'N/A',
        userId: ord.userId,
        paidAt: ord.paidAt,
        subscriptionId: ord.subscriptionId,
        createdAt: ord.createdAt,
        hasSubscription: false,
        userPlanType: null,
      };

      // 如果订单已支付，检查对应的订阅和用户
      if (ord.status === 'paid' && ord.userId) {
        // 查找用户信息
        const users = await db()
          .select()
          .from(user)
          .where(eq(user.id, ord.userId))
          .limit(1);

        if (users.length > 0) {
          orderInfo.userPlanType = users[0].planType;
          orderInfo.userEmail = users[0].email;
          orderInfo.userName = users[0].name;
        }

        // 查找订阅记录
        const subs = await db()
          .select()
          .from(subscription)
          .where(eq(subscription.userId, ord.userId))
          .orderBy(desc(subscription.createdAt))
          .limit(1);

        if (subs.length > 0) {
          orderInfo.hasSubscription = true;
          orderInfo.subscriptionStatus = subs[0].status;
          orderInfo.subscriptionPlan = subs[0].planType;
        } else {
          // 发现问题：订单已支付但没有订阅
          report.issues.push({
            type: 'MISSING_SUBSCRIPTION',
            orderNo: ord.orderNo,
            userId: ord.userId,
            message: '订单已支付但未创建订阅记录',
            severity: 'HIGH',
          });
        }

        // 检查用户计划类型是否更新
        if (users.length > 0 && (!users[0].planType || users[0].planType === 'free')) {
          report.issues.push({
            type: 'USER_PLAN_NOT_UPGRADED',
            orderNo: ord.orderNo,
            userId: ord.userId,
            userEmail: users[0].email,
            message: '用户已支付但计划类型未升级',
            severity: 'HIGH',
          });
        }
      }

      report.orders.push(orderInfo);
    }

    // 2. 查找所有订阅
    console.log('📋 查询所有订阅...');
    const allSubs = await db()
      .select()
      .from(subscription)
      .orderBy(desc(subscription.createdAt))
      .limit(20);

    report.summary.totalSubscriptions = allSubs.length;
    report.summary.activeSubscriptions = allSubs.filter(s => s.status === 'active').length;

    for (const sub of allSubs) {
      report.subscriptions.push({
        subscriptionNo: sub.subscriptionNo,
        userId: sub.userId,
        status: sub.status,
        planName: sub.planName,
        planType: sub.planType,
        amount: `$${sub.amount / 100}`,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        createdAt: sub.createdAt,
      });
    }

    // 3. 检查特定订单
    if (orderNo) {
      const specificOrder = await db()
        .select()
        .from(order)
        .where(eq(order.orderNo, orderNo))
        .limit(1);

      if (specificOrder.length > 0) {
        report.specificOrder = specificOrder[0];
      }
    }

    // 4. 检查特定用户
    if (userId) {
      const specificUser = await db()
        .select()
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (specificUser.length > 0) {
        report.specificUser = {
          id: specificUser[0].id,
          email: specificUser[0].email,
          name: specificUser[0].name,
          planType: specificUser[0].planType,
        };

        // 查找该用户的所有订阅
        const userSubs = await db()
          .select()
          .from(subscription)
          .where(eq(subscription.userId, userId))
          .orderBy(desc(subscription.createdAt));

        report.specificUser.subscriptions = userSubs;
      }
    }

    // 5. 生成诊断建议
    if (report.issues.length === 0) {
      report.diagnosis = '✅ 未发现明显问题';
    } else {
      report.diagnosis = `❌ 发现 ${report.issues.length} 个问题需要修复`;
      report.recommendations = [];

      for (const issue of report.issues) {
        if (issue.type === 'MISSING_SUBSCRIPTION') {
          report.recommendations.push({
            issue: issue.message,
            solution: '需要手动创建订阅记录或重新触发 webhook',
            action: `检查 Creem webhook 是否正确配置并被调用`,
          });
        } else if (issue.type === 'USER_PLAN_NOT_UPGRADED') {
          report.recommendations.push({
            issue: issue.message,
            solution: '需要手动更新用户的 planType',
            action: `UPDATE user SET plan_type = 'base' WHERE id = '${issue.userId}'`,
          });
        }
      }
    }

    return NextResponse.json(report, { status: 200 });

  } catch (error: any) {
    console.error('❌ 检查失败:', error);
    return NextResponse.json(
      {
        error: 'Check failed',
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

