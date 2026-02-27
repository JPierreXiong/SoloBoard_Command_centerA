/**
 * SoloBoard - Stripe 数据抓取服务
 * 
 * 使用 Stripe API 抓取收入和交易数据
 * 
 * 支持的指标：
 * - 今日收入
 * - 本月收入
 * - 今日交易数
 * - 本月交易数
 * - 待处理金额
 */

import Stripe from 'stripe';

export interface StripeConfig {
  secretKey: string;
}

export interface StripeMetrics {
  todayRevenue: number;
  monthRevenue: number;
  todayTransactions: number;
  monthTransactions: number;
  pendingAmount: number;
  currency: string;
  lastSync: string;
}

/**
 * 抓取 Stripe 数据
 * 
 * @param config Stripe 配置
 * @returns Stripe 指标数据
 */
export async function fetchStripeMetrics(config: StripeConfig): Promise<StripeMetrics> {
  try {
    // 1. 初始化 Stripe 客户端
    const stripe = new Stripe(config.secretKey, {
      apiVersion: '2025-08-27.basil',
    });

    // 2. 计算时间范围
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const todayTimestamp = Math.floor(todayStart.getTime() / 1000);
    const monthTimestamp = Math.floor(monthStart.getTime() / 1000);

    // 3. 获取今日收入（已成功的支付）
    const todayCharges = await stripe.charges.list({
      created: { gte: todayTimestamp },
      limit: 100,
    });

    const todaySuccessful = todayCharges.data.filter(
      (charge) => charge.status === 'succeeded'
    );

    const todayRevenue = todaySuccessful.reduce(
      (sum, charge) => sum + charge.amount,
      0
    ) / 100; // 转换为主货币单位

    const todayTransactions = todaySuccessful.length;

    // 4. 获取本月收入
    const monthCharges = await stripe.charges.list({
      created: { gte: monthTimestamp },
      limit: 100,
    });

    const monthSuccessful = monthCharges.data.filter(
      (charge) => charge.status === 'succeeded'
    );

    const monthRevenue = monthSuccessful.reduce(
      (sum, charge) => sum + charge.amount,
      0
    ) / 100;

    const monthTransactions = monthSuccessful.length;

    // 5. 获取待处理金额（pending balance）
    const balance = await stripe.balance.retrieve();
    const pendingAmount = balance.pending.reduce(
      (sum, item) => sum + item.amount,
      0
    ) / 100;

    // 6. 获取货币类型（从第一笔交易）
    const currency = todaySuccessful[0]?.currency?.toUpperCase() || 'USD';

    return {
      todayRevenue,
      monthRevenue,
      todayTransactions,
      monthTransactions,
      pendingAmount,
      currency,
      lastSync: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Stripe Fetch Error:', error);
    
    if (error instanceof Error) {
      throw new Error(`Failed to fetch Stripe metrics: ${error.message}`);
    }
    
    throw new Error('Failed to fetch Stripe metrics: Unknown error');
  }
}

/**
 * 验证 Stripe 配置是否有效
 * 
 * @param config Stripe 配置
 * @returns 是否有效
 */
export async function validateStripeConfig(config: StripeConfig): Promise<boolean> {
  try {
    const stripe = new Stripe(config.secretKey, {
      apiVersion: '2025-08-27.basil',
    });
    
    // 尝试获取账户信息来验证 API Key
    await stripe.balance.retrieve();
    return true;
  } catch (error) {
    console.error('Stripe Config Validation Failed:', error);
    return false;
  }
}






