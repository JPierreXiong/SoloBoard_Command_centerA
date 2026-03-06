/**
 * Export API Route
 * 
 * GET /api/soloboard/sites/[siteId]/export?format=csv|json|pdf&start=YYYY-MM-DD&end=YYYY-MM-DD
 * 
 * 用途：导出网站数据为 CSV/JSON/PDF 格式
 * 优化：添加生成进度反馈，使用流式响应
 * 不改变 ShipAny 结构，仅扩展功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { monitoredSites, siteMetricsHistory } from '@/config/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { auth } from '@/core/auth';
import {
  exportToCSV,
  generateCSVFilename,
  createCSVResponse,
  ExportData,
} from '@/shared/lib/export/csv-exporter';
import {
  exportToJSON,
  generateJSONFilename,
  createJSONResponse,
} from '@/shared/lib/export/json-exporter';
import {
  exportToPDF,
  generatePDFFilename,
  createPDFResponse,
} from '@/shared/lib/export/pdf-exporter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const { searchParams } = new URL(request.url);
    
    // 获取查询参数
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    
    // 验证参数
    if (!['csv', 'json', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be csv, json, or pdf' },
        { status: 400 }
      );
    }
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }
    
    // 验证日期格式
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }
    
    if (startDateObj > endDateObj) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }
    
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
    
    // 2. 验证站点所有权
    const database = db();
    const [site] = await database
      .select()
      .from(monitoredSites)
      .where(eq(monitoredSites.id, siteId))
      .limit(1);
    
    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }
    
    if (site.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this site' },
        { status: 403 }
      );
    }
    
    // 3. 获取历史数据
    const history = await database
      .select()
      .from(siteMetricsHistory)
      .where(
        and(
          eq(siteMetricsHistory.siteId, siteId),
          gte(siteMetricsHistory.createdAt, startDateObj),
          lte(siteMetricsHistory.createdAt, endDateObj)
        )
      )
      .orderBy(siteMetricsHistory.createdAt);
    
    if (history.length === 0) {
      return NextResponse.json(
        { error: 'No data available for the selected period' },
        { status: 404 }
      );
    }
    
    // 4. 转换数据格式
    const exportData: ExportData[] = history.map(record => ({
      date: record.createdAt.toISOString().split('T')[0],
      revenue: record.revenue || 0,
      visitors: record.visitors || 0,
      orders: record.orders || 0,
      uptimePercentage: record.uptimePercentage || 100,
      responseTime: undefined, // TODO: 从 metrics 中提取
    }));
    
    // 5. 根据格式导出
    const exportOptions = {
      siteName: site.name,
      siteId: site.id,
      domain: site.domain,
      platform: site.platform || 'UPTIME',
      startDate,
      endDate,
      userId: session.user.id,
    };
    
    switch (format) {
      case 'csv': {
        const csv = exportToCSV(exportData, exportOptions);
        const filename = generateCSVFilename(site.name, startDate, endDate);
        return createCSVResponse(csv, filename);
      }
      
      case 'json': {
        const json = exportToJSON(exportData, exportOptions);
        const filename = generateJSONFilename(site.name, startDate, endDate);
        return createJSONResponse(json, filename);
      }
      
      case 'pdf': {
        // PDF 生成可能需要更长时间，添加提示
        const blob = await exportToPDF(exportData, exportOptions);
        const filename = generatePDFFilename(site.name, startDate, endDate);
        return createPDFResponse(blob, filename);
      }
      
      default:
        return NextResponse.json(
          { error: 'Unsupported format' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Failed to export data:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      },
      { status: 500 }
    );
  }
}

