import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { sql } from 'drizzle-orm';
import { getUserInfo } from '@/shared/models/user';

export async function GET(
  req: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    // 获取当前用户
    const user = await getUserInfo();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siteId } = params;

    // 验证站点所有权并获取站点信息
    const site = await db().execute(
      sql`SELECT * FROM monitored_sites WHERE id = ${siteId} AND user_id = ${user.id} LIMIT 1`
    );

    if (!site || site.length === 0) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const siteData = site[0];

    // 获取今天的指标
    const today = new Date().toISOString().split('T')[0];
    const todayMetrics = await db().execute(
      sql`
        SELECT 
          revenue,
          visitors,
          orders,
          conversion_rate as "conversionRate",
          avg_order_value as "avgOrderValue"
        FROM site_metrics_daily
        WHERE site_id = ${siteId} AND date = ${today}
        LIMIT 1
      `
    );

    // 获取最近7天的平均值
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const avgMetrics = await db().execute(
      sql`
        SELECT 
          AVG(revenue) as "avgRevenue",
          AVG(visitors) as "avgVisitors",
          AVG(orders) as "avgOrders"
        FROM site_metrics_daily
        WHERE site_id = ${siteId} AND date >= ${sevenDaysAgoStr}
      `
    );

    const todayData = todayMetrics[0] || {
      revenue: 0,
      visitors: 0,
      orders: 0,
      conversionRate: 0,
      avgOrderValue: 0,
    };

    const avgData = avgMetrics[0] || {
      avgRevenue: 0,
      avgVisitors: 0,
      avgOrders: 0,
    };

    return NextResponse.json({
      success: true,
      site: {
        id: siteData.id,
        name: siteData.name,
        domain: siteData.domain,
        url: siteData.url,
        status: siteData.status,
        logoUrl: siteData.logo_url,
        platform: siteData.platform,
        lastSyncAt: siteData.last_sync_at,
        lastSyncStatus: siteData.last_sync_status,
      },
      metrics: {
        today: {
          revenue: parseFloat(todayData.revenue || 0),
          visitors: parseInt(todayData.visitors || 0),
          orders: parseInt(todayData.orders || 0),
          conversionRate: parseFloat(todayData.conversionRate || 0),
          avgOrderValue: parseFloat(todayData.avgOrderValue || 0),
        },
        avg7d: {
          revenue: parseFloat(avgData.avgRevenue || 0),
          visitors: parseInt(avgData.avgVisitors || 0),
          orders: parseInt(avgData.avgOrders || 0),
        },
      },
    });
  } catch (error: any) {
    console.error('[Site Metrics API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
