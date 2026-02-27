/**
 * 管理员用户管理 API
 * 查看和管理所有用户
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { db } from '@/core/db';
import { user, order, subscription } from '@/config/db/schema';
import { isAdmin } from '@/config/admin';
import { eq, like, or, sql } from 'drizzle-orm';

/**
 * 获取用户列表
 */
export async function GET(req: NextRequest) {
  try {
    // 验证管理员
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const planFilter = searchParams.get('plan') || '';
    
    const offset = (page - 1) * limit;
    const database = db();
    
    // 构建查询条件
    let whereConditions: any[] = [];
    
    if (search) {
      whereConditions.push(
        or(
          like(user.email, `%${search}%`),
          like(user.name, `%${search}%`)
        )
      );
    }
    
    if (planFilter) {
      whereConditions.push(eq(user.planType, planFilter));
    }
    
    // 查询用户
    const users = await database
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        planType: user.planType,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(whereConditions.length > 0 ? sql`${whereConditions.join(' AND ')}` : undefined)
      .orderBy(sql`${user.createdAt} DESC`)
      .limit(limit)
      .offset(offset);
    
    // 获取总数
    const totalCount = await database
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(whereConditions.length > 0 ? sql`${whereConditions.join(' AND ')}` : undefined);
    
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: Number(totalCount[0]?.count || 0),
        totalPages: Math.ceil(Number(totalCount[0]?.count || 0) / limit),
      },
    });

  } catch (error: any) {
    console.error('Admin users list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 更新用户计划（管理员操作）
 */
export async function PATCH(req: NextRequest) {
  try {
    // 验证管理员
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, planType, reason } = body;
    
    if (!userId || !planType) {
      return NextResponse.json(
        { error: 'userId and planType are required' },
        { status: 400 }
      );
    }
    
    if (!['free', 'base', 'pro'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }
    
    const database = db();
    
    // 更新用户计划
    await database
      .update(user)
      .set({
        planType,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
    
    // 记录管理员操作日志
    console.log('Admin action:', {
      admin: session.user.email,
      action: 'update_user_plan',
      userId,
      newPlan: planType,
      reason,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json({
      success: true,
      message: 'User plan updated successfully',
    });

  } catch (error: any) {
    console.error('Admin update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user', message: error.message },
      { status: 500 }
    );
  }
}










