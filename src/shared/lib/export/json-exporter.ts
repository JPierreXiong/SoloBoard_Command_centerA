/**
 * JSON Exporter - JSON 数据导出
 * 
 * 用途：将网站数据导出为 JSON 格式
 * 不改变 ShipAny 结构，仅扩展功能
 */

import { ExportData, ExportOptions } from './csv-exporter';

export interface JSONExportData {
  site: {
    id: string;
    name: string;
    domain: string;
    platform: string;
  };
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalRevenue: number;
    totalVisitors: number;
    totalOrders: number;
    avgUptime: number;
    daysTracked: number;
  };
  data: ExportData[];
  metadata: {
    exportedAt: string;
    exportedBy: string;
    version: string;
  };
}

/**
 * 导出为 JSON 格式
 */
export function exportToJSON(
  data: ExportData[],
  options: ExportOptions & {
    siteId: string;
    domain: string;
    platform: string;
    userId?: string;
  }
): string {
  try {
    // 计算汇总统计
    const totalRevenue = data.reduce((sum, row) => sum + row.revenue, 0);
    const totalVisitors = data.reduce((sum, row) => sum + row.visitors, 0);
    const totalOrders = data.reduce((sum, row) => sum + row.orders, 0);
    const avgUptime = data.length > 0
      ? data.reduce((sum, row) => sum + row.uptimePercentage, 0) / data.length
      : 0;
    
    // 构建 JSON 结构
    const jsonData: JSONExportData = {
      site: {
        id: options.siteId,
        name: options.siteName,
        domain: options.domain,
        platform: options.platform,
      },
      period: {
        start: options.startDate,
        end: options.endDate,
      },
      summary: {
        totalRevenue,
        totalVisitors,
        totalOrders,
        avgUptime: parseFloat(avgUptime.toFixed(2)),
        daysTracked: data.length,
      },
      data: data.map(row => ({
        ...row,
        revenue: row.revenue / 100, // 转换为美元
      })),
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: options.userId || 'system',
        version: '1.0',
      },
    };
    
    // 转换为格式化的 JSON 字符串
    return JSON.stringify(jsonData, null, 2);
  } catch (error) {
    console.error('Failed to export JSON:', error);
    throw new Error('JSON export failed');
  }
}

/**
 * 生成 JSON 文件名
 */
export function generateJSONFilename(siteName: string, startDate: string, endDate: string): string {
  const sanitizedName = siteName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const timestamp = new Date().getTime();
  return `${sanitizedName}-${startDate}-to-${endDate}-${timestamp}.json`;
}

/**
 * 创建 JSON 下载响应
 */
export function createJSONResponse(json: string, filename: string): Response {
  return new Response(json, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    },
  });
}

/**
 * 导出简化版 JSON（仅数据，无元数据）
 */
export function exportToSimpleJSON(data: ExportData[]): string {
  try {
    return JSON.stringify(
      data.map(row => ({
        date: row.date,
        revenue: (row.revenue / 100).toFixed(2),
        visitors: row.visitors,
        orders: row.orders,
        uptime: row.uptimePercentage,
        responseTime: row.responseTime,
      })),
      null,
      2
    );
  } catch (error) {
    console.error('Failed to export simple JSON:', error);
    throw new Error('Simple JSON export failed');
  }
}

