import { getTranslations } from 'next-intl/server';

import {
  PaymentInterval,
  PaymentOrder,
  PaymentPrice,
  PaymentType,
} from '@/extensions/payment';
import { getSnowId, getUuid } from '@/shared/lib/hash';
import { respData, respErr } from '@/shared/lib/resp';
import { getAllConfigs } from '@/shared/models/config';
import {
  createOrder,
  NewOrder,
  OrderStatus,
  updateOrderByOrderNo,
} from '@/shared/models/order';
import { getUserInfo } from '@/shared/models/user';
import { getPaymentService } from '@/shared/services/payment';
import { PricingCurrency } from '@/shared/types/blocks/pricing';

export async function POST(req: Request) {
  try {
    // 1. 解析请求体，添加错误捕获
    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      console.error('Invalid JSON in request body:', jsonError);
      return respErr('Invalid request format');
    }

    const { product_id, currency, locale, payment_provider, metadata } = body;
    if (!product_id) {
      return respErr('product_id is required');
    }

    const t = await getTranslations({
      locale: locale || 'en',
      namespace: 'pricing',
    });
    const pricing = t.raw('pricing');

    const pricingItem = pricing.items.find(
      (item: any) => item.product_id === product_id
    );

    if (!pricingItem) {
      return respErr('pricing item not found');
    }

    if (!pricingItem.product_id && !pricingItem.amount) {
      return respErr('invalid pricing item');
    }

    // get sign user
    const user = await getUserInfo();
    if (!user || !user.email) {
      return respErr('no auth, please sign in');
    }

    // get configs
    const configs = await getAllConfigs();

    // choose payment provider
    let paymentProviderName = payment_provider || '';
    if (!paymentProviderName) {
      paymentProviderName = configs.default_payment_provider;
    }
    if (!paymentProviderName) {
      // Check which payment providers are available and automatically use the first one if only one is enabled
      const availableProviders: string[] = [];
      const availableProviderNames: string[] = [];
      
      if (configs.stripe_enabled === 'true') {
        availableProviders.push('Stripe');
        availableProviderNames.push('stripe');
      }
      if (configs.creem_enabled === 'true') {
        availableProviders.push('Creem');
        availableProviderNames.push('creem');
      }
      if (configs.paypal_enabled === 'true') {
        availableProviders.push('PayPal');
        availableProviderNames.push('paypal');
      }
      
      // If only one provider is available, automatically use it
      if (availableProviderNames.length === 1) {
        paymentProviderName = availableProviderNames[0];
      } else if (availableProviders.length > 0) {
        const errorMessage = `No default payment provider configured. Available providers: ${availableProviders.join(', ')}. Please configure a default payment provider in admin settings.`;
        return respErr(errorMessage);
      } else {
        return respErr('No payment provider configured. Please enable and configure at least one payment provider (Stripe, Creem, or PayPal) in admin settings.');
      }
    }

    // Validate payment provider against allowed providers
    // First check currency-specific payment_providers if currency is provided
    let allowedProviders: string[] | undefined;

    if (
      currency &&
      currency.toLowerCase() !== (pricingItem.currency || 'usd').toLowerCase()
    ) {
      const selectedCurrencyData = pricingItem.currencies?.find(
        (c: PricingCurrency) =>
          c.currency.toLowerCase() === currency.toLowerCase()
      );
      allowedProviders = selectedCurrencyData?.payment_providers;
    }

    // Fallback to default payment_providers if not found in currency config
    if (!allowedProviders || allowedProviders.length === 0) {
      allowedProviders = pricingItem.payment_providers;
    }

    // If payment_providers is configured, validate the selected provider
    if (allowedProviders && allowedProviders.length > 0) {
      if (!allowedProviders.includes(paymentProviderName)) {
        return respErr(
          `payment provider ${paymentProviderName} is not supported for this currency`
        );
      }
    }

    // get default payment provider
    const paymentService = await getPaymentService();

    const paymentProvider = paymentService.getProvider(paymentProviderName);
    if (!paymentProvider || !paymentProvider.name) {
      // Check which payment providers are enabled but not properly configured
      const enabledProviders: string[] = [];
      const misconfiguredProviders: string[] = [];
      
      if (configs.stripe_enabled === 'true') {
        if (configs.stripe_secret_key && configs.stripe_publishable_key) {
          enabledProviders.push('Stripe');
        } else {
          misconfiguredProviders.push('Stripe (missing API keys)');
        }
      }
      
      if (configs.creem_enabled === 'true') {
        if (configs.creem_api_key) {
          enabledProviders.push('Creem');
        } else {
          misconfiguredProviders.push('Creem (missing API key)');
        }
      }
      
      if (configs.paypal_enabled === 'true') {
        if (configs.paypal_client_id && configs.paypal_client_secret) {
          enabledProviders.push('PayPal');
        } else {
          misconfiguredProviders.push('PayPal (missing credentials)');
        }
      }
      
      let errorMessage = `Payment provider "${paymentProviderName}" is not available. `;
      
      if (enabledProviders.length > 0) {
        errorMessage += `Available providers: ${enabledProviders.join(', ')}. `;
      }
      
      if (misconfiguredProviders.length > 0) {
        errorMessage += `Misconfigured providers: ${misconfiguredProviders.join(', ')}. `;
      }
      
      if (enabledProviders.length === 0 && misconfiguredProviders.length === 0) {
        errorMessage += 'Please enable and configure at least one payment provider in admin settings.';
      } else {
        errorMessage += 'Please check your payment provider configuration in admin settings.';
      }
      
      return respErr(errorMessage);
    }

    // checkout currency and amount - calculate from server-side data only (never trust client input)
    // Security: currency can be provided by frontend, but amount must be calculated server-side
    const defaultCurrency = (pricingItem.currency || 'usd').toLowerCase();
    let checkoutCurrency = defaultCurrency;
    let checkoutAmount = pricingItem.amount;

    // If currency is provided, validate it and find corresponding amount from server-side data
    if (currency) {
      const requestedCurrency = currency.toLowerCase();

      // Check if requested currency is the default currency
      if (requestedCurrency === defaultCurrency) {
        checkoutCurrency = defaultCurrency;
        checkoutAmount = pricingItem.amount;
      } else if (pricingItem.currencies && pricingItem.currencies.length > 0) {
        // Find amount for the requested currency in currencies list
        const selectedCurrencyData = pricingItem.currencies.find(
          (c: PricingCurrency) => c.currency.toLowerCase() === requestedCurrency
        );
        if (selectedCurrencyData) {
          // Valid currency found, use it
          checkoutCurrency = requestedCurrency;
          checkoutAmount = selectedCurrencyData.amount;
        }
        // If currency not found in list, fallback to default (already set above)
      }
      // If no currencies list exists, fallback to default (already set above)
    }

    // get payment interval
    const paymentInterval: PaymentInterval =
      pricingItem.interval || PaymentInterval.ONE_TIME;

    // get payment type
    const paymentType =
      paymentInterval === PaymentInterval.ONE_TIME
        ? PaymentType.ONE_TIME
        : PaymentType.SUBSCRIPTION;

    const orderNo = getSnowId();

    // get payment product id from pricing table in local file
    // First try to get currency-specific payment_product_id
    let paymentProductId = '';

    // If currency is provided and different from default, check currency-specific payment_product_id
    if (currency && currency.toLowerCase() !== defaultCurrency) {
      const selectedCurrencyData = pricingItem.currencies?.find(
        (c: PricingCurrency) =>
          c.currency.toLowerCase() === currency.toLowerCase()
      );
      if (selectedCurrencyData?.payment_product_id) {
        paymentProductId = selectedCurrencyData.payment_product_id;
      }
    }

    // Fallback to default payment_product_id if not found in currency config
    if (!paymentProductId) {
      paymentProductId = pricingItem.payment_product_id || '';
    }

    // If still not found, get from payment provider's config
    if (!paymentProductId) {
      paymentProductId = await getPaymentProductId(
        pricingItem.product_id,
        paymentProviderName,
        checkoutCurrency
      );
    }

    // build checkout price with correct amount for selected currency
    const checkoutPrice: PaymentPrice = {
      amount: checkoutAmount,
      currency: checkoutCurrency,
    };

    if (!paymentProductId) {
      // For Creem, productId is required (Creem API doesn't support dynamic pricing)
      if (paymentProviderName === 'creem') {
        return respErr(
          `Creem payment requires product_id configuration. ` +
          `Please configure creem_product_ids mapping in admin settings ` +
          `for product "${pricingItem.product_id}" (currency: ${checkoutCurrency}). ` +
          `Visit Creem Dashboard (https://www.creem.io/dashboard/products) to create products ` +
          `and map them in admin settings (/admin/settings/payment).`
        );
      }
      // checkout price validation for other providers
      if (!checkoutPrice.amount || !checkoutPrice.currency) {
        return respErr('invalid checkout price');
      }
    } else {
      paymentProductId = paymentProductId.trim();
    }

    // 2. 确保 URL 格式正确，防止 Creem API 400 错误
    let appUrl = configs.app_url || process.env.NEXT_PUBLIC_APP_URL || '';
    
    // 确保 URL 包含协议头
    if (appUrl && !appUrl.startsWith('http://') && !appUrl.startsWith('https://')) {
      appUrl = `https://${appUrl}`;
    }
    
    // 移除末尾的斜杠
    appUrl = appUrl.replace(/\/$/, '');
    
    // 验证 URL 格式
    if (!appUrl) {
      console.error('❌ app_url not configured in environment');
      return respErr('Payment system not configured. Please contact administrator.');
    }
    
    try {
      new URL(appUrl); // 验证 URL 格式
    } catch (urlError) {
      console.error('❌ Invalid app_url format:', appUrl);
      return respErr('Payment system configuration error. Please contact administrator.');
    }

    let callbackBaseUrl = appUrl;
    if (locale && locale !== configs.default_locale) {
      callbackBaseUrl += `/${locale}`;
    }

    const callbackUrl =
      paymentType === PaymentType.SUBSCRIPTION
        ? `${callbackBaseUrl}/settings/billing`
        : `${callbackBaseUrl}/settings/payments`;

    // 先生成 orderId，避免循环引用
    const orderId = getUuid();
    const currentTime = new Date();

    // build checkout order
    const checkoutOrder: PaymentOrder = {
      description: pricingItem.product_name,
      customer: {
        name: user.name,
        email: user.email,
      },
      type: paymentType,
      metadata: {
        app_name: configs.app_name,
        order_no: orderNo,
        orderId: orderId,  // 使用预先生成的 orderId
        user_id: user.id,
        userId: user.id,
        userEmail: user.email,
        ...(metadata || {}),
      },
      successUrl: `${appUrl}/api/payment/callback?order_no=${orderNo}`,
      cancelUrl: `${callbackBaseUrl}/pricing`,
    };

    // checkout with predefined product
    if (paymentProductId) {
      checkoutOrder.productId = paymentProductId;
    }

    // checkout dynamically
    checkoutOrder.price = checkoutPrice;
    if (paymentType === PaymentType.SUBSCRIPTION) {
      // subscription mode
      checkoutOrder.plan = {
        interval: paymentInterval,
        name: pricingItem.product_name,
      };
    } else {
      // one-time mode
    }

    // build order info
    const newOrder: NewOrder = {
      id: orderId,  // 使用预先生成的 orderId
      orderNo: orderNo,
      userId: user.id,
      userEmail: user.email,
      status: OrderStatus.PENDING,
      amount: checkoutAmount, // use the amount for selected currency
      currency: checkoutCurrency,
      productId: pricingItem.product_id,
      paymentType: paymentType,
      paymentInterval: paymentInterval,
      paymentProvider: paymentProvider.name,
      checkoutInfo: JSON.stringify(checkoutOrder),
      createdAt: currentTime,
      productName: pricingItem.product_name,
      description: pricingItem.description,
      callbackUrl: callbackUrl,
      creditsAmount: pricingItem.credits,
      creditsValidDays: pricingItem.valid_days,
      planName: pricingItem.plan_name || '',
      paymentProductId: paymentProductId,
    };

    // create order
    await createOrder(newOrder);

    try {
      // create payment - 核心拦截点，捕获 Creem API 错误
      const result = await paymentProvider.createPayment({
        order: checkoutOrder,
      });

      // update order status to created, waiting for payment
      await updateOrderByOrderNo(orderNo, {
        status: OrderStatus.CREATED, // means checkout created, waiting for payment
        checkoutInfo: JSON.stringify(result.checkoutParams),
        checkoutResult: JSON.stringify(result.checkoutResult),
        checkoutUrl: result.checkoutInfo.checkoutUrl,
        paymentSessionId: result.checkoutInfo.sessionId,
        paymentProvider: result.provider,
      });

      return respData(result.checkoutInfo);
    } catch (paymentError: any) {
      console.error('❌ Payment provider error:', {
        provider: paymentProvider.name,
        error: paymentError.message,
        stack: paymentError.stack,
      });

      // update order status to completed, means checkout failed
      await updateOrderByOrderNo(orderNo, {
        status: OrderStatus.COMPLETED, // means checkout failed
        checkoutInfo: JSON.stringify(checkoutOrder),
      });

      // 提供更友好的错误信息
      let errorMessage = paymentError.message || 'Payment creation failed';
      
      // 检测常见的 Creem API 错误
      if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
        errorMessage = 'Payment configuration error. Please check your payment URLs or contact support.';
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorMessage = 'Payment provider authentication failed. Please contact administrator.';
      } else if (errorMessage.includes('product') || errorMessage.includes('Product')) {
        errorMessage = `Payment product not found. ${errorMessage}`;
      }

      return respErr(errorMessage);
    }
  } catch (e: any) {
    console.error('❌ Checkout route error:', {
      error: e.message,
      stack: e.stack,
    });
    
    // 防止 Server Component 崩溃，返回友好的错误信息
    let errorMessage = 'Checkout failed. Please try again or contact support.';
    
    if (e.message) {
      // 清理错误信息，避免暴露敏感信息
      if (e.message.includes('no auth') || e.message.includes('Unauthorized')) {
        errorMessage = 'Please sign in to continue.';
      } else if (e.message.includes('not found')) {
        errorMessage = 'Product not found. Please refresh and try again.';
      } else if (e.message.includes('config')) {
        errorMessage = 'Payment system not configured. Please contact administrator.';
      } else {
        errorMessage = `Checkout failed: ${e.message}`;
      }
    }
    
    return respErr(errorMessage);
  }
}

// get payemt product id from payment provider's config
async function getPaymentProductId(
  productId: string,
  provider: string,
  checkoutCurrency: string
) {
  if (provider !== 'creem') {
    // currently only creem supports payment product id mapping
    return;
  }

  try {
    const configs = await getAllConfigs();
    const creemProductIds = configs.creem_product_ids;
    if (creemProductIds) {
      const productIds = JSON.parse(creemProductIds);
      return (
        productIds[`${productId}_${checkoutCurrency}`] || productIds[productId]
      );
    }
  } catch (e: any) {
    console.log('get payment product id failed:', e);
    return;
  }
}
