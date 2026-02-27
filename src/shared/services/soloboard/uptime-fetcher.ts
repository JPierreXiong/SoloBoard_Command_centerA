/**
 * SoloBoard - Uptime 监控服务
 * 
 * 用于检查网站是否在线及响应时间
 * 
 * 简单的 HTTP 请求检查，不依赖第三方服务
 */

import type { SiteApiConfig } from '@/shared/lib/site-crypto';

/**
 * Uptime 指标数据类型
 */
export interface UptimeMetrics {
  isOnline: boolean; // 是否在线
  responseTime: number; // 响应时间（毫秒）
  statusCode?: number; // HTTP 状态码
  errorMessage?: string; // 错误信息
  updatedAt: string; // 更新时间（ISO 8601）
}

/**
 * 检查网站 Uptime 状态
 * 
 * @param config - Uptime 配置
 * @returns Uptime 指标数据
 */
export async function fetchUptimeMetrics(
  config: NonNullable<SiteApiConfig['uptime']>
): Promise<UptimeMetrics> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 秒超时
    
    const response = await fetch(config.url, {
      method: 'HEAD', // 使用 HEAD 请求，不下载内容
      signal: controller.signal,
      headers: {
        'User-Agent': 'SoloBoard-Uptime-Monitor/1.0',
      },
    });
    
    clearTimeout(timeoutId);
    
    const responseTime = Date.now() - startTime;
    
    return {
      isOnline: response.ok, // 2xx 状态码视为在线
      responseTime,
      statusCode: response.status,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      isOnline: false,
      responseTime,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * 验证 Uptime 配置是否有效
 * 
 * @param config - Uptime 配置
 * @returns true 如果配置有效
 */
export async function validateUptimeConfig(
  config: NonNullable<SiteApiConfig['uptime']>
): Promise<boolean> {
  try {
    // 验证 URL 格式
    new URL(config.url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 格式化 Uptime 指标为显示文本
 * 
 * @param metrics - Uptime 指标数据
 * @returns 格式化后的文本对象
 */
export function formatUptimeMetrics(metrics: UptimeMetrics) {
  return {
    status: metrics.isOnline ? '🟢 Online' : '🔴 Offline',
    responseTime: `${metrics.responseTime}ms`,
    statusCode: metrics.statusCode ? `HTTP ${metrics.statusCode}` : 'N/A',
  };
}
























