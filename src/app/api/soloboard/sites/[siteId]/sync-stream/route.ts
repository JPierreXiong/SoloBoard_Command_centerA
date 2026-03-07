/**
 * POST /api/soloboard/sites/[siteId]/sync-stream
 * 流式同步站点数据 - 实时反馈每个步骤
 * 
 * 使用 Server-Sent Events (SSE) 返回实时进度
 */

import { NextRequest } from 'next/server';
import { db } from '@/core/db';
import { monitoredSites, siteMetricsDaily } from '@/config/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/core/auth';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SyncStep {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  data?: any;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  
  // 验证用户身份
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // 获取站点信息
  const [site] = await db().select()
    .from(monitoredSites)
    .where(eq(monitoredSites.id, siteId))
    .limit(1);
  
  if (!site) {
    return new Response('Site not found', { status: 404 });
  }
  
  if (site.userId !== session.user.id) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // 创建流式响应
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: SyncStep) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      
      try {
        // 初始化
        sendEvent({
          step: 'init',
          status: 'running',
          message: 'Starting sync...',
        });
        
        const syncResults = {
          revenue: 0,
          visitors: 0,
          responseTime: 0,
          uptimeStatus: 'offline' as 'online' | 'offline',
        };
        
        // Step 1: Stripe
        if (site.stripeKey) {
          sendEvent({
            step: 'stripe',
            status: 'running',
            message: 'Syncing Stripe data...',
          });
          
          const stripeResult = await syncStripeData(site.stripeKey);
          syncResults.revenue = stripeResult.revenue || 0;
          
          sendEvent({
            step: 'stripe',
            status: stripeResult.success ? 'success' : 'error',
            message: stripeResult.success 
              ? `Stripe sync completed. Revenue: $${(stripeResult.revenue! / 100).toFixed(2)}`
              : stripeResult.error || 'Stripe sync failed',
            data: { revenue: stripeResult.revenue },
          });
        } else {
          sendEvent({
            step: 'stripe',
            status: 'success',
            message: 'Stripe not configured, skipping...',
          });
        }
        
        // Step 2: GA4
        if (site.ga4PropertyId) {
          sendEvent({
            step: 'ga4',
            status: 'running',
            message: 'Syncing GA4 data...',
          });
          
          const ga4Result = await syncGA4Data(site.ga4PropertyId);
          syncResults.visitors = ga4Result.visitors || 0;
          
          sendEvent({
            step: 'ga4',
            status: ga4Result.success ? 'success' : 'error',
            message: ga4Result.success 
              ? `GA4 sync completed. Visitors: ${ga4Result.visitors}`
              : ga4Result.error || 'GA4 sync failed',
            data: { visitors: ga4Result.visitors },
          });
        } else {
          sendEvent({
            step: 'ga4',
            status: 'success',
            message: 'GA4 not configured, skipping...',
          });
        }
        
        // Step 3: Uptime Check
        sendEvent({
          step: 'uptime',
          status: 'running',
          message: 'Checking website status...',
        });
        
        const uptimeResult = await checkUptime(site.domain);
        syncResults.responseTime = uptimeResult.responseTime || 0;
        syncResults.uptimeStatus = uptimeResult.success ? 'online' : 'offline';
        
        sendEvent({
          step: 'uptime',
          status: uptimeResult.success ? 'success' : 'error',
          message: uptimeResult.success 
            ? `Website is online. Response time: ${uptimeResult.responseTime}ms`
            : uptimeResult.error || 'Website is offline',
          data: { 
            status: syncResults.uptimeStatus,
            responseTime: syncResults.responseTime 
          },
        });
        
        // Step 4: Update Database
        sendEvent({
          step: 'database',
          status: 'running',
          message: 'Updating database...',
        });
        
        try {
          const today = new Date().toISOString().split('T')[0];
          
          // 更新今日指标
          await db().execute(sql`
            INSERT INTO site_metrics_daily (
              id, site_id, date, revenue, visitors, response_time, created_at
            )
            VALUES (
              gen_random_uuid(),
              ${siteId},
              ${today}::date,
              ${syncResults.revenue},
              ${syncResults.visitors},
              ${syncResults.responseTime},
              NOW()
            )
            ON CONFLICT (site_id, date) 
            DO UPDATE SET 
              revenue = ${syncResults.revenue},
              visitors = ${syncResults.visitors},
              response_time = ${syncResults.responseTime},
              updated_at = NOW()
          `);
          
          // 更新站点状态
          await db().update(monitoredSites)
            .set({
              status: syncResults.uptimeStatus,
              lastSyncedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(monitoredSites.id, siteId));
          
          sendEvent({
            step: 'database',
            status: 'success',
            message: 'Database updated successfully',
          });
        } catch (error) {
          sendEvent({
            step: 'database',
            status: 'error',
            message: error instanceof Error ? error.message : 'Database update failed',
          });
        }
        
        // 完成
        sendEvent({
          step: 'complete',
          status: 'success',
          message: 'Sync completed successfully',
          data: syncResults,
        });
        
      } catch (error) {
        sendEvent({
          step: 'error',
          status: 'error',
          message: error instanceof Error ? error.message : 'Sync failed',
        });
      } finally {
        controller.close();
      }
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// 同步 Stripe 数据
async function syncStripeData(apiKey: string): Promise<{ success: boolean; revenue?: number; error?: string }> {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const timestamp = Math.floor(todayStart.getTime() / 1000);
    
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
    // TODO: 实现真实的 GA4 API 调用
    return { 
      success: true, 
      visitors: 0,
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
      signal: AbortSignal.timeout(10000),
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

