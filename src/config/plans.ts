/**
 * 会员计划配置
 * 定义不同会员等级的权限和限制
 */

export interface PlanFeatures {
  // 基础限制
  maxProjects: number;
  maxDataSources: number;
  
  // 数据源支持
  dataSources: {
    ga4: boolean;
    stripe: boolean;
    uptime: boolean;
    shopify: boolean;
    lemonSqueezy: boolean;
    creem: boolean;
  };
  
  // 刷新频率
  autoRefreshInterval: number; // 分钟
  
  // 数据保留
  dataRetentionDays: number; // 天数，-1 表示永久
  
  // 功能权限
  features: {
    basicDashboard: boolean;
    advancedAnalytics: boolean;
    emailAlerts: boolean;
    realtimeSync: boolean;
    whiteLabel: boolean;
    customDomain: boolean;
    teamCollaboration: boolean;
    apiAccess: boolean;
  };
  
  // 支持等级
  support: 'community' | 'priority' | 'dedicated';
  
  // 价格
  price: {
    monthly: number;
    annual: number;
    currency: string;
  };
}

export const PLAN_CONFIGS: Record<string, PlanFeatures> = {
  free: {
    maxProjects: 1,
    maxDataSources: 3,
    
    dataSources: {
      ga4: true,
      stripe: true,
      uptime: true,
      shopify: false,
      lemonSqueezy: false,
      creem: false,
    },
    
    autoRefreshInterval: 48 * 60, // 48 小时
    dataRetentionDays: 7, // 7 天
    
    features: {
      basicDashboard: true,
      advancedAnalytics: false,
      emailAlerts: false,
      realtimeSync: false,
      whiteLabel: false,
      customDomain: false,
      teamCollaboration: false,
      apiAccess: false,
    },
    
    support: 'community',
    
    price: {
      monthly: 0,
      annual: 0,
      currency: 'USD',
    },
  },
  
  base: {
    maxProjects: 5,
    maxDataSources: 999, // 无限制
    
    dataSources: {
      ga4: true,
      stripe: true,
      uptime: true,
      shopify: true,
      lemonSqueezy: true,
      creem: true,
    },
    
    autoRefreshInterval: 6 * 60, // 6 小时
    dataRetentionDays: 365, // 1 年
    
    features: {
      basicDashboard: true,
      advancedAnalytics: true,
      emailAlerts: true,
      realtimeSync: false,
      whiteLabel: false,
      customDomain: false,
      teamCollaboration: false,
      apiAccess: false,
    },
    
    support: 'priority',
    
    price: {
      monthly: 19.9,
      annual: 199, // 约 16.6/月，节省 20%
      currency: 'USD',
    },
  },
  
  pro: {
    maxProjects: 10,
    maxDataSources: 999, // 无限制
    
    dataSources: {
      ga4: true,
      stripe: true,
      uptime: true,
      shopify: true,
      lemonSqueezy: true,
      creem: true,
    },
    
    autoRefreshInterval: 60, // 60 分钟实时同步
    dataRetentionDays: -1, // 永久保留
    
    features: {
      basicDashboard: true,
      advancedAnalytics: true,
      emailAlerts: true,
      realtimeSync: true,
      whiteLabel: true,
      customDomain: true,
      teamCollaboration: true,
      apiAccess: true,
    },
    
    support: 'dedicated',
    
    price: {
      monthly: 39.9,
      annual: 399, // 约 33.3/月，节省 17%
      currency: 'USD',
    },
  },
};

/**
 * 获取用户的计划配置
 */
export function getUserPlanFeatures(planType: string): PlanFeatures {
  return PLAN_CONFIGS[planType] || PLAN_CONFIGS.free;
}

/**
 * 检查用户是否有权限访问某个功能
 */
export function hasFeatureAccess(
  planType: string,
  feature: keyof PlanFeatures['features']
): boolean {
  const plan = getUserPlanFeatures(planType);
  return plan.features[feature];
}

/**
 * 检查用户是否可以添加更多项目
 */
export function canAddProject(planType: string, currentProjects: number): boolean {
  const plan = getUserPlanFeatures(planType);
  return currentProjects < plan.maxProjects;
}

/**
 * 检查用户是否可以添加数据源
 */
export function canAddDataSource(
  planType: string,
  currentDataSources: number,
  dataSourceType: keyof PlanFeatures['dataSources']
): boolean {
  const plan = getUserPlanFeatures(planType);
  
  // 检查是否支持该数据源类型
  if (!plan.dataSources[dataSourceType]) {
    return false;
  }
  
  // 检查数量限制
  return currentDataSources < plan.maxDataSources;
}

/**
 * 获取刷新间隔（分钟）
 */
export function getRefreshInterval(planType: string): number {
  const plan = getUserPlanFeatures(planType);
  return plan.autoRefreshInterval;
}

/**
 * 获取数据保留天数
 */
export function getDataRetentionDays(planType: string): number {
  const plan = getUserPlanFeatures(planType);
  return plan.dataRetentionDays;
}

/**
 * 计划比较数据（用于定价页面）
 */
export const PLAN_COMPARISON = [
  {
    feature: 'Projects',
    free: '1 Project',
    base: '5 Projects',
    pro: '10 Projects',
  },
  {
    feature: 'Data Sources',
    free: '3 Sources (GA4/Stripe/Uptime)',
    base: 'All Sources (+ Shopify/Lemon Squeezy)',
    pro: 'All Sources',
  },
  {
    feature: 'Auto-refresh',
    free: '48h',
    base: '6h',
    pro: '60-min Real-time',
  },
  {
    feature: 'Data History',
    free: '7-day Cache',
    base: '1-year History',
    pro: 'Permanent History',
  },
  {
    feature: 'Dashboard',
    free: 'Basic Dashboard',
    base: 'Advanced Analytics',
    pro: 'Advanced Analytics',
  },
  {
    feature: 'Email Alerts',
    free: '❌',
    base: '✅',
    pro: '✅',
  },
  {
    feature: 'White-label',
    free: '❌',
    base: '❌',
    pro: '✅ Custom Domain',
  },
  {
    feature: 'Team Collaboration',
    free: '❌',
    base: '❌',
    pro: '✅',
  },
  {
    feature: 'API Access',
    free: '❌',
    base: '❌',
    pro: '✅',
  },
  {
    feature: 'Support',
    free: 'Community',
    base: 'Priority',
    pro: 'Dedicated',
  },
];










