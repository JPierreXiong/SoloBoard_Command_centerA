/**
 * SoloBoard - Creem 数据抓取服务
 * 
 * 使用 Creem API 抓取收入和订阅数据
 * 
 * 支持的指标：
 * - 今日收入
 * - 本月收入
 * - 活跃订阅数
 * - 新增订阅数
 * - 取消订阅数
 * - MRR (月度经常性收入)
 */

export interface CreemConfig {
  apiKey: string;
  apiSecret?: string;
}

export interface CreemMetrics {
  todayRevenue: number;
  monthRevenue: number;
  activeSubscriptions: number;
  newSubscriptions: number;
  canceledSubscriptions: number;
  mrr: number; // Monthly Recurring Revenue
  currency: string;
  lastSync: string;
}

/**
 * 抓取 Creem 数据
 * 
 * @param config Creem 配置
 * @returns Creem 指标数据
 */
export async function fetchCreemMetrics(config: CreemConfig): Promise<CreemMetrics> {
  try {
    const baseUrl = 'https://api.creem.io/v1';
    const headers = {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    };

    // 1. 计算时间范围
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const todayTimestamp = todayStart.toISOString();
    const monthTimestamp = monthStart.toISOString();

    // 2. 获取今日收入
    const todayRevenueResponse = await fetch(
      `${baseUrl}/payments?start_date=${todayTimestamp}&status=succeeded`,
      { headers }
    );
    
    if (!todayRevenueResponse.ok) {
      throw new Error(`Creem API error: ${todayRevenueResponse.status}`);
    }
    
    const todayPayments = await todayRevenueResponse.json();
    const todayRevenue = todayPayments.data?.reduce(
      (sum: number, payment: any) => sum + (payment.amount || 0),
      0
    ) / 100; // 转换为主货币单位

    // 3. 获取本月收入
    const monthRevenueResponse = await fetch(
      `${baseUrl}/payments?start_date=${monthTimestamp}&status=succeeded`,
      { headers }
    );
    
    const monthPayments = await monthRevenueResponse.json();
    const monthRevenue = monthPayments.data?.reduce(
      (sum: number, payment: any) => sum + (payment.amount || 0),
      0
    ) / 100;

    // 4. 获取订阅数据
    const subscriptionsResponse = await fetch(
      `${baseUrl}/subscriptions?status=active`,
      { headers }
    );
    
    const subscriptions = await subscriptionsResponse.json();
    const activeSubscriptions = subscriptions.data?.length || 0;

    // 5. 获取本月新增订阅
    const newSubsResponse = await fetch(
      `${baseUrl}/subscriptions?created_after=${monthTimestamp}`,
      { headers }
    );
    
    const newSubs = await newSubsResponse.json();
    const newSubscriptions = newSubs.data?.length || 0;

    // 6. 获取本月取消订阅
    const canceledSubsResponse = await fetch(
      `${baseUrl}/subscriptions?status=canceled&canceled_after=${monthTimestamp}`,
      { headers }
    );
    
    const canceledSubs = await canceledSubsResponse.json();
    const canceledSubscriptions = canceledSubs.data?.length || 0;

    // 7. 计算 MRR (月度经常性收入)
    const mrr = subscriptions.data?.reduce(
      (sum: number, sub: any) => {
        // 根据订阅周期计算月度收入
        const amount = sub.amount || 0;
        const interval = sub.interval || 'month';
        
        if (interval === 'month') {
          return sum + amount;
        } else if (interval === 'year') {
          return sum + (amount / 12);
        } else if (interval === 'week') {
          return sum + (amount * 4.33);
        }
        return sum;
      },
      0
    ) / 100;

    // 8. 获取货币类型
    const currency = todayPayments.data?.[0]?.currency?.toUpperCase() || 'USD';

    return {
      todayRevenue,
      monthRevenue,
      activeSubscriptions,
      newSubscriptions,
      canceledSubscriptions,
      mrr,
      currency,
      lastSync: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Creem Fetch Error:', error);
    
    if (error instanceof Error) {
      throw new Error(`Failed to fetch Creem metrics: ${error.message}`);
    }
    
    throw new Error('Failed to fetch Creem metrics: Unknown error');
  }
}

/**
 * 验证 Creem 配置是否有效
 * 
 * @param config Creem 配置
 * @returns 是否有效
 */
export async function validateCreemConfig(config: CreemConfig): Promise<boolean> {
  try {
    const response = await fetch('https://api.creem.io/v1/account', {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Creem Config Validation Failed:', error);
    return false;
  }
}

/**
 * 获取 Creem 订阅详情
 * 
 * @param config Creem 配置
 * @param subscriptionId 订阅 ID
 * @returns 订阅详情
 */
export async function getCreemSubscription(
  config: CreemConfig,
  subscriptionId: string
): Promise<any> {
  try {
    const response = await fetch(
      `https://api.creem.io/v1/subscriptions/${subscriptionId}`,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch subscription: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get Creem Subscription Error:', error);
    throw error;
  }
}

/**
 * 获取 Creem 客户列表
 * 
 * @param config Creem 配置
 * @param limit 返回数量限制
 * @returns 客户列表
 */
export async function getCreemCustomers(
  config: CreemConfig,
  limit: number = 100
): Promise<any[]> {
  try {
    const response = await fetch(
      `https://api.creem.io/v1/customers?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch customers: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get Creem Customers Error:', error);
    throw error;
  }
}






















