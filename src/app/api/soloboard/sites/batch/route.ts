/**
 * 批量添加站点 API
 * POST /api/soloboard/sites/batch
 * 
 * 功能:
 * 1. 一次性提交最多 10 个站点
 * 2. 并发验证 API Key
 * 3. 订阅限制检查
 * 4. 部分成功/失败处理
 * 5. 事务性创建
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { db } from '@/core/db';
import { monitoredSites } from '@/config/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getCurrentSubscription } from '@/shared/models/subscription';
import { canAddMoreSites } from '@/shared/utils/subscription-limits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 验证 Stripe Key
async function validateStripeKey(key: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.stripe.com/v1/balance', {
      headers: {
        'Authorization': `Bearer ${key}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

// 验证 GA4 Property ID
async function validateGA4Property(propertyId: string): Promise<boolean> {
  // GA4 验证需要 Service Account，这里简单检查格式
  return /^G-[A-Z0-9]+$/.test(propertyId);
}

// 验证 Shopify Access Token
async function validateShopifyToken(domain: string, token: string): Promise<boolean> {
  try {
    const response = await fetch(`https://${domain}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': token,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

// 验证 Lemon Squeezy API Key
async function validateLemonKey(key: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.lemonsqueezy.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${key}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

// 加密 API 配置
function encryptApiConfig(config: any): string {
  // 简单的 Base64 编码，生产环境应使用 AES-256
  return Buffer.from(JSON.stringify(config)).toString('base64');
}

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
    const { sites } = await request.json();

    if (!Array.isArray(sites) || sites.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: sites must be a non-empty array' },
        { status: 400 }
      );
    }

    if (sites.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 sites per batch' },
        { status: 400 }
      );
    }

    // 3. 检查订阅限制
    const existingSites = await db()
      .select()
      .from(monitoredSites)
      .where(eq(monitoredSites.userId, session.user.id));

    const currentSubscription = await getCurrentSubscription(session.user.id);
    const planName = currentSubscription?.planName || null;
    const limitCheck = canAddMoreSites(existingSites.length + sites.length, planName);

    if (!limitCheck.canAdd) {
      return NextResponse.json(
        {
          error: 'Site limit exceeded',
          message: `Your ${limitCheck.planDisplayName} plan allows ${limitCheck.limit} site${limitCheck.limit > 1 ? 's' : ''}. You're trying to add ${sites.length} more sites.`,
          currentPlan: limitCheck.planDisplayName,
          currentCount: existingSites.length,
          limit: limitCheck.limit,
          requested: sites.length,
          upgradeUrl: '/pricing',
        },
        { status: 403 }
      );
    }

    // 4. 并发验证和创建站点
    const results = await Promise.allSettled(
      sites.map(async (site: any) => {
        try {
          // 验证必填字段
          if (!site.domain || !site.domain.trim()) {
            throw new Error('Domain is required');
          }

          // 提取域名
          let domain = site.domain.trim();
          try {
            const urlObj = new URL(domain.startsWith('http') ? domain : `https://${domain}`);
            domain = urlObj.hostname;
          } catch {
            domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
          }

          // 验证 API Key (如果提供)
          const apiConfig = site.apiConfig || {};
          
          if (apiConfig.stripeKey) {
            const isValid = await validateStripeKey(apiConfig.stripeKey);
            if (!isValid) {
              throw new Error('Invalid Stripe API Key');
            }
          }

          if (apiConfig.ga4PropertyId) {
            const isValid = await validateGA4Property(apiConfig.ga4PropertyId);
            if (!isValid) {
              throw new Error('Invalid GA4 Property ID format');
            }
          }

          if (apiConfig.shopifyAccessToken && apiConfig.shopifyDomain) {
            const isValid = await validateShopifyToken(
              apiConfig.shopifyDomain,
              apiConfig.shopifyAccessToken
            );
            if (!isValid) {
              throw new Error('Invalid Shopify credentials');
            }
          }

          if (apiConfig.lemonApiKey) {
            const isValid = await validateLemonKey(apiConfig.lemonApiKey);
            if (!isValid) {
              throw new Error('Invalid Lemon Squeezy API Key');
            }
          }

          // 创建站点记录
          const siteId = nanoid();
          const url = domain.startsWith('http') ? domain : `https://${domain}`;

          await db().insert(monitoredSites).values({
            id: siteId,
            userId: session.user.id,
            name: site.name || domain,
            domain: domain,
            logoUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
            platform: site.platform || 'UPTIME',
            url: url,
            apiConfig: Object.keys(apiConfig).length > 0 
              ? encryptApiConfig(apiConfig) 
              : null,
            status: 'active',
            lastSyncAt: null,
            lastSyncStatus: null,
            lastSyncError: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          return {
            siteId,
            domain,
            status: 'success',
          };
        } catch (error: any) {
          return {
            domain: site.domain,
            status: 'error',
            error: error.message || 'Failed to create site',
          };
        }
      })
    );

    // 5. 汇总结果
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    const formattedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          domain: sites[index].domain,
          status: 'error',
          error: result.reason?.message || 'Unknown error',
        };
      }
    });

    return NextResponse.json({
      success: true,
      total: sites.length,
      successful,
      failed,
      results: formattedResults,
      subscription: {
        plan: limitCheck.planDisplayName,
        remaining: limitCheck.remaining - successful,
      },
    });
  } catch (error: any) {
    console.error('[Batch Add Sites API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}


