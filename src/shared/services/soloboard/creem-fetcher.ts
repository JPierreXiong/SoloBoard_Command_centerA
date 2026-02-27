/**
 * Creem Revenue Fetcher
 * 用于 SoloBoard 监控用户的 Creem 店铺收入
 * 
 * 注意：这与 src/extensions/payment/creem.ts 不同
 * - payment/creem.ts: 用于 SoloBoard 自己收款
 * - 这个文件: 用于监控用户的 Creem 店铺
 */

interface CreemConfig {
  apiKey: string;
  environment?: 'sandbox' | 'production';
}

interface CreemMetrics {
  todayRevenue: number; // in cents
  todayOrders: number;
  currency: string;
}

/**
 * 获取 Creem 今日销售数据
 */
export async function fetchCreemMetrics(
  config: CreemConfig
): Promise<CreemMetrics> {
  try {
    const baseUrl =
      config.environment === 'production'
        ? 'https://api.creem.io'
        : 'https://test-api.creem.io';

    // 获取今日日期范围
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayEnd = tomorrow.toISOString();

    // 调用 Creem API 获取订单列表
    // 文档: https://docs.creem.io/api-reference/orders
    const response = await fetch(
      `${baseUrl}/v1/orders?created_after=${todayStart}&created_before=${todayEnd}&status=paid`,
      {
        method: 'GET',
        headers: {
          'x-api-key': config.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Creem API error: ${response.status}`);
    }

    const data = await response.json();

    // 聚合今日成功订单
    let totalAmount = 0;
    let orderCount = 0;
    let currency = 'USD';

    if (data.orders && Array.isArray(data.orders)) {
      data.orders.forEach((order: any) => {
        if (order.status === 'paid') {
          totalAmount += order.amount || 0; // Creem 返回的金额单位（需确认是否为 cents）
          orderCount++;
          if (order.currency) {
            currency = order.currency;
          }
        }
      });
    }

    return {
      todayRevenue: totalAmount,
      todayOrders: orderCount,
      currency,
    };
  } catch (error) {
    console.error('Error fetching Creem metrics:', error);
    
    // 返回空数据而不是抛出错误，避免影响其他平台的数据获取
    return {
      todayRevenue: 0,
      todayOrders: 0,
      currency: 'USD',
    };
  }
}

/**
 * 测试 Creem API 连接
 */
export async function testCreemConnection(
  config: CreemConfig
): Promise<boolean> {
  try {
    const baseUrl =
      config.environment === 'production'
        ? 'https://api.creem.io'
        : 'https://test-api.creem.io';

    const response = await fetch(`${baseUrl}/v1/account`, {
      method: 'GET',
      headers: {
        'x-api-key': config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Creem connection test failed:', error);
    return false;
  }
}







