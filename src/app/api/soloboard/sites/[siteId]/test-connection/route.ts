/**
 * POST /api/soloboard/sites/[siteId]/test-connection
 * 测试 API 连接
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const { platform, apiKey } = await request.json();
    
    // 验证用户身份
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 根据平台测试连接
    let testResult = { success: false, message: '' };
    
    switch (platform) {
      case 'stripe':
        testResult = await testStripeConnection(apiKey);
        break;
      case 'ga4':
        testResult = await testGA4Connection(apiKey);
        break;
      case 'shopify':
        testResult = await testShopifyConnection(apiKey);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid platform' },
          { status: 400 }
        );
    }
    
    return NextResponse.json(testResult);
  } catch (error) {
    console.error('Connection test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection test failed' 
      },
      { status: 500 }
    );
  }
}

// 测试 Stripe 连接
async function testStripeConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!apiKey || !apiKey.startsWith('sk_')) {
      return { success: false, message: 'Invalid Stripe API key format' };
    }
    
    // 调用 Stripe API 验证
    const response = await fetch('https://api.stripe.com/v1/balance', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    if (response.ok) {
      return { success: true, message: 'Stripe connection successful' };
    } else {
      const error = await response.json();
      return { 
        success: false, 
        message: error.error?.message || 'Stripe connection failed' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'Failed to connect to Stripe' 
    };
  }
}

// 测试 GA4 连接
async function testGA4Connection(propertyId: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!propertyId || !propertyId.startsWith('G-')) {
      return { success: false, message: 'Invalid GA4 Property ID format' };
    }
    
    // 简单验证格式
    // 实际的 GA4 验证需要 Service Account credentials
    // 这里只做基本格式检查
    if (propertyId.length < 10) {
      return { success: false, message: 'GA4 Property ID too short' };
    }
    
    return { 
      success: true, 
      message: 'GA4 Property ID format is valid. Full validation will occur during sync.' 
    };
  } catch (error) {
    return { 
      success: false, 
      message: 'Failed to validate GA4 Property ID' 
    };
  }
}

// 测试 Shopify 连接
async function testShopifyConnection(accessToken: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!accessToken || !accessToken.startsWith('shpat_')) {
      return { success: false, message: 'Invalid Shopify access token format' };
    }
    
    // Shopify 连接测试需要 shop domain
    // 这里只做基本格式检查
    return { 
      success: true, 
      message: 'Shopify access token format is valid. Full validation will occur during sync.' 
    };
  } catch (error) {
    return { 
      success: false, 
      message: 'Failed to validate Shopify access token' 
    };
  }
}


