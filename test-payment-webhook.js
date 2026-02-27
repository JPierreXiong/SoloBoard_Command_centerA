/**
 * 测试 Creem 支付 Webhook
 * 用于调试支付完成后的订阅创建流程
 */

const crypto = require('crypto');

// 配置
const WEBHOOK_URL = 'https://soloboard-command-center-b.vercel.app/api/payment/notify/creem';
const SIGNING_SECRET = 'whsec_6MzmusMOCJe420udLkejHe';

// 模拟 Creem checkout.completed 事件
const mockCheckoutCompletedEvent = {
  eventType: 'checkout.completed',
  object: {
    id: 'checkout_test_123',
    status: 'completed',
    customer: {
      id: 'test_user_id',
      email: 'test@example.com',
      name: 'Test User'
    },
    order: {
      id: 'order_test_123',
      transaction: 'txn_test_123',
      amount: 1990, // $19.90 in cents
      currency: 'USD',
      amount_paid: 1990,
      discount_amount: 0,
      status: 'paid',
      created_at: new Date().toISOString()
    },
    subscription: {
      id: 'sub_test_123',
      status: 'active',
      current_period_start_date: new Date().toISOString(),
      current_period_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
      created_at: new Date().toISOString()
    },
    product: {
      id: 'prod_3i3wLrjX9sQiwts95zv1FG',
      description: 'Base Plan',
      price: 1990,
      currency: 'USD',
      billing_period: 'every-month'
    },
    metadata: {
      orderId: 'test_order_123',
      orderNo: 'ORD-TEST-123',
      userId: 'test_user_id',
      userEmail: 'test@example.com'
    }
  }
};

// 生成签名
async function generateSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('hex');
}

// 发送 webhook
async function sendWebhook() {
  const payload = JSON.stringify(mockCheckoutCompletedEvent);
  const signature = await generateSignature(payload, SIGNING_SECRET);

  console.log('📤 Sending webhook to:', WEBHOOK_URL);
  console.log('📝 Payload:', JSON.stringify(mockCheckoutCompletedEvent, null, 2));
  console.log('🔐 Signature:', signature);
  console.log('');

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'creem-signature': signature
      },
      body: payload
    });

    const responseText = await response.text();
    
    console.log('✅ Response Status:', response.status);
    console.log('📥 Response Body:', responseText);

    if (response.ok) {
      console.log('');
      console.log('🎉 Webhook processed successfully!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Check database for subscription record');
      console.log('2. Verify user plan type was updated');
      console.log('3. Check Billing page for subscription data');
    } else {
      console.log('');
      console.log('❌ Webhook failed!');
      console.log('Check server logs for details');
    }
  } catch (error) {
    console.error('❌ Error sending webhook:', error.message);
  }
}

// 运行测试
console.log('🧪 Testing Creem Payment Webhook');
console.log('================================');
console.log('');

sendWebhook();



