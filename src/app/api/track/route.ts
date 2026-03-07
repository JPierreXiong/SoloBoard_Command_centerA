/**
 * JS Tracking Script API
 * POST /api/track
 * 
 * 用于普通网站（非 Shopify/Stripe）的访客追踪
 * 
 * 功能:
 * 1. 记录页面访问
 * 2. 统计访客数量
 * 3. 追踪来源和路径
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { monitoredSites, siteMetricsDaily } from '@/config/db/schema';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TrackingData {
  site_id: string;
  url: string;
  referrer?: string;
  user_agent?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求数据
    const data: TrackingData = await request.json();
    
    if (!data.site_id) {
      return NextResponse.json(
        { error: 'Missing site_id' },
        { status: 400 }
      );
    }

    // 2. 验证 site_id
    const site = await db()
      .select()
      .from(monitoredSites)
      .where(eq(monitoredSites.trackingScriptId, data.site_id))
      .limit(1);

    if (!site || site.length === 0) {
      return NextResponse.json(
        { error: 'Invalid site_id' },
        { status: 404 }
      );
    }

    const siteData = site[0];

    // 3. 获取访客信息
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const userAgent = data.user_agent || request.headers.get('user-agent') || 'unknown';

    // 4. 记录访问（存储到日志表或缓存）
    // 这里简化处理，直接更新今日访客数
    const today = new Date().toISOString().split('T')[0];

    // 使用 UPSERT 更新或插入今日数据
    await db().execute(sql`
      INSERT INTO site_metrics_daily (id, site_id, date, visitors, revenue, uptime_percentage, response_time, created_at)
      VALUES (
        gen_random_uuid(),
        ${siteData.id},
        ${today}::timestamp,
        1,
        0,
        100,
        0,
        NOW()
      )
      ON CONFLICT (site_id, date) 
      DO UPDATE SET 
        visitors = site_metrics_daily.visitors + 1,
        updated_at = NOW()
    `);

    // 5. 返回成功响应（1x1 透明 GIF）
    return new NextResponse(
      Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
      {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('[Tracking API] Error:', error);
    
    // 即使出错也返回 1x1 GIF，避免影响用户网站
    return new NextResponse(
      Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
      {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// OPTIONS 请求处理（CORS）
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

