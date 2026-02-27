/**
 * Plan limits service
 * Handles user plan type retrieval and limit checking
 * 
 * Note: This is a simplified implementation for Digital Heirloom
 * The original media extraction features are not part of Digital Heirloom
 */

import { db } from '@/core/db';
import { user, subscription } from '@/config/db/schema';
import { eq } from 'drizzle-orm';
import { PlanType } from '@/shared/config/plans';
import { getPlanConfig } from '@/shared/config/plans';

export interface PlanLimits {
  planType: PlanType;
  freeTrialUsed?: number;
  subscriptionLimits?: {
    maxVideoDuration?: number | null;
    concurrentLimit?: number | null;
    translationCharLimit?: number | null;
  };
}

/**
 * Get user plan type
 * First checks user.planType, then checks active subscription
 * Defaults to 'free' if no plan found
 */
export async function getUserPlanType(userId: string): Promise<PlanType> {
  try {
    // First check user.planType field
    const result = await db()
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    const [userRecord] = result;

    if (userRecord?.planType) {
      return (userRecord.planType as PlanType) || 'free';
    }

    // Fallback: check active subscription
    const subResult = await db()
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .where(eq(subscription.status, 'active'))
      .limit(1);
    const [userSub] = subResult;

    if (userSub?.planType) {
      return (userSub.planType as PlanType) || 'free';
    }

    return 'free';
  } catch (error) {
    console.error('Error getting user plan type:', error);
    return 'free';
  }
}

/**
 * Get user plan limits
 * Returns plan type and limits based on user planType or subscription
 */
export async function getUserPlanLimits(userId: string): Promise<PlanLimits> {
  try {
    const planType = await getUserPlanType(userId);
    const planConfig = getPlanConfig(planType);

    // Get user record for freeTrialUsed
    const userResult = await db()
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    const [userRecord] = userResult;

    // Get active subscription for subscription-specific limits
    const subResult2 = await db()
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .where(eq(subscription.status, 'active'))
      .limit(1);
    const [userSub] = subResult2;

    // Use subscription limits if available, otherwise use plan config defaults
    const subscriptionLimits = userSub ? {
      maxVideoDuration: userSub.maxVideoDuration ?? planConfig.maxVideoDuration,
      concurrentLimit: userSub.concurrentLimit ?? planConfig.concurrentLimit,
      translationCharLimit: userSub.translationCharLimit ?? planConfig.translationCharLimit,
    } : {
      maxVideoDuration: planConfig.maxVideoDuration,
      concurrentLimit: planConfig.concurrentLimit,
      translationCharLimit: planConfig.translationCharLimit,
    };

    return {
      planType,
      freeTrialUsed: userRecord?.freeTrialUsed || 0,
      subscriptionLimits,
    };
  } catch (error) {
    console.error('Error getting user plan limits:', error);
    // Return default free plan limits
    const freeConfig = getPlanConfig('free');
    return {
      planType: 'free',
      freeTrialUsed: 0,
      subscriptionLimits: {
        maxVideoDuration: freeConfig.maxVideoDuration,
        concurrentLimit: freeConfig.concurrentLimit,
        translationCharLimit: freeConfig.translationCharLimit,
      },
    };
  }
}

/**
 * Check if user can perform an action based on plan limits
 * This is a placeholder for future implementation
 */
export async function checkAllPlanLimits(
  userId: string,
  action: 'extract' | 'video' | 'translate',
  options?: {
    videoDuration?: number;
    concurrentTasks?: number;
    translationChars?: number;
  }
): Promise<{ allowed: boolean; reason?: string }> {
  const limits = await getUserPlanLimits(userId);
  const planConfig = getPlanConfig(limits.planType);

  // Check video duration limit
  if (options?.videoDuration && planConfig.maxVideoDuration) {
    if (options.videoDuration > planConfig.maxVideoDuration) {
      return {
        allowed: false,
        reason: `Video duration exceeds plan limit of ${planConfig.maxVideoDuration} seconds`,
      };
    }
  }

  // Check concurrent limit
  if (options?.concurrentTasks && planConfig.concurrentLimit) {
    if (options.concurrentTasks >= planConfig.concurrentLimit) {
      return {
        allowed: false,
        reason: `Concurrent task limit of ${planConfig.concurrentLimit} reached`,
      };
    }
  }

  // Check translation character limit
  if (options?.translationChars && planConfig.translationCharLimit) {
    if (options.translationChars > planConfig.translationCharLimit) {
      return {
        allowed: false,
        reason: `Translation character limit of ${planConfig.translationCharLimit} exceeded`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Get estimated credits cost for a media task
 * Re-export from plans config for convenience
 */
export { getEstimatedCreditsCost } from '@/shared/config/plans';

