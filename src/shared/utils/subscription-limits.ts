/**
 * SoloBoard - 订阅限制配置
 * 
 * 根据用户订阅计划限制站点数量
 */

export interface SubscriptionLimits {
  maxSites: number;
  planName: string;
  planDisplayName: string;
}

/**
 * 订阅计划配置
 */
export const SUBSCRIPTION_PLANS = {
  free: {
    maxSites: 1,
    planName: 'free',
    planDisplayName: 'Free',
  },
  base: {
    maxSites: 5,
    planName: 'base',
    planDisplayName: 'Base',
  },
  pro: {
    maxSites: Infinity,
    planName: 'pro',
    planDisplayName: 'Pro',
  },
} as const;

/**
 * 根据计划名称获取限制
 */
export function getSubscriptionLimits(planName?: string | null): SubscriptionLimits {
  if (!planName) {
    return SUBSCRIPTION_PLANS.free;
  }

  const normalizedPlan = planName.toLowerCase();
  
  // 匹配计划名称（支持多种格式）
  if (normalizedPlan.includes('pro') || normalizedPlan.includes('premium')) {
    return SUBSCRIPTION_PLANS.pro;
  }
  
  if (normalizedPlan.includes('base') || normalizedPlan.includes('standard')) {
    return SUBSCRIPTION_PLANS.base;
  }
  
  // 默认返回 Free 计划
  return SUBSCRIPTION_PLANS.free;
}

/**
 * 检查用户是否可以添加更多站点
 */
export function canAddMoreSites(
  currentSiteCount: number,
  planName?: string | null
): {
  canAdd: boolean;
  limit: number;
  remaining: number;
  planDisplayName: string;
} {
  const limits = getSubscriptionLimits(planName);
  const remaining = limits.maxSites === Infinity 
    ? Infinity 
    : Math.max(0, limits.maxSites - currentSiteCount);
  
  return {
    canAdd: currentSiteCount < limits.maxSites,
    limit: limits.maxSites,
    remaining,
    planDisplayName: limits.planDisplayName,
  };
}


