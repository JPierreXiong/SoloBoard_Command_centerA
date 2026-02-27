/**
 * 添加项目 API - 带权限检查
 * 
 * 权限要求：
 * - Free: 最多 1 个项目
 * - Base: 最多 5 个项目
 * - Pro: 最多 10 个项目
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { db } from '@/core/db';
import { requirePlan, unauthorizedResponse, planLimitResponse } from '@/lib/permissions';
import { getUserPlanFeatures, canAddProject } from '@/config/plans';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    // 1. 验证用户登录
    const authCheck = await requirePlan(req, 'free');
    
    if (!authCheck.authorized) {
      return unauthorizedResponse(authCheck.error);
    }
    
    const { userId, planType } = authCheck;
    
    // 2. 获取请求数据
    const body = await req.json();
    const { name, description } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }
    
    // 3. 检查项目数量限制
    // TODO: 查询当前用户的项目数量
    const currentProjects = 0; // 从数据库查询
    
    if (!canAddProject(planType!, currentProjects)) {
      const plan = getUserPlanFeatures(planType!);
      return NextResponse.json(
        {
          error: 'Project limit reached',
          message: `Your ${planType} plan allows up to ${plan.maxProjects} projects`,
          currentProjects,
          maxProjects: plan.maxProjects,
          upgradeUrl: '/pricing',
        },
        { status: 403 }
      );
    }
    
    // 4. 创建项目
    const projectId = nanoid();
    
    // TODO: 保存到数据库
    // await db().insert(projects).values({
    //   id: projectId,
    //   userId,
    //   name,
    //   description,
    //   createdAt: new Date(),
    // });
    
    return NextResponse.json({
      success: true,
      project: {
        id: projectId,
        name,
        description,
      },
    });
    
  } catch (error: any) {
    console.error('Add project error:', error);
    return NextResponse.json(
      { error: 'Failed to add project', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 获取用户的所有项目
 */
export async function GET(req: NextRequest) {
  try {
    const authCheck = await requirePlan(req, 'free');
    
    if (!authCheck.authorized) {
      return unauthorizedResponse(authCheck.error);
    }
    
    const { userId, planType } = authCheck;
    const plan = getUserPlanFeatures(planType!);
    
    // TODO: 从数据库查询项目
    const projects: any[] = [];
    
    return NextResponse.json({
      projects,
      plan: {
        type: planType,
        maxProjects: plan.maxProjects,
        currentProjects: projects.length,
        canAddMore: canAddProject(planType!, projects.length),
      },
    });
    
  } catch (error: any) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: 'Failed to get projects', message: error.message },
      { status: 500 }
    );
  }
}










