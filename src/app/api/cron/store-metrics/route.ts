/**
 * Vercel Cron Job: Store Daily Metrics
 * 每日凌晨 00:00 执行，存储 Base/Pro 用户的历史数据
 * 
 * 配置在 vercel.json 中
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { monitoredSites, siteMetricsDaily, users } from '@/config/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { aggregateSiteData } from '@/shared/services/soloboard/aggregation-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. 验证 Cron 签名（防止外部恶意调用）
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. 获取所有 Base 和 Pro 用户
    const paidUsers = await db()
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.plan, ['base', 'pro']));

    if (paidUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No paid users to process',
        count: 0,
      });
    }

    const paidUserIds = paidUsers.map(u => u.id);

    // 3. 获取这些用户的所有站点
    const sitesToSnapshot = await db()
      .select()
      .from(monitoredSites)
      .where(inArray(monitoredSites.userId, paidUserIds));

    // 4. 昨天的日期（因为是凌晨执行，存储昨天的数据）
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // 5. 并行获取所有站点的数据并存储
    const snapshots = await Promise.all(
      sitesToSnapshot.map(async (site) => {
        try {
          const apiConfig = site.apiConfig as any || {};
          const platforms = apiConfig.platforms || {};

          // 调用聚合服务获取昨日数据
          const metrics = await aggregateSiteData({
            id: site.id,
            domain: site.domain,
            platforms,
          });

          // 存储到历史表
          await db()
            .insert(siteMetricsDaily)
            .values({
              siteId: site.id,
              date: yesterday,
              revenue: metrics.revenue.today,
              visitors: metrics.traffic.today,
              uptimePercentage: metrics.uptime.status === 'up' ? 100 : 0,
              responseTime: metrics.uptime.responseTime,
            });

          return { siteId: site.id, success: true };
        } catch (error) {
          console.error(`Error storing metrics for site ${site.id}:`, error);
          return { siteId: site.id, success: false, error: String(error) };
        }
      })
    );

    // 6. 统计结果
    const successCount = snapshots.filter(s => s.success).length;
    const failCount = snapshots.filter(s => !s.success).length;

    return NextResponse.json({
      success: true,
      date: yesterday.toISOString(),
      totalSites: sitesToSnapshot.length,
      successCount,
      failCount,
      details: snapshots,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}







