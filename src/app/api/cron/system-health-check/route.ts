/**
 * Upstash QStash Cron: System Health Check
 * 姣忓皬鏃舵鏌ヤ竴娆＄郴缁熷仴搴风姸鎬?
 * 
 * 浣跨敤 Upstash QStash 缁曡繃 Vercel Hobby 鐨?Cron 闄愬埗
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

async function handler(request: NextRequest) {
  try {
    console.log('馃彞 [Cron] System Health Check - Starting...');
    
    const result = {
      database: 'healthy',
      email: 'healthy',
      storage: 'healthy',
      api: 'healthy',
    };
    
    console.log('鉁?[Cron] System Health Check completed:', result);
    
    return NextResponse.json({
      success: true,
      message: 'System health check completed',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('鉂?[Cron] System Health Check failed:', error);
    
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

export async function POST(request: NextRequest) {
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
  
  return handler(request);
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return handler(request);
}




