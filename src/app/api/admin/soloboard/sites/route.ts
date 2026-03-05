/**
 * SoloBoard 管理员站点列表 API
 * GET /api/admin/soloboard/sites
 * 
 * 查询参数:
 * - search: 搜索关键词
 * - status: 筛选状态 (active/error)
 * - platform: 筛选平台
 * - page: 页码
 * - limit: 每页数量
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { db } from '@/core/db';
import { monitoredSites, users } from '@/config/db/schema';
import { eq, like, or, and, desc } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. 验证管理员权限
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db()
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user[0] || user[0].role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. 解析查询参数
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const platform = searchParams.get('platform') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 3. 构建查询条件
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(monitoredSites.name, `%${search}%`),
          like(monitoredSites.domain, `%${search}%`)
        )
      );
    }

    if (status) {
      conditions.push(eq(monitoredSites.lastSyncStatus, status));
    }

    if (platform) {
      conditions.push(eq(monitoredSites.platform, platform));
    }

    // 4. 查询站点列表
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sites = await db()
      .select({
        id: monitoredSites.id,
        name: monitoredSites.name,
        domain: monitoredSites.domain,
        url: monitoredSites.url,
        platform: monitoredSites.platform,
        status: monitoredSites.status,
        lastSyncAt: monitoredSites.lastSyncAt,
        lastSyncStatus: monitoredSites.lastSyncStatus,
        lastSyncError: monitoredSites.lastSyncError,
        createdAt: monitoredSites.createdAt,
        userId: monitoredSites.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(monitoredSites)
      .leftJoin(users, eq(monitoredSites.userId, users.id))
      .where(whereClause)
      .orderBy(desc(monitoredSites.createdAt))
      .limit(limit)
      .offset(offset);

    // 5. 获取总数
    const totalResult = await db()
      .select({ count: monitoredSites.id })
      .from(monitoredSites)
      .where(whereClause);
    const total = totalResult.length;

    return NextResponse.json({
      sites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch admin sites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sites' },
      { status: 500 }
    );
  }
}





