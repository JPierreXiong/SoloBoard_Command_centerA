/**
 * API: Get Site Metrics
 * 聚合所有平台的数据，返回统一格式
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/core/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const { user } = await getAuth();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Fetch site from database
    // const site = await db.query.monitoredSites.findFirst({
    //   where: (sites, { eq, and }) => and(
    //     eq(sites.id, siteId),
    //     eq(sites.userId, user.id)
    //   ),
    // });

    // Mock data for now
    const mockData = {
      siteId,
      name: 'Example Shop',
      domain: 'example-shop.com',
      status: 'online',
      metrics: {
        revenue: {
          today: 156,
          yesterday: 234,
          last7days: 1567,
          sources: {
            stripe: 100,
            shopify: 56,
          },
        },
        visitors: {
          today: 1203,
          yesterday: 1456,
          last7days: 8945,
          sources: {
            ga4: 1203,
          },
        },
        uptime: {
          status: 'up',
          responseTime: 120,
          uptimePercentage: 99.9,
        },
      },
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error fetching site metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site metrics' },
      { status: 500 }
    );
  }
}







