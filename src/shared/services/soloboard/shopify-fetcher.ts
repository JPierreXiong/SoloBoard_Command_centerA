/**
 * SoloBoard - Shopify 数据抓取服务
 * 
 * 用于从 Shopify 获取销售数据、订单数、库存等指标
 * 
 * API 文档: https://shopify.dev/docs/api/admin-rest
 */

import type { SiteApiConfig } from '@/shared/lib/site-crypto';

/**
 * Shopify 指标数据类型
 */
export interface ShopifyMetrics {
  todayRevenue: number; // 今日销售额（单位：分）
  todayOrders: number; // 今日订单数
  pendingOrders: number; // 待处理订单
  lowStockProducts: number; // 低库存产品数
  totalProducts: number; // 总产品数
  currency: string; // 货币代码
  updatedAt: string; // 更新时间（ISO 8601）
}

/**
 * 从 Shopify 获取今日指标
 * 
 * @param config - Shopify API 配置
 * @returns Shopify 指标数据
 */
export async function fetchShopifyMetrics(
  config: NonNullable<SiteApiConfig['shopify']>
): Promise<ShopifyMetrics> {
  try {
    const baseUrl = `https://${config.shopDomain}/admin/api/2024-01`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': config.accessToken,
    };

    // 获取今日开始时间
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartISO = todayStart.toISOString();

    // 1. 获取今日订单
    const ordersResponse = await fetch(
      `${baseUrl}/orders.json?status=any&created_at_min=${todayStartISO}&limit=250`,
      { headers }
    );

    if (!ordersResponse.ok) {
      throw new Error(`Shopify API error: ${ordersResponse.status}`);
    }

    const ordersData = await ordersResponse.json();
    const orders = ordersData.orders || [];

    // 计算今日订单指标
    let todayRevenue = 0;
    let todayOrders = orders.length;
    let pendingOrders = 0;
    let currency = 'USD';

    for (const order of orders) {
      const amount = parseFloat(order.total_price || '0');
      todayRevenue += Math.round(amount * 100); // 转换为分
      currency = order.currency || 'USD';
      
      // 统计待处理订单
      if (order.financial_status === 'pending' || order.fulfillment_status === null) {
        pendingOrders++;
      }
    }

    // 2. 获取产品信息（用于库存警告）
    const productsResponse = await fetch(
      `${baseUrl}/products.json?limit=250`,
      { headers }
    );

    const productsData = await productsResponse.json();
    const products = productsData.products || [];
    
    let lowStockProducts = 0;
    let totalProducts = products.length;

    // 检查低库存产品
    for (const product of products) {
      for (const variant of product.variants || []) {
        const inventory = variant.inventory_quantity || 0;
        if (inventory > 0 && inventory < 10) {
          lowStockProducts++;
          break; // 每个产品只计数一次
        }
      }
    }

    return {
      todayRevenue,
      todayOrders,
      pendingOrders,
      lowStockProducts,
      totalProducts,
      currency,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Shopify fetch error:', error);
    throw new Error(
      `Failed to fetch Shopify metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * 验证 Shopify 配置是否有效
 * 
 * @param config - Shopify API 配置
 * @returns true 如果配置有效
 */
export async function validateShopifyConfig(
  config: NonNullable<SiteApiConfig['shopify']>
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://${config.shopDomain}/admin/api/2024-01/shop.json`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': config.accessToken,
        },
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 格式化 Shopify 指标为显示文本
 * 
 * @param metrics - Shopify 指标数据
 * @returns 格式化后的文本对象
 */
export function formatShopifyMetrics(metrics: ShopifyMetrics) {
  const amount = (metrics.todayRevenue / 100).toFixed(2);
  const currencySymbol = getCurrencySymbol(metrics.currency);
  
  return {
    todayRevenue: `${currencySymbol}${amount}`,
    todayOrders: metrics.todayOrders.toLocaleString(),
    pendingOrders: metrics.pendingOrders.toLocaleString(),
    lowStockProducts: metrics.lowStockProducts > 0 
      ? `⚠️ ${metrics.lowStockProducts} 个` 
      : '✅ 正常',
    totalProducts: metrics.totalProducts.toLocaleString(),
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
























