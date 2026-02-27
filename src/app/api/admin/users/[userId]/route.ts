/**
 * 管理员查看用户详情 API
 * 查看单个用户的完整信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { db } from '@/core/db';
import { user, order, subscription } from '@/config/db/schema';
import { isAdmin } from '@/config/admin';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    // 验证管理员
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const database = db();
    
    // 1. 获取用户基本信息
    const users = await database
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    
    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userData = users[0];
    
    // 2. 获取用户订单
    const userOrders = await database
      .select({
        id: order.id,
        orderNo: order.orderNo,
        status: order.status,
        amount: order.amount,
        paymentAmount: order.paymentAmount,
        currency: order.currency,
        productId: order.productId,
        paymentProvider: order.paymentProvider,
        subscriptionId: order.subscriptionId,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
      })
      .from(order)
      .where(eq(order.userId, userId))
      .orderBy(sql`${order.createdAt} DESC`);
    
    // 3. 获取用户订阅
    const userSubscriptions = await database
      .select({
        id: subscription.id,
        subscriptionNo: subscription.subscriptionNo,
        subscriptionId: subscription.subscriptionId,
        status: subscription.status,
        planType: subscription.planType,
        amount: subscription.amount,
        currency: subscription.currency,
        interval: subscription.interval,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        canceledAt: subscription.canceledAt,
        createdAt: subscription.createdAt,
      })
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .orderBy(sql`${subscription.createdAt} DESC`);
    
    // 4. 计算统计数据
    const totalSpent = userOrders
      .filter((o: any) => o.status === 'paid')
      .reduce((sum: number, o: any) => sum + (Number(o.paymentAmount) || 0), 0) / 100;
    
    const activeSubscription = userSubscriptions.find((s: any) => s.status === 'active');
    
    // 5. 返回完整信息
    return NextResponse.json({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        emailVerified: userData.emailVerified,
        planType: userData.planType,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
      
      statistics: {
        totalOrders: userOrders.length,
        paidOrders: userOrders.filter((o: any) => o.status === 'paid').length,
        totalSpent,
        activeSubscriptions: userSubscriptions.filter((s: any) => s.status === 'active').length,
        hasActiveSubscription: !!activeSubscription,
      },
      
      orders: userOrders.map((o: any) => ({
        ...o,
        amount: o.amount ? Number(o.amount) / 100 : 0,
        paymentAmount: o.paymentAmount ? Number(o.paymentAmount) / 100 : 0,
      })),
      
      subscriptions: userSubscriptions.map((s: any) => ({
        ...s,
        amount: s.amount ? Number(s.amount) / 100 : 0,
      })),
      
      activeSubscription: activeSubscription ? {
        ...activeSubscription,
        amount: activeSubscription.amount ? Number(activeSubscription.amount) / 100 : 0,
      } : null,
    });

  } catch (error: any) {
    console.error('Admin user detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details', message: error.message },
      { status: 500 }
    );
  }
}

