/**
 * SoloBoard - API: 获取用户的所有监控站点
 * 
 * GET /api/soloboard/sites
 * POST /api/soloboard/sites - 添加新站点（带订阅限制检查）
 * 
 * 返回用户的所有站点及其最新快照数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { monitoredSites } from '@/config/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/core/auth';
import { nanoid } from 'nanoid';
import { getCurrentSubscription } from '@/shared/models/subscription';
import { canAddMoreSites } from '@/shared/utils/subscription-limits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 获取用户的所有监控站点
 */
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
    
    // 3. 获取订阅限制信息
    const currentSubscription = await getCurrentSubscription(session.user.id);
    const planName = currentSubscription?.planName || null;
    const limitCheck = canAddMoreSites(sites.length, planName);
    
    // 4. 格式化数据（移除敏感信息）
    const sanitizedSites = sites.map((site: any) => ({
      id: site.id,
      name: site.name,
      url: site.url || `https://${site.domain}`,
      domain: site.domain,
      logoUrl: site.logoUrl,
      platform: site.platform || 'UPTIME',
      status: site.status || 'active',
      healthStatus: site.lastSyncStatus === 'success' ? 'online' : 
                    site.lastSyncStatus === 'error' ? 'offline' : 'unknown',
      lastSnapshot: null,
      lastSyncAt: site.lastSyncAt,
      displayOrder: 0,
      createdAt: site.createdAt,
      updatedAt: site.updatedAt,
    }));
    
    return NextResponse.json({
      success: true,
      sites: sanitizedSites,
      total: sanitizedSites.length,
      // 返回订阅限制信息
      subscription: {
        plan: limitCheck.planDisplayName,
        canAddMore: limitCheck.canAdd,
        limit: limitCheck.limit,
        remaining: limitCheck.remaining,
      },
    });
  } catch (error) {
    console.error('Failed to fetch sites:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        sites: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}

/**
 * 添加新的监控站点（P2: 带订阅限制检查）
 */
export async function POST(request: NextRequest) {
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
    
    // 2. 解析请求体
    const body = await request.json();
    const { name, url, domain, platform = 'UPTIME', apiConfig = {} } = body;
    
    // 3. 验证必填字段
    if (!name || !url) {
      return NextResponse.json(
        { error: 'Missing required fields: name, url' },
        { status: 400 }
      );
    }
    
    // 4. 提取域名
    let extractedDomain = domain;
    if (!extractedDomain) {
      try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        extractedDomain = urlObj.hostname;
      } catch (e) {
        extractedDomain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      }
    }
    
    // 5. 🎯 检查重复域名
    const existingSites = await db().select()
      .from(monitoredSites)
      .where(eq(monitoredSites.userId, session.user.id));
    
    // 检查域名是否已存在
    const duplicateSite = existingSites.find(
      site => site.domain === extractedDomain || site.url === url
    );
    
    if (duplicateSite) {
      return NextResponse.json(
        { 
          error: 'Duplicate site',
          message: `Website "${extractedDomain}" is already being monitored.`,
          existingSiteId: duplicateSite.id,
        },
        { status: 409 }
      );
    }
    
    // 6. 🎯 P2: 检查用户站点数量限制（订阅限制）
    // 获取用户当前订阅计划
    const currentSubscription = await getCurrentSubscription(session.user.id);
    const planName = currentSubscription?.planName || null;
    
    // 检查是否可以添加更多站点
    const limitCheck = canAddMoreSites(existingSites.length, planName);
    
    if (!limitCheck.canAdd) {
      return NextResponse.json(
        { 
          error: 'Site limit reached',
          message: `Your ${limitCheck.planDisplayName} plan allows ${limitCheck.limit} site${limitCheck.limit > 1 ? 's' : ''}. Upgrade to add more.`,
          currentPlan: limitCheck.planDisplayName,
          currentCount: existingSites.length,
          limit: limitCheck.limit,
          upgradeUrl: '/pricing',
        },
        { status: 403 }
      );
    }
    
    // 7. 创建新站点记录
    const siteId = nanoid();
    
    await db().insert(monitoredSites).values({
      id: siteId,
      userId: session.user.id,
      name: name,
      domain: extractedDomain,
      logoUrl: null,
      platform: platform.toUpperCase(),
      url: url.startsWith('http') ? url : `https://${url}`,
      apiConfig: apiConfig,
      status: 'active',
      lastSyncAt: null,
      lastSyncStatus: null,
      lastSyncError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // 8. 返回成功响应
    return NextResponse.json({
      success: true,
      site: {
        id: siteId,
        name: name,
        domain: extractedDomain,
        url: url,
        platform: platform,
        status: 'active',
      },
      subscription: {
        plan: limitCheck.planDisplayName,
        remaining: limitCheck.remaining - 1,
      },
    });
  } catch (error) {
    console.error('Failed to add site:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
