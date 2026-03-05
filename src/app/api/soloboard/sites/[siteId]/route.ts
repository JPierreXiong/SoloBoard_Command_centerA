/**
 * SoloBoard - API: 删除站点
 * 
 * DELETE /api/soloboard/sites/[siteId]
 * 
 * 删除指定的监控站点
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { monitoredSites } from '@/config/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/core/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 删除站点
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
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
    
    const { siteId } = params;
    
    // 2. 验证站点所有权并删除
    const result = await db()
      .delete(monitoredSites)
      .where(
        and(
          eq(monitoredSites.id, siteId),
          eq(monitoredSites.userId, session.user.id)
        )
      )
      .returning();
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Site not found or unauthorized' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Site deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete site:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}





