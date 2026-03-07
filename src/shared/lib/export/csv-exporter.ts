/**
 * CSV Exporter - CSV 数据导出
 * 
 * 用途：将网站数据导出为 CSV 格式
 * 不改变 ShipAny 结构，仅扩展功能
 */

import { Parser } from 'json2csv';

export interface ExportData {
  date: string;
  revenue: number;
  visitors: number;
  orders: number;
  uptimePercentage: number;
  responseTime?: number;
}

export interface ExportOptions {
  siteName: string;
  startDate: string;
  endDate: string;
  includeHeaders?: boolean;
}

/**
 * 导出为 CSV 格式
 */
export function exportToCSV(
  data: ExportData[],
  options: ExportOptions
): string {
  try {
    // 定义 CSV 字段
    const fields = [
      { label: 'Date', value: 'date' },
      { label: 'Revenue (USD)', value: (row: ExportData) => (row.revenue / 100).toFixed(2) },
      { label: 'Visitors', value: 'visitors' },
      { label: 'Orders', value: 'orders' },
      { label: 'Uptime (%)', value: 'uptimePercentage' },
      { label: 'Response Time (ms)', value: 'responseTime' },
    ];
    
    // 创建 CSV parser
    const parser = new Parser({
      fields,
      header: options.includeHeaders !== false,
    });
    
    // 转换为 CSV
    const csv = parser.parse(data);
    
    // 添加元数据注释（可选）
    const metadata = [
      `# Website: ${options.siteName}`,
      `# Period: ${options.startDate} to ${options.endDate}`,
      `# Generated: ${new Date().toISOString()}`,
      `# Total Records: ${data.length}`,
      '',
    ].join('\n');
    
    return metadata + csv;
  } catch (error) {
    console.error('Failed to export CSV:', error);
    throw new Error('CSV export failed');
  }
}

/**
 * 生成 CSV 文件名
 */
export function generateCSVFilename(siteName: string, startDate: string, endDate: string): string {
  const sanitizedName = siteName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const timestamp = new Date().getTime();
  return `${sanitizedName}-${startDate}-to-${endDate}-${timestamp}.csv`;
}

/**
 * 创建 CSV 下载响应
 */
export function createCSVResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    },
  });
}

/**
 * 导出汇总数据为 CSV
 */
export function exportSummaryToCSV(
  data: ExportData[],
  options: ExportOptions
): string {
  try {
    // 计算汇总统计
    const totalRevenue = data.reduce((sum, row) => sum + row.revenue, 0);
    const totalVisitors = data.reduce((sum, row) => sum + row.visitors, 0);
    const totalOrders = data.reduce((sum, row) => sum + row.orders, 0);
    const avgUptime = data.reduce((sum, row) => sum + row.uptimePercentage, 0) / data.length;
    
    const summary = [
      ['Metric', 'Value'],
      ['Website', options.siteName],
      ['Period', `${options.startDate} to ${options.endDate}`],
      ['Total Revenue', `$${(totalRevenue / 100).toFixed(2)}`],
      ['Total Visitors', totalVisitors.toString()],
      ['Total Orders', totalOrders.toString()],
      ['Average Uptime', `${avgUptime.toFixed(2)}%`],
      ['Days Tracked', data.length.toString()],
    ];
    
    return summary.map(row => row.join(',')).join('\n');
  } catch (error) {
    console.error('Failed to export summary CSV:', error);
    throw new Error('Summary CSV export failed');
  }
}




