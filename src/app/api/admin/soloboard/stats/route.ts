/**
 * SoloBoard 管理员统计 API
 * GET /api/admin/soloboard/stats
 * 
 * 返回:
 * - 总站点数
 * - 活跃用户数
 * - 今日同步次数
 * - 异常站点数
 * - 按套餐统计
 * - 按平台统计
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { db } from '@/core/db';
import { monitoredSites, users, subscriptions } from '@/config/db/schema';
import { eq, and, gte, count, sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. 验证管理员权限
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查是否是管理员
    const user = await db()
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user[0] || user[0].role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. 获取统计数据
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 总站点数
    const totalSitesResult = await db()
      .select({ count: count() })
      .from(monitoredSites);
    const totalSites = totalSitesResult[0]?.count || 0;

    // 活跃用户数（有站点的用户）
    const activeUsersResult = await db()
      .select({ userId: monitoredSites.userId })
      .from(monitoredSites)
      .groupBy(monitoredSites.userId);
    const activeUsers = activeUsersResult.length;

    // 今日同步次数
    const todaySyncsResult = await db()
      .select({ count: count() })
      .from(monitoredSites)
      .where(gte(monitoredSites.lastSyncAt, today));
    const todaySyncs = todaySyncsResult[0]?.count || 0;

    // 异常站点数（同步失败或离线）
    const errorSitesResult = await db()
      .select({ count: count() })
      .from(monitoredSites)
      .where(eq(monitoredSites.lastSyncStatus, 'error'));
    const errorSites = errorSitesResult[0]?.count || 0;

    // 按套餐统计站点数
    const sitesByPlan = await db()
      .select({
        plan: subscriptions.planName,
        count: count(),
      })
      .from(monitoredSites)
      .leftJoin(subscriptions, eq(monitoredSites.userId, subscriptions.userId))
      .groupBy(subscriptions.planName);

    // 按平台统计站点数
    const allSites = await db().select().from(monitoredSites);
    const platformStats: Record<string, number> = {};
    
    allSites.forEach((site) => {
      const platform = site.platform || 'UPTIME';
      platformStats[platform] = (platformStats[platform] || 0) + 1;
    });

    // 同步成功率（最近24小时）
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSyncsResult = await db()
      .select({
        status: monitoredSites.lastSyncStatus,
        count: count(),
      })
      .from(monitoredSites)
      .where(gte(monitoredSites.lastSyncAt, yesterday))
      .groupBy(monitoredSites.lastSyncStatus);

    const successCount = recentSyncsResult.find(r => r.status === 'success')?.count || 0;
    const totalRecentSyncs = recentSyncsResult.reduce((sum, r) => sum + (r.count || 0), 0);
    const syncSuccessRate = totalRecentSyncs > 0 
      ? Math.round((successCount / totalRecentSyncs) * 100) 
      : 100;

    return NextResponse.json({
      stats: {
        totalSites,
        activeUsers,
        todaySyncs,
        errorSites,
        syncSuccessRate,
      },
      sitesByPlan: sitesByPlan.map(item => ({
        plan: item.plan || 'Free',
        count: item.count || 0,
      })),
      sitesByPlatform: Object.entries(platformStats).map(([platform, count]) => ({
        platform,
        count,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

