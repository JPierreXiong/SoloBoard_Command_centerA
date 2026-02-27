/**
 * PayPal Webhook 处理
 */

import { NextRequest } from 'next/server';
import { 
  paymentManager, 
  PaymentEventType,
  createPayPalProvider
} from '@/extensions/payment';

// 初始化 PayPal 提供商
function initializePayPal() {
  if (process.env.PAYPAL_CLIENT_ID) {
    const paypalProvider = createPayPalProvider({
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
      webhookSecret: process.env.PAYPAL_WEBHOOK_ID,
      environment: (process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    });
    paymentManager.addProvider(paypalProvider);
  }
}

initializePayPal();

export async function POST(req: NextRequest) {
  try {
    console.log('PayPal webhook received');

    // 获取支付事件
    const event = await paymentManager.getPaymentEvent({
      req: req as any,
      provider: 'paypal'
    });

    console.log('PayPal event type:', event.eventType);

    // 处理不同的事件类型
    const eventType = event.eventType as string;
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCompleted(event);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentDenied(event);
        break;

      case 'BILLING.SUBSCRIPTION.CREATED':
        await handleSubscriptionCreated(event);
        break;

      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(event);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(event);
        break;

      default:
        console.log('Unhandled event type:', eventType);
    }

    return Response.json({ received: true });

  } catch (error: any) {
    console.error('PayPal webhook error:', error);
    
    return Response.json({
      error: error.message
    }, { status: 400 });
  }
}

// 处理支付完成
async function handlePaymentCompleted(event: any) {
  console.log('PayPal 支付完成:', event.eventResult);

  // TODO: 更新数据库
  // 1. 更新订单状态
  // 2. 发放积分/权益
  // 3. 发送通知邮件
}

// 处理支付拒绝
async function handlePaymentDenied(event: any) {
  console.log('PayPal 支付拒绝:', event.eventResult);

  // TODO: 更新订单状态为失败
}

// 处理订阅创建
async function handleSubscriptionCreated(event: any) {
  console.log('PayPal 订阅创建:', event.eventResult);

  // TODO: 记录订阅信息
}

// 处理订阅激活
async function handleSubscriptionActivated(event: any) {
  console.log('PayPal 订阅激活:', event.eventResult);

  // TODO: 激活用户订阅权益
}

// 处理订阅取消
async function handleSubscriptionCancelled(event: any) {
  console.log('PayPal 订阅取消:', event.eventResult);

  // TODO: 取消用户订阅权益
}

