/**
 * Uptime Monitoring Service
 * 检查网站是否在线，测量响应时间
 */

interface UptimeResult {
  status: 'up' | 'down';
  responseTime: number; // in milliseconds
  statusCode?: number;
  error?: string;
}

export async function checkUptime(url: string): Promise<UptimeResult> {
  const startTime = Date.now();

  try {
    // Ensure URL has protocol
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(fullUrl, {
      method: 'HEAD',
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
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    return {
      status: 'down',
      responseTime,
      error: error.message || 'Connection failed',
    };
  }
}

/**
 * Check multiple sites concurrently
 */
export async function checkMultipleSites(
  urls: string[]
): Promise<Map<string, UptimeResult>> {
  const results = await Promise.all(
    urls.map(async (url) => {
      const result = await checkUptime(url);
      return [url, result] as [string, UptimeResult];
    })
  );

  return new Map(results);
}







