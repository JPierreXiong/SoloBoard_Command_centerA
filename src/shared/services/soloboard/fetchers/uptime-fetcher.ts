/**
 * Uptime Fetcher - 网站在线监控
 * 
 * 功能:
 * - 检查网站是否在线
 * - 测量响应时间
 * - 返回状态码
 */

export interface UptimeConfig {
  url: string;
  timeout?: number;
}

export interface UptimeMetrics {
  status: 'up' | 'down';
  responseTime: number; // 毫秒
  statusCode?: number;
  error?: string;
  checkedAt: Date;
}

export async function fetchUptimeMetrics(
  config: UptimeConfig
): Promise<UptimeMetrics> {
  const startTime = Date.now();
  const timeout = config.timeout || 10000; // 默认 10 秒超时

  try {
    // 确保 URL 有协议
    const url = config.url.startsWith('http') 
      ? config.url 
      : `https://${config.url}`;

    // 使用 AbortController 实现超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'HEAD', // 只获取头部，更快
      signal: controller.signal,
      headers: {
        'User-Agent': 'SoloBoard-Monitor/1.0',
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    return {
      status: response.ok ? 'up' : 'down',
      responseTime,
      statusCode: response.status,
      checkedAt: new Date(),
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    return {
      status: 'down',
      responseTime,
      error: error.message || 'Unknown error',
      checkedAt: new Date(),
    };
  }
}

/**
 * 批量检查多个网站
 */
export async function fetchBatchUptimeMetrics(
  configs: UptimeConfig[]
): Promise<Map<string, UptimeMetrics>> {
  const results = new Map<string, UptimeMetrics>();

  // 并行检查所有网站
  const promises = configs.map(async (config) => {
    const metrics = await fetchUptimeMetrics(config);
    results.set(config.url, metrics);
  });

  await Promise.all(promises);

  return results;
}

