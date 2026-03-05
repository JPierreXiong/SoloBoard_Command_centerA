/**
 * SoloBoard - Dashboard API
 * 
 * GET /api/soloboard/dashboard
 * 
 * 返回用户仪表板数据：
 * - 所有站点及其最新指标
 * - 汇总统计数据
 * - 异常状态优先排序
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { monitoredSites, siteMetricsDaily } from '@/config/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { auth } from '@/core/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Site {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string;
  status: 'online' | 'offline' | 'warning';
  todayRevenue: number;
  todayVisitors: number;
  avgRevenue7d: number;
  platforms: string[];
}

interface Summary {
  totalSites: number;
  totalRevenue: number;
  totalVisitors: number;
  sitesOnline: number;
}

export async function GET(request: NextRequest) {
  try {
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
    
    // 2. 查询用户的所有站点
    const sites = await db().select().from(monitoredSites)
      .where(eq(monitoredSites.userId, session.user.id))
      .orderBy(desc(monitoredSites.createdAt));
    
    // 3. 获取今天的日期（UTC）
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    // 4. 获取 7 天前的日期
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // 5. 为每个站点获取指标数据
    const sitesWithMetrics: Site[] = await Promise.all(
      sites.map(async (site) => {
        // 获取今天的指标
        const todayMetrics = await db().select()
          .from(siteMetricsDaily)
          .where(
            and(
              eq(siteMetricsDaily.siteId, site.id),
              gte(siteMetricsDaily.date, today)
            )
          )
          .orderBy(desc(siteMetricsDaily.date))
          .limit(1);
        
        // 获取最近 7 天的指标（用于计算平均值）
        const last7DaysMetrics = await db().select()
          .from(siteMetricsDaily)
          .where(
            and(
              eq(siteMetricsDaily.siteId, site.id),
              gte(siteMetricsDaily.date, sevenDaysAgo)
            )
          );
        
        // 计算今天的数据
        const todayRevenue = todayMetrics[0]?.revenue || 0;
        const todayVisitors = todayMetrics[0]?.visitors || 0;
        const todayUptime = todayMetrics[0]?.uptimePercentage || 100;
        
        // 计算 7 天平均收入
        const avgRevenue7d = last7DaysMetrics.length > 0
          ? Math.round(
              last7DaysMetrics.reduce((sum, m) => sum + (m.revenue || 0), 0) / 
              last7DaysMetrics.length
            )
          : 0;
        
        // 判断站点状态
        let status: 'online' | 'offline' | 'warning' = 'online';
        
        // 离线：在线率 < 95% 或最后同步失败
        if (todayUptime < 95 || site.lastSyncStatus === 'error') {
          status = 'offline';
        }
        // 警告：今天有收入但今天没有销售，或访客数异常低
        else if (avgRevenue7d > 0 && todayRevenue === 0) {
          status = 'warning';
        }
        else if (todayVisitors < 10 && last7DaysMetrics.length > 0) {
          const avgVisitors7d = last7DaysMetrics.reduce((sum, m) => sum + (m.visitors || 0), 0) / last7DaysMetrics.length;
          if (avgVisitors7d > 50) {
            status = 'warning';
          }
        }
        
        return {
          id: site.id,
          name: site.name,
          domain: site.domain,
          logoUrl: site.logoUrl || undefined,
          status,
          todayRevenue: todayRevenue / 100, // 转换为美元
          todayVisitors,
          avgRevenue7d: avgRevenue7d / 100, // 转换为美元
          platforms: [site.platform],
        };
      })
    );
    
    // 6. 计算汇总数据
    const summary: Summary = {
      totalSites: sitesWithMetrics.length,
      totalRevenue: sitesWithMetrics.reduce((sum, site) => sum + site.todayRevenue, 0),
      totalVisitors: sitesWithMetrics.reduce((sum, site) => sum + site.todayVisitors, 0),
      sitesOnline: sitesWithMetrics.filter(site => site.status === 'online').length,
    };
    
    return NextResponse.json({
      success: true,
      sites: sitesWithMetrics,
      summary,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        sites: [],
        summary: {
          totalSites: 0,
          totalRevenue: 0,
          totalVisitors: 0,
          sitesOnline: 0,
        },
      },
      { status: 500 }
    );
  }
}
