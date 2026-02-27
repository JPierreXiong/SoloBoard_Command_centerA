import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { db } from '@/core/db';
import { order } from '@/config/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    
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

    // 查询订单
    const orders = await db().select()
      .from(order)
      .where(
        and(
          eq(order.id, orderId),
          eq(order.userId, session.user.id)
        )
      )
      .limit(1);

    if (orders.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = orders[0];

    return NextResponse.json({
      id: orderData.id,
      orderNo: orderData.orderNo,
      status: orderData.status,
      amount: orderData.amount,
      currency: orderData.currency,
      productId: orderData.productId,
      paymentProvider: orderData.paymentProvider,
      subscriptionId: orderData.subscriptionId,
      checkoutUrl: orderData.checkoutUrl,
      paidAt: orderData.paidAt,
      createdAt: orderData.createdAt,
    });

  } catch (error: any) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get order',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

