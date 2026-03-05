/**
 * SoloBoard - Site Details API
 * 
 * GET /api/soloboard/sites/[siteId]
 * DELETE /api/soloboard/sites/[siteId]
 * 
 * 获取或删除单个站点的详细信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { monitoredSites, siteMetricsDaily } from '@/config/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { auth } from '@/core/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 获取站点详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    
    // 1. 验证用户身份
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 2. 查询站点信息（验证所有权）
    const sites = await db().select().from(monitoredSites)
      .where(
        and(
          eq(monitoredSites.id, siteId),
          eq(monitoredSites.userId, session.user.id)
        )
      )
      .limit(1);
    
    if (sites.length === 0) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }
    
    const site = sites[0];
    
    // 3. 获取最近 30 天的指标数据
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const metrics = await db().select()
      .from(siteMetricsDaily)
      .where(
        and(
          eq(siteMetricsDaily.siteId, siteId),
          gte(siteMetricsDaily.date, thirtyDaysAgo)
        )
      )
      .orderBy(desc(siteMetricsDaily.date));
    
    // 4. 格式化数据
    const formattedMetrics = metrics.map(m => ({
      date: m.date,
      revenue: m.revenue ? m.revenue / 100 : 0, // 转换为美元
      visitors: m.visitors || 0,
      uptimePercentage: m.uptimePercentage || 100,
      responseTime: m.responseTime || 0,
    }));
    
    // 5. 计算统计数据
    const totalRevenue = formattedMetrics.reduce((sum, m) => sum + m.revenue, 0);
    const totalVisitors = formattedMetrics.reduce((sum, m) => sum + m.visitors, 0);
    const avgUptime = formattedMetrics.length > 0
      ? formattedMetrics.reduce((sum, m) => sum + m.uptimePercentage, 0) / formattedMetrics.length
      : 100;
    const avgResponseTime = formattedMetrics.length > 0
      ? formattedMetrics.reduce((sum, m) => sum + m.responseTime, 0) / formattedMetrics.length
      : 0;
    
    return NextResponse.json({
      success: true,
      site: {
        id: site.id,
        name: site.name,
        domain: site.domain,
        url: site.url,
        logoUrl: site.logoUrl,
        platform: site.platform,
        status: site.status,
        lastSyncAt: site.lastSyncAt,
        lastSyncStatus: site.lastSyncStatus,
        createdAt: site.createdAt,
      },
      metrics: formattedMetrics,
      stats: {
        totalRevenue,
        totalVisitors,
        avgUptime: Math.round(avgUptime * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
      },
    });
  } catch (error) {
    console.error('Failed to fetch site details:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 删除站点
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    
    // 1. 验证用户身份
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 2. 验证站点所有权
    const sites = await db().select().from(monitoredSites)
      .where(
        and(
          eq(monitoredSites.id, siteId),
          eq(monitoredSites.userId, session.user.id)
        )
      )
      .limit(1);
    
    if (sites.length === 0) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }
    
    // 3. 删除站点（级联删除指标数据）
    await db().delete(monitoredSites)
      .where(eq(monitoredSites.id, siteId));
    
    return NextResponse.json({
      success: true,
      message: 'Site deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete site:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
