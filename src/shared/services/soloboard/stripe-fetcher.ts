/**
 * SoloBoard - Stripe 数据抓取服务
 * 
 * 用于从 Stripe 获取今日销售额、交易数等指标
 * 
 * 使用 Stripe API v2023-10-16
 * 文档: https://stripe.com/docs/api
 */

import Stripe from 'stripe';
import type { SiteApiConfig } from '@/shared/lib/site-crypto';

/**
 * Stripe 指标数据类型
 */
export interface StripeMetrics {
  todayRevenue: number; // 今日销售额（单位：分）
  todayTransactions: number; // 今日交易数
  todaySuccessfulCharges: number; // 今日成功支付数
  todayRefunds: number; // 今日退款数
  currency: string; // 货币代码（如 'usd'）
  updatedAt: string; // 更新时间（ISO 8601）
}

/**
 * 从 Stripe 获取今日指标
 * 
 * @param config - Stripe API 配置
 * @returns Stripe 指标数据
 */
export async function fetchStripeMetrics(
  config: NonNullable<SiteApiConfig['stripe']>
): Promise<StripeMetrics> {
  try {
    const stripe = new Stripe(config.secretKey, {
      apiVersion: '2025-08-27.basil',
    });
    
    // 获取今日开始时间戳（UTC）
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayStartTimestamp = Math.floor(todayStart.getTime() / 1000);
    
    // 获取今日的所有 Charge（支付记录）
    const charges = await stripe.charges.list({
      created: {
        gte: todayStartTimestamp,
      },
      limit: 100, // 最多获取 100 条（可根据需要调整）
    });
    
    // 计算指标
    let todayRevenue = 0;
    let todaySuccessfulCharges = 0;
    let todayRefunds = 0;
    let currency = 'usd';
    
    for (const charge of charges.data) {
      if (charge.status === 'succeeded') {
        todayRevenue += charge.amount;
        todaySuccessfulCharges += 1;
        currency = charge.currency;
      }
      if (charge.refunded) {
        todayRefunds += 1;
      }
    }
    
    return {
      todayRevenue,
      todayTransactions: charges.data.length,
      todaySuccessfulCharges,
      todayRefunds,
      currency,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Stripe fetch error:', error);
    throw new Error(
      `Failed to fetch Stripe metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * 验证 Stripe 配置是否有效
 * 
 * @param config - Stripe API 配置
 * @returns true 如果配置有效
 */
export async function validateStripeConfig(
  config: NonNullable<SiteApiConfig['stripe']>
): Promise<boolean> {
  try {
    const stripe = new Stripe(config.secretKey, {
      apiVersion: '2025-08-27.basil',
    });
    
    // 尝试获取账户信息来验证 API Key
    await stripe.balance.retrieve();
    return true;
  } catch {
    return false;
  }
}

/**
 * 格式化 Stripe 指标为显示文本
 * 
 * @param metrics - Stripe 指标数据
 * @returns 格式化后的文本对象
 */
export function formatStripeMetrics(metrics: StripeMetrics) {
  const amount = (metrics.todayRevenue / 100).toFixed(2);
  const currencySymbol = getCurrencySymbol(metrics.currency);
  
  return {
    todayRevenue: `${currencySymbol}${amount}`,
    todayTransactions: metrics.todayTransactions.toLocaleString(),
    todaySuccessfulCharges: metrics.todaySuccessfulCharges.toLocaleString(),
    todayRefunds: metrics.todayRefunds.toLocaleString(),
  };
}

/**
 * 获取货币符号
 */
function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    usd: '$',
    eur: '€',
    gbp: '£',
    jpy: '¥',
    cny: '¥',
    cad: 'C$',
    aud: 'A$',
    hkd: 'HK$',
  };
  
  return symbols[currency.toLowerCase()] || currency.toUpperCase();
}







