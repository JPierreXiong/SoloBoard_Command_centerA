import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { createCreemProvider } from '@/extensions/payment/creem';
import { db } from '@/core/db';
import { order } from '@/config/db/schema';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    // 1. 验证用户登录
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. 解析请求体
    const body = await req.json();
    const { productId, provider = 'creem', successUrl, cancelUrl } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // 3. 检查 Creem 配置
    const creemApiKey = process.env.CREEM_API_KEY;
    const creemSigningSecret = process.env.CREEM_SIGNING_SECRET;
    const creemEnvironment = process.env.CREEM_ENVIRONMENT as 'sandbox' | 'production';

    if (!creemApiKey || !creemSigningSecret) {
      return NextResponse.json(
        { error: 'Payment provider not configured' },
        { status: 500 }
      );
    }

    // 4. 创建 Creem Provider
    const creemProvider = createCreemProvider({
      apiKey: creemApiKey,
      signingSecret: creemSigningSecret,
      environment: creemEnvironment || 'production',
    });

    // 5. 生成订单号
    const orderId = nanoid();
    const orderNo = `ORD-${Date.now()}-${orderId.substring(0, 8)}`;

    // 6. 创建支付会话
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';
    const checkoutSession = await creemProvider.createPayment({
      order: {
        productId,
        requestId: orderId,
        customer: {
          id: session.user.id,
          email: session.user.email,
        },
        successUrl: successUrl || `${appUrl}/payment/success`,
        metadata: {
          orderId,
          orderNo,
          userId: session.user.id,
          userEmail: session.user.email,
        },
      },
    });

    // 7. 保存订单到数据库
    const database = db();
    await database.insert(order).values({
      id: orderId,
      orderNo,
      userId: session.user.id,
      userEmail: session.user.email,
      status: 'created',
      amount: 0, // 将在 webhook 中更新
      currency: 'USD',
      productId,
      paymentType: 'subscription',
      paymentProvider: provider,
      paymentSessionId: checkoutSession.checkoutInfo.sessionId,
      checkoutInfo: JSON.stringify(checkoutSession.checkoutParams),
      checkoutResult: JSON.stringify(checkoutSession.checkoutResult),
      checkoutUrl: checkoutSession.checkoutInfo.checkoutUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 8. 返回结果
    return NextResponse.json({
      success: true,
      orderId,
      orderNo,
      checkoutUrl: checkoutSession.checkoutInfo.checkoutUrl,
      sessionId: checkoutSession.checkoutInfo.sessionId,
    });

  } catch (error: any) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create payment',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
