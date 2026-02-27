import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { db } from '@/core/db';
import { subscription } from '@/config/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    const { subscriptionId } = await params;
    
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

    // 查询订阅
    const subscriptions = await db().select()
      .from(subscription)
      .where(
        and(
          eq(subscription.subscriptionId, subscriptionId),
          eq(subscription.userId, session.user.id)
        )
      )
      .limit(1);

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    const subData = subscriptions[0];

    return NextResponse.json({
      id: subData.id,
      subscriptionNo: subData.subscriptionNo,
      subscriptionId: subData.subscriptionId,
      status: subData.status,
      planName: subData.planName,
      planType: subData.planType,
      amount: subData.amount,
      currency: subData.currency,
      interval: subData.interval,
      intervalCount: subData.intervalCount,
      currentPeriodStart: subData.currentPeriodStart,
      currentPeriodEnd: subData.currentPeriodEnd,
      canceledAt: subData.canceledAt,
      createdAt: subData.createdAt,
    });

  } catch (error: any) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get subscription',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

