import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { db } from '@/core/db';
import { user, subscription } from '@/config/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    // 验证用户登录
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 查询用户详细信息
    const users = await db().select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = users[0];

    // 查询用户的当前订阅（活跃、试用或待取消状态）
    const subscriptions = await db().select()
      .from(subscription)
      .where(
        eq(subscription.userId, session.user.id)
      )
      .orderBy(desc(subscription.createdAt))
      .limit(1);

    // 找到活跃的订阅
    const activeSubscription = subscriptions.find(sub => 
      sub.status === 'active' || sub.status === 'trialing' || sub.status === 'pending_cancel'
    );

    return NextResponse.json({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      planType: userData.planType || 'free',
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      subscription: activeSubscription ? {
        subscriptionNo: activeSubscription.subscriptionNo,
        status: activeSubscription.status,
        planName: activeSubscription.planName,
        planType: activeSubscription.planType,
        amount: activeSubscription.amount,
        currency: activeSubscription.currency,
        interval: activeSubscription.interval,
        currentPeriodStart: activeSubscription.currentPeriodStart,
        currentPeriodEnd: activeSubscription.currentPeriodEnd,
        createdAt: activeSubscription.createdAt,
      } : null,
    });

  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get user info',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

