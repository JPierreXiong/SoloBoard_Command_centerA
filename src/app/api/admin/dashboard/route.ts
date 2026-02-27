/**
 * 管理员仪表板 API
 * 显示系统概览和统计数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { user, order, subscription } from '@/config/db/schema';
import { eq, gte, sql, and } from 'drizzle-orm';
import { PERMISSIONS } from '@/core/rbac';
import { getSignUser } from '@/shared/models/user';
import { hasPermission } from '@/shared/services/rbac';

export async function GET(req: NextRequest) {
  try {
    // 1. 验证管理员身份
    const signUser = await getSignUser();
    
    if (!signUser) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const isAdmin = await hasPermission(signUser.id, PERMISSIONS.ADMIN_ACCESS);
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // 2. 获取统计数据
    const database = db();
    
    // 用户统计
    const totalUsers = await database
      .select({ count: sql<number>`count(*)` })
      .from(user);
    
    const usersByPlan = await database
      .select({
        planType: user.planType,
        count: sql<number>`count(*)`,
      })
      .from(user)
      .groupBy(user.planType);
    
    // 最近30天新用户
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers = await database
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(gte(user.createdAt, thirtyDaysAgo));
    
    // 订单统计
    const totalOrders = await database
      .select({ count: sql<number>`count(*)` })
      .from(order);
    
    const paidOrders = await database
      .select({ count: sql<number>`count(*)` })
      .from(order)
      .where(eq(order.status, 'paid'));
    
    // 收入统计
    const totalRevenue = await database
      .select({
        total: sql<number>`sum(${order.paymentAmount})`,
        currency: order.paymentCurrency,
      })
      .from(order)
      .where(eq(order.status, 'paid'))
      .groupBy(order.paymentCurrency);
    
    // 本月收入
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    const monthlyRevenue = await database
      .select({
        total: sql<number>`sum(${order.paymentAmount})`,
        currency: order.paymentCurrency,
      })
      .from(order)
      .where(
        and(
          eq(order.status, 'paid'),
          gte(order.paidAt, firstDayOfMonth)
        )
      )
      .groupBy(order.paymentCurrency);
    
    // 订阅统计
    const activeSubscriptions = await database
      .select({ count: sql<number>`count(*)` })
      .from(subscription)
      .where(eq(subscription.status, 'active'));
    
    const subscriptionsByPlan = await database
      .select({
        planType: subscription.planType,
        count: sql<number>`count(*)`,
      })
      .from(subscription)
      .where(eq(subscription.status, 'active'))
      .groupBy(subscription.planType);
    
    // 最近订单
    const recentOrders = await database
      .select({
        id: order.id,
        orderNo: order.orderNo,
        userEmail: order.userEmail,
        amount: order.paymentAmount,
        currency: order.paymentCurrency,
        status: order.status,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
      })
      .from(order)
      .orderBy(sql`${order.createdAt} DESC`)
      .limit(10);
    
    // 最近用户
    const recentUsers = await database
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        planType: user.planType,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(sql`${user.createdAt} DESC`)
      .limit(10);
    
    // 3. 返回统计数据
    return NextResponse.json({
      overview: {
        totalUsers: totalUsers[0]?.count || 0,
        newUsersLast30Days: newUsers[0]?.count || 0,
        totalOrders: totalOrders[0]?.count || 0,
        paidOrders: paidOrders[0]?.count || 0,
        activeSubscriptions: activeSubscriptions[0]?.count || 0,
      },
      
      usersByPlan: usersByPlan.map((item: any) => ({
        plan: item.planType || 'free',
        count: Number(item.count),
      })),
      
      subscriptionsByPlan: subscriptionsByPlan.map((item: any) => ({
        plan: item.planType || 'free',
        count: Number(item.count),
      })),
      
      revenue: {
        total: totalRevenue.map((item: any) => ({
          amount: Number(item.total) / 100, // 转换为主货币单位
          currency: item.currency || 'USD',
        })),
        monthly: monthlyRevenue.map((item: any) => ({
          amount: Number(item.total) / 100,
          currency: item.currency || 'USD',
        })),
      },
      
      recentOrders: recentOrders.map((item: any) => ({
        ...item,
        amount: item.amount ? Number(item.amount) / 100 : 0,
      })),
      
      recentUsers,
      
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', message: error.message },
      { status: 500 }
    );
  }
}

