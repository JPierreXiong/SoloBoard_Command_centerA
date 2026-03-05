/**
 * Cron Job: 同步所有站点数据
 * GET /api/cron/sync-sites
 * 
 * 由 Vercel Cron 定时触发
 * 配置在 vercel.json 中
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncAllSites } from '@/shared/services/soloboard/sync-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 分钟超时

export async function GET(request: NextRequest) {
  try {
    // 验证 Cron Secret（可选，增强安全性）
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting scheduled site sync...');
    const startTime = Date.now();

    // 执行同步
    const results = await syncAllSites();

    const duration = Date.now() - startTime;
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(`✅ Sync complete in ${duration}ms: ${successCount} success, ${failCount} failed`);

    return NextResponse.json({
      success: true,
      duration,
      stats: {
        total: results.length,
        success: successCount,
        failed: failCount,
      },
      results: results.map((r) => ({
        siteId: r.siteId,
        success: r.success,
        error: r.error,
      })),
    });
  } catch (error: any) {
    console.error('❌ Cron sync failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
