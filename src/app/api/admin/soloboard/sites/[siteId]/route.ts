/**
 * SoloBoard 管理员站点操作 API
 * GET /api/admin/soloboard/sites/[siteId] - 获取站点详情
 * DELETE /api/admin/soloboard/sites/[siteId] - 删除站点
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { db } from '@/core/db';
import { monitoredSites, users } from '@/config/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    // 验证管理员权限
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

    // 获取站点详情
    const site = await db()
      .select()
      .from(monitoredSites)
      .where(eq(monitoredSites.id, params.siteId))
      .limit(1);

    if (!site[0]) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    return NextResponse.json({ site: site[0] });
  } catch (error) {
    console.error('Failed to fetch site:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    // 验证管理员权限
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

    // 删除站点
    await db()
      .delete(monitoredSites)
      .where(eq(monitoredSites.id, params.siteId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete site:', error);
    return NextResponse.json(
      { error: 'Failed to delete site' },
      { status: 500 }
    );
  }
}

