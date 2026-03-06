/**
 * Shopify Platform Fetcher
 * 
 * 用途：获取 Shopify 店铺的销售、流量和产品数据
 * 不改变 ShipAny 结构，仅扩展功能
 */

interface ShopifyConfig {
  shopDomain: string;
  accessToken: string;
  apiVersion?: string;
}

interface ShopifyMetrics {
  todayRevenue: number;
  todayOrders: number;
  todayVisitors: number;
  conversionRate: number;
  averageOrderValue: number;
  totalRevenue: number;
  totalCustomers: number;
  updatedAt: string;
}

/**
 * 获取 Shopify 指标数据
 */
export async function fetchShopifyMetrics(
  config: ShopifyConfig
): Promise<ShopifyMetrics> {
  const { shopDomain, accessToken, apiVersion = '2024-01' } = config;
  
  if (!shopDomain || !accessToken) {
    throw new Error('Shopify shop domain and access token are required');
  }
  
  const baseUrl = `https://${shopDomain}/admin/api/${apiVersion}`;
  const headers = {
    'X-Shopify-Access-Token': accessToken,
    'Content-Type': 'application/json',
  };
  
  try {
    // 获取今日时间范围
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    // 1. 获取今日订单数据
    const ordersResponse = await fetch(
      `${baseUrl}/orders.json?status=any&created_at_min=${todayStart.toISOString()}&created_at_max=${todayEnd.toISOString()}&limit=250`,
      { headers }
    );
    
    if (!ordersResponse.ok) {
      throw new Error(`Shopify API error: ${ordersResponse.status}`);
    }
    
    const ordersData = await ordersResponse.json();
    
    // 计算今日收入和订单数
    let todayRevenue = 0;
    let todayOrders = 0;
    
    if (ordersData.orders && Array.isArray(ordersData.orders)) {
      todayOrders = ordersData.orders.length;
      todayRevenue = ordersData.orders.reduce((sum: number, order: any) => {
        // Shopify 金额是字符串格式，需要转换
        const amount = parseFloat(order.total_price || '0');
        return sum + (amount * 100); // 转换为分
      }, 0);
    }
    
    // 计算平均订单价值
    const averageOrderValue = todayOrders > 0 ? todayRevenue / todayOrders : 0;
    
    // 2. 获取店铺总体数据
    const shopResponse = await fetch(
      `${baseUrl}/shop.json`,
      { headers }
    );
    
    let totalCustomers = 0;
    if (shopResponse.ok) {
      const shopData = await shopResponse.json();
      totalCustomers = shopData.shop?.customer_count || 0;
    }
    
    // 3. 获取客户数据（用于计算转化率）
    const customersResponse = await fetch(
      `${baseUrl}/customers.json?created_at_min=${todayStart.toISOString()}&limit=250`,
      { headers }
    );
    
    let todayVisitors = 0;
    if (customersResponse.ok) {
      const customersData = await customersResponse.json();
      todayVisitors = customersData.customers?.length || 0;
    }
    
    // 计算转化率（简化版本，实际需要访客数据）
    const conversionRate = todayVisitors > 0 ? (todayOrders / todayVisitors) * 100 : 0;
    
    // 4. 获取历史订单总额（可选）
    const allOrdersResponse = await fetch(
      `${baseUrl}/orders.json?status=any&limit=250`,
      { headers }
    );
    
    let totalRevenue = 0;
    if (allOrdersResponse.ok) {
      const allOrdersData = await allOrdersResponse.json();
      if (allOrdersData.orders && Array.isArray(allOrdersData.orders)) {
        totalRevenue = allOrdersData.orders.reduce((sum: number, order: any) => {
          const amount = parseFloat(order.total_price || '0');
          return sum + (amount * 100);
        }, 0);
      }
    }
    
    return {
      todayRevenue,
      todayOrders,
      todayVisitors,
      conversionRate,
      averageOrderValue,
      totalRevenue,
      totalCustomers,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to fetch Shopify metrics:', error);
    throw error;
  }
}

/**
 * 验证 Shopify API 配置
 */
export async function validateShopifyConfig(
  config: ShopifyConfig
): Promise<boolean> {
  try {
    const { shopDomain, accessToken, apiVersion = '2024-01' } = config;
    
    const response = await fetch(
      `https://${shopDomain}/admin/api/${apiVersion}/shop.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Shopify config validation failed:', error);
    return false;
  }
}

/**
 * 获取 Shopify 产品列表
 */
export async function fetchShopifyProducts(
  config: ShopifyConfig
): Promise<any[]> {
  const { shopDomain, accessToken, apiVersion = '2024-01' } = config;
  
  try {
    const response = await fetch(
      `https://${shopDomain}/admin/api/${apiVersion}/products.json?limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }
    
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Failed to fetch Shopify products:', error);
    return [];
  }
}

/**
 * 获取 Shopify 库存信息
 */
export async function fetchShopifyInventory(
  config: ShopifyConfig
): Promise<any[]> {
  const { shopDomain, accessToken, apiVersion = '2024-01' } = config;
  
  try {
    const response = await fetch(
      `https://${shopDomain}/admin/api/${apiVersion}/inventory_levels.json?limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch inventory: ${response.status}`);
    }
    
    const data = await response.json();
    return data.inventory_levels || [];
  } catch (error) {
    console.error('Failed to fetch Shopify inventory:', error);
    return [];
  }
}

