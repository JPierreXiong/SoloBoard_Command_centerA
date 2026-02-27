/**
 * SoloBoard - API: 获取站点历史数据
 * 
 * GET /api/soloboard/sites/[siteId]/history?range=24h
 * 
 * 返回站点的历史指标数据，用于趋势图表
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { siteMetricsHistory, monitoredSites } from '@/config/db/schema';
import { eq, desc, gte } from 'drizzle-orm';
import { auth } from '@/core/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 获取站点历史数据
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
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
    
    const { siteId } = params;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '24h';
    
    // 2. 验证站点所有权
    const site = await db()
      .select()
      .from(monitoredSites)
      .where(eq(monitoredSites.id, siteId))
      .limit(1)
      .then((rows: any[]) => rows[0]);
    
    if (!site || site.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }
    
    // 3. 计算时间范围
    const now = new Date();
    let startTime = new Date();
    
    switch (range) {
      case '24h':
        startTime.setHours(now.getHours() - 24);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(now.getDate() - 30);
        break;
      default:
        startTime.setHours(now.getHours() - 24);
    }
    
    // 4. 查询历史数据
    const history = await db()
      .select()
      .from(siteMetricsHistory)
      .where(gte(siteMetricsHistory.recordedAt, startTime))
      .orderBy(desc(siteMetricsHistory.recordedAt))
      .limit(100);
    
    return NextResponse.json({
      success: true,
      data: history,
      range,
    });
  } catch (error) {
    console.error('Failed to fetch site history:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}



