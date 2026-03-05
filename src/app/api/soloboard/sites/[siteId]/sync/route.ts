/**
 * API: 手动触发站点同步
 * POST /api/soloboard/sites/[siteId]/sync
 * 
 * 允许用户手动刷新站点数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { db } from '@/core/db';
import { monitoredSites } from '@/config/db/schema';
import { eq } from 'drizzle-orm';
import { syncSiteData } from '@/shared/services/soloboard/sync-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    // 1. 验证用户身份
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 验证站点所有权
    const site = await db()
      .select()
      .from(monitoredSites)
      .where(eq(monitoredSites.id, params.siteId))
      .limit(1);

    if (!site[0]) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    if (site[0].userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. 执行同步
    console.log(`🔄 Manual sync triggered for site ${params.siteId}`);
    const result = await syncSiteData(params.siteId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      metrics: result.metrics,
      syncedAt: result.syncedAt,
    });
  } catch (error: any) {
    console.error('Failed to sync site:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}





