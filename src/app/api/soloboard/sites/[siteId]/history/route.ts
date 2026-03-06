import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { eq, desc, gte, sql } from 'drizzle-orm';
import { getUserInfo } from '@/shared/models/user';

// 定义表结构（临时）
const monitoredSites = {
  id: sql`id`,
  userId: sql`user_id`,
  name: sql`name`,
  domain: sql`domain`,
  url: sql`url`,
  status: sql`status`,
};

const siteMetricsDaily = {
  id: sql`id`,
  siteId: sql`site_id`,
  date: sql`date`,
  revenue: sql`revenue`,
  visitors: sql`visitors`,
  orders: sql`orders`,
  conversionRate: sql`conversion_rate`,
  avgOrderValue: sql`avg_order_value`,
};

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
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    // 验证站点所有权
    const site = await db().execute(
      sql`SELECT * FROM monitored_sites WHERE id = ${siteId} AND user_id = ${user.id} LIMIT 1`
    );

    if (!site || site.length === 0) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // 计算日期范围
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // 获取历史数据
    const history = await db().execute(
      sql`
        SELECT 
          date,
          revenue,
          visitors,
          orders,
          conversion_rate as "conversionRate",
          avg_order_value as "avgOrderValue"
        FROM site_metrics_daily
        WHERE site_id = ${siteId}
          AND date >= ${startDateStr}
        ORDER BY date DESC
        LIMIT ${days}
      `
    );

    // 格式化数据
    const formattedHistory = history.map((row: any) => ({
      date: row.date,
      revenue: parseFloat(row.revenue || 0),
      visitors: parseInt(row.visitors || 0),
      orders: parseInt(row.orders || 0),
      conversionRate: parseFloat(row.conversionRate || 0),
      avgOrderValue: parseFloat(row.avgOrderValue || 0),
    }));

    return NextResponse.json({
      success: true,
      history: formattedHistory,
      site: {
        id: site[0].id,
        name: site[0].name,
        domain: site[0].domain,
      },
    });
  } catch (error: any) {
    console.error('[Site History API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
