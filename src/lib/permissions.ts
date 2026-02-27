/**
 * 权限检查中间件和工具函数
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { db } from '@/core/db';
import { user } from '@/config/db/schema';
import { eq } from 'drizzle-orm';
import { getUserPlanFeatures, hasFeatureAccess } from '@/config/plans';

/**
 * 获取当前用户的计划类型
 */
export async function getUserPlan(userId: string): Promise<string> {
  const users = await db().select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  
  if (users.length === 0) {
    return 'free';
  }
  
  return users[0].planType || 'free';
}

/**
 * 权限检查中间件
 * 用于保护需要特定计划才能访问的 API
 */
export async function requirePlan(
  req: NextRequest,
  requiredPlan: 'free' | 'base' | 'pro'
): Promise<{ authorized: boolean; userId?: string; planType?: string; error?: string }> {
  try {
    // 1. 验证用户登录
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return {
        authorized: false,
        error: 'Unauthorized - Please login',
      };
    }

    // 2. 获取用户计划
    const planType = await getUserPlan(session.user.id);

    // 3. 检查计划等级
    const planLevels = { free: 0, base: 1, pro: 2 };
    const userLevel = planLevels[planType as keyof typeof planLevels] || 0;
    const requiredLevel = planLevels[requiredPlan];

    if (userLevel < requiredLevel) {
      return {
        authorized: false,
        userId: session.user.id,
        planType,
        error: `This feature requires ${requiredPlan} plan or higher`,
      };
    }

    return {
      authorized: true,
      userId: session.user.id,
      planType,
    };
  } catch (error: any) {
    return {
      authorized: false,
      error: error.message,
    };
  }
}

/**
 * 检查功能权限
 */
export async function checkFeatureAccess(
  userId: string,
  feature: string
): Promise<boolean> {
  const planType = await getUserPlan(userId);
  const plan = getUserPlanFeatures(planType);
  
  return (plan.features as any)[feature] || false;
}

/**
 * 权限错误响应
 */
export function unauthorizedResponse(message?: string) {
  return NextResponse.json(
    {
      error: 'Unauthorized',
      message: message || 'You do not have permission to access this resource',
      upgradeUrl: '/pricing',
    },
    { status: 403 }
  );
}

/**
 * 计划限制错误响应
 */
export function planLimitResponse(
  currentPlan: string,
  requiredPlan: string,
  feature: string
) {
  return NextResponse.json(
    {
      error: 'Plan Limit Exceeded',
      message: `This feature requires ${requiredPlan} plan`,
      currentPlan,
      requiredPlan,
      feature,
      upgradeUrl: '/pricing',
    },
    { status: 403 }
  );
}

/**
 * 使用示例：
 * 
 * // 在 API 路由中使用
 * export async function POST(req: NextRequest) {
 *   const auth = await requirePlan(req, 'pro');
 *   
 *   if (!auth.authorized) {
 *     return unauthorizedResponse(auth.error);
 *   }
 *   
 *   // 继续处理请求
 *   const userId = auth.userId;
 *   const planType = auth.planType;
 *   
 *   // ...
 * }
 */










