/**
 * 支付宝 Webhook 处理
 */

import { NextRequest } from 'next/server';
import { 
  paymentManager, 
  PaymentEventType,
  createAlipayProvider
} from '@/extensions/payment';

// 初始化支付宝提供商
function initializeAlipay() {
  if (process.env.ALIPAY_APP_ID) {
    const alipayProvider = createAlipayProvider({
      appId: process.env.ALIPAY_APP_ID,
      privateKey: process.env.ALIPAY_PRIVATE_KEY!,
      alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY!,
      notifyUrl: process.env.ALIPAY_NOTIFY_URL
    });
    paymentManager.addProvider(alipayProvider);
  }
}

initializeAlipay();

export async function POST(req: NextRequest) {
  try {
    console.log('Alipay webhook received');

    // 获取支付事件
    const event = await paymentManager.getPaymentEvent({
      req: req as any,
      provider: 'alipay'
    });

    console.log('Alipay event type:', event.eventType);

    // 处理不同的事件类型
    switch (event.eventType) {
      case PaymentEventType.PAYMENT_SUCCESS:
        await handlePaymentSuccess(event);
        break;

      case PaymentEventType.PAYMENT_FAILED:
        await handlePaymentFailed(event);
        break;

      default:
        console.log('Unhandled event type:', event.eventType);
    }

    // 返回 success 给支付宝
    return new Response('success', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });

  } catch (error: any) {
    console.error('Alipay webhook error:', error);
    
    // 返回 fail 给支付宝
    return new Response('fail', {
      status: 400,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
}

// 处理支付成功
async function handlePaymentSuccess(event: any) {
  const { paymentInfo, metadata } = event.paymentSession || {};

  console.log('支付宝支付成功:', {
    交易号: paymentInfo?.transactionId,
    金额: paymentInfo?.paymentAmount,
    货币: paymentInfo?.paymentCurrency,
    用户ID: metadata?.userId,
    支付时间: paymentInfo?.paidAt
  });

  // TODO: 更新数据库
  // 1. 更新订单状态
  // 2. 发放积分/权益
  // 3. 发送通知邮件

  // 示例：发放积分
  if (metadata?.userId && metadata?.credits) {
    // await grantCredits(metadata.userId, metadata.credits);
    console.log(`发放积分: 用户 ${metadata.userId} 获得 ${metadata.credits} 积分`);
  }
}

// 处理支付失败
async function handlePaymentFailed(event: any) {
  const { paymentInfo, metadata } = event.paymentSession || {};

  console.log('支付宝支付失败:', {
    交易号: paymentInfo?.transactionId,
    用户ID: metadata?.userId
  });

  // TODO: 更新订单状态为失败
}






















