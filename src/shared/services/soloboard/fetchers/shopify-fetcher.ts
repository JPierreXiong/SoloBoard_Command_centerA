/**
 * Shopify Fetcher - Shopify 电商数据获取
 * 
 * 功能:
 * - 获取今日订单
 * - 计算今日收入
 * - 统计访客数（订单数）
 */

export interface ShopifyConfig {
  shop: string; // 例如: mystore.myshopify.com
  accessToken: string;
  apiVersion?: string;
}

export interface ShopifyMetrics {
  revenue: number;
  orders: number;
  visitors: number; // 简化：使用订单数作为访客数
  currency: string;
  source: 'shopify';
  fetchedAt: Date;
}

export async function fetchShopifyMetrics(
  config: ShopifyConfig
): Promise<ShopifyMetrics> {
  const { shop, accessToken, apiVersion = '2024-01' } = config;

  try {
    // 获取今日日期范围
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // 调用 Shopify Admin API
    const url = `https://${shop}/admin/api/${apiVersion}/orders.json?created_at_min=${todayISO}&status=any`;

    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const orders = data.orders || [];

    // 计算指标
    let totalRevenue = 0;
    let currency = 'USD';

    orders.forEach((order: any) => {
      totalRevenue += parseFloat(order.total_price || 0);
      if (order.currency) {
        currency = order.currency;
      }
    });

    return {
      revenue: totalRevenue,
      orders: orders.length,
      visitors: orders.length, // 简化：订单数 = 访客数
      currency,
      source: 'shopify',
      fetchedAt: new Date(),
    };
  } catch (error: any) {
    console.error('Shopify fetch error:', error);
    throw new Error(`Failed to fetch Shopify metrics: ${error.message}`);
  }
}

/**
 * 验证 Shopify 配置
 */
export async function validateShopifyConfig(
  config: ShopifyConfig
): Promise<boolean> {
  try {
    const { shop, accessToken, apiVersion = '2024-01' } = config;
    const url = `https://${shop}/admin/api/${apiVersion}/shop.json`;

    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}





