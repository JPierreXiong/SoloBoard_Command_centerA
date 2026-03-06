/**
 * DELETE /api/soloboard/sites/[siteId]
 * 删除监控站点
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { monitoredSites, siteMetricsHistory, syncLogs } from '@/config/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/core/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    const [site] = await db().select()
      .from(monitoredSites)
      .where(eq(monitoredSites.id, siteId))
      .limit(1);
    
    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }
    
    if (site.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this site' },
        { status: 403 }
      );
    }
    
    // 3. 删除相关数据（级联删除）
    // 删除历史数据
    await db().delete(siteMetricsHistory)
      .where(eq(siteMetricsHistory.siteId, siteId));
    
    // 删除同步日志
    await db().delete(syncLogs)
      .where(eq(syncLogs.siteId, siteId));
    
    // 删除站点记录
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
