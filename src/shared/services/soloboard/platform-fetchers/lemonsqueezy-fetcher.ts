/**
 * Lemon Squeezy Platform Fetcher
 * 
 * 用途：获取 Lemon Squeezy 的销售和订阅数据
 * 不改变 ShipAny 结构，仅扩展功能
 */

interface LemonSqueezyConfig {
  apiKey: string;
  storeId: string;
}

interface LemonSqueezyMetrics {
  todayRevenue: number;
  todayOrders: number;
  activeSubscriptions: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  totalRevenue: number;
  updatedAt: string;
}

/**
 * 获取 Lemon Squeezy 指标数据
 */
export async function fetchLemonSqueezyMetrics(
  config: LemonSqueezyConfig
): Promise<LemonSqueezyMetrics> {
  const { apiKey, storeId } = config;
  
  if (!apiKey || !storeId) {
    throw new Error('Lemon Squeezy API key and Store ID are required');
  }
  
  const baseUrl = 'https://api.lemonsqueezy.com/v1';
  const headers = {
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    'Authorization': `Bearer ${apiKey}`,
  };
  
  try {
    // 获取今日销售数据
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    // 1. 获取订单数据
    const ordersResponse = await fetch(
      `${baseUrl}/orders?filter[store_id]=${storeId}&filter[created_at]=${todayStart.toISOString()},${todayEnd.toISOString()}`,
      { headers }
    );
    
    if (!ordersResponse.ok) {
      throw new Error(`Lemon Squeezy API error: ${ordersResponse.status}`);
    }
    
    const ordersData = await ordersResponse.json();
    
    // 计算今日收入和订单数
    let todayRevenue = 0;
    let todayOrders = 0;
    
    if (ordersData.data && Array.isArray(ordersData.data)) {
      todayOrders = ordersData.data.length;
      todayRevenue = ordersData.data.reduce((sum: number, order: any) => {
        // Lemon Squeezy 金额单位是分
        return sum + (order.attributes.total || 0);
      }, 0);
    }
    
    // 2. 获取活跃订阅数据
    const subscriptionsResponse = await fetch(
      `${baseUrl}/subscriptions?filter[store_id]=${storeId}&filter[status]=active`,
      { headers }
    );
    
    if (!subscriptionsResponse.ok) {
      throw new Error(`Lemon Squeezy Subscriptions API error: ${subscriptionsResponse.status}`);
    }
    
    const subscriptionsData = await subscriptionsResponse.json();
    
    let activeSubscriptions = 0;
    let mrr = 0;
    
    if (subscriptionsData.data && Array.isArray(subscriptionsData.data)) {
      activeSubscriptions = subscriptionsData.data.length;
      
      // 计算 MRR
      mrr = subscriptionsData.data.reduce((sum: number, sub: any) => {
        const price = sub.attributes.first_subscription_item?.price || 0;
        const interval = sub.attributes.billing_anchor || 'month';
        
        // 转换为月度收入
        if (interval === 'year') {
          return sum + (price / 12);
        }
        return sum + price;
      }, 0);
    }
    
    // 计算 ARR
    const arr = mrr * 12;
    
    // 3. 获取总销售额（可选，如果需要历史数据）
    const allOrdersResponse = await fetch(
      `${baseUrl}/orders?filter[store_id]=${storeId}`,
      { headers }
    );
    
    let totalRevenue = 0;
    if (allOrdersResponse.ok) {
      const allOrdersData = await allOrdersResponse.json();
      if (allOrdersData.data && Array.isArray(allOrdersData.data)) {
        totalRevenue = allOrdersData.data.reduce((sum: number, order: any) => {
          return sum + (order.attributes.total || 0);
        }, 0);
      }
    }
    
    return {
      todayRevenue,
      todayOrders,
      activeSubscriptions,
      mrr,
      arr,
      totalRevenue,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to fetch Lemon Squeezy metrics:', error);
    throw error;
  }
}

/**
 * 验证 Lemon Squeezy API 配置
 */
export async function validateLemonSqueezyConfig(
  config: LemonSqueezyConfig
): Promise<boolean> {
  try {
    const { apiKey, storeId } = config;
    
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/stores/${storeId}`,
      {
        headers: {
          'Accept': 'application/vnd.api+json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Lemon Squeezy config validation failed:', error);
    return false;
  }
}

/**
 * 获取 Lemon Squeezy 产品列表
 */
export async function fetchLemonSqueezyProducts(
  config: LemonSqueezyConfig
): Promise<any[]> {
  const { apiKey, storeId } = config;
  
  try {
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/products?filter[store_id]=${storeId}`,
      {
        headers: {
          'Accept': 'application/vnd.api+json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch Lemon Squeezy products:', error);
    return [];
  }
}



