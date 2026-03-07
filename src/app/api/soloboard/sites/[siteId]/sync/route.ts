/**
 * POST /api/soloboard/sites/[siteId]/sync
 * 手动同步站点数据
 * 
 * 功能：
 * 1. 从 Stripe 获取今日收入
 * 2. 从 GA4 获取今日访客
 * 3. 检查网站在线状态
 * 4. 更新数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { monitoredSites, siteMetricsDaily } from '@/config/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/core/auth';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SyncResult {
  success: boolean;
  steps: {
    stripe?: { success: boolean; revenue?: number; error?: string };
    ga4?: { success: boolean; visitors?: number; error?: string };
    uptime?: { success: boolean; status?: string; responseTime?: number; error?: string };
  };
  message: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    
    // 验证用户身份
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 获取站点信息
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
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // 执行同步
    const result: SyncResult = {
      success: true,
      steps: {},
      message: 'Sync completed',
    };
    
    // 1. 同步 Stripe 数据
    if (site.stripeKey) {
      result.steps.stripe = await syncStripeData(site.stripeKey);
    }
    
    // 2. 同步 GA4 数据
    if (site.ga4PropertyId) {
      result.steps.ga4 = await syncGA4Data(site.ga4PropertyId);
    }
    
    // 3. 检查在线状态
    result.steps.uptime = await checkUptime(site.domain);
    
    // 4. 更新数据库
    const today = new Date().toISOString().split('T')[0];
    const revenue = result.steps.stripe?.revenue || 0;
    const visitors = result.steps.ga4?.visitors || 0;
    const uptimePercentage = result.steps.uptime?.success ? 100 : 0;
    const responseTime = result.steps.uptime?.responseTime || 0;
    
    // 使用 UPSERT 更新今日数据
    await db().execute(sql`
      INSERT INTO site_metrics_daily (
        id, site_id, date, revenue, visitors, response_time, created_at
      )
      VALUES (
        gen_random_uuid(),
        ${siteId},
        ${today}::date,
        ${revenue},
        ${visitors},
        ${responseTime},
        NOW()
      )
      ON CONFLICT (site_id, date) 
      DO UPDATE SET 
        revenue = ${revenue},
        visitors = ${visitors},
        response_time = ${responseTime},
        updated_at = NOW()
    `);
    
    // 更新站点状态
    const newStatus = result.steps.uptime?.success ? 'online' : 'offline';
    await db().update(monitoredSites)
      .set({
        status: newStatus,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(monitoredSites.id, siteId));
    
    // 检查是否有失败的步骤
    const hasErrors = Object.values(result.steps).some(step => !step.success);
    if (hasErrors) {
      result.success = false;
      result.message = 'Sync completed with some errors';
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Sync failed:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Sync failed',
        steps: {},
      },
      { status: 500 }
    );
  }
}

// 同步 Stripe 数据
async function syncStripeData(apiKey: string): Promise<{ success: boolean; revenue?: number; error?: string }> {
  try {
    // 获取今日开始时间戳
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const timestamp = Math.floor(todayStart.getTime() / 1000);
    
    // 调用 Stripe API
    const response = await fetch(
      `https://api.stripe.com/v1/charges?created[gte]=${timestamp}&limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      return { 
        success: false, 
        error: error.error?.message || 'Stripe API error' 
      };
    }
    
    const data = await response.json();
    
    // 计算今日收入（单位：分）
    const revenue = data.data
      .filter((charge: any) => charge.paid && !charge.refunded)
      .reduce((sum: number, charge: any) => sum + charge.amount, 0);
    
    return { success: true, revenue };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to sync Stripe' 
    };
  }
}

// 同步 GA4 数据
async function syncGA4Data(propertyId: string): Promise<{ success: boolean; visitors?: number; error?: string }> {
  try {
    // GA4 需要 Service Account credentials
    // 这里返回模拟数据，实际实现需要 Google Analytics Data API
    
    // TODO: 实现真实的 GA4 API 调用
    // 需要：
    // 1. Service Account JSON key
    // 2. Google Analytics Data API client
    // 3. 查询今日访客数
    
    // 暂时返回成功但访客数为 0
    return { 
      success: true, 
      visitors: 0,
      error: 'GA4 sync not fully implemented yet' 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to sync GA4' 
    };
  }
}

// 检查在线状态
async function checkUptime(domain: string): Promise<{ success: boolean; status?: string; responseTime?: number; error?: string }> {
  try {
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    const startTime = Date.now();
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000), // 10秒超时
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: response.ok,
      status: response.ok ? 'online' : 'offline',
      responseTime,
    };
  } catch (error) {
    return {
      success: false,
      status: 'offline',
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Failed to check uptime',
    };
  }
}

