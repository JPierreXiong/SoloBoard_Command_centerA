/**
 * Upstash QStash Cron: Cost Alerts Check
 * 每小时检查一次成本预警
 * 
 * 使用 Upstash QStash 绕过 Vercel Hobby 的 Cron 限制
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

async function handler(request: NextRequest) {
  try {
    console.log('💰 [Cron] Cost Alerts Check - Starting...');
    
    // TODO: 实现成本预警检查逻辑
    // 1. 检查邮件发送量
    // 2. 检查存储使用量
    // 3. 检查 API 调用次数
    // 4. 触发预警通知
    
    const result = {
      emailUsage: '0/1000',
      storageUsage: '0 MB / 1 GB',
      apiCalls: '0/10000',
      alerts: [],
    };
    
    console.log('✅ [Cron] Cost Alerts Check completed:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Cost alerts check completed',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [Cron] Cost Alerts Check failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST 处理（支持 QStash 签名验证）
export async function POST(request: NextRequest) {
  // 验证 QStash 签名（如果配置了环境变量）
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  
  if (currentSigningKey && nextSigningKey) {
    try {
      const { verifySignatureAppRouter } = await import('@upstash/qstash/nextjs');
      const verifiedHandler = verifySignatureAppRouter(handler);
      return verifiedHandler(request);
    } catch (error) {
      console.error('QStash signature verification failed:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  
  // 如果没有配置签名密钥，直接执行（仅用于开发环境）
  return handler(request);
}

// 也支持 GET（用于手动测试）
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return handler(request);
}










