/**
 * Cron Job: 同步所有站点数据
 * POST /api/cron/sync-sites
 * 
 * 由 QStash 定时触发
 * 使用签名验证确保请求来自 QStash
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncAllSites } from '@/shared/services/soloboard/sync-service';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 分钟超时

async function handler(request: NextRequest) {
  try {
    console.log('🔄 Starting scheduled site sync (triggered by QStash)...');
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

// 使用 QStash 签名验证
export const POST = verifySignatureAppRouter(handler);

// 也支持 GET（用于手动测试）
export const GET = handler;
