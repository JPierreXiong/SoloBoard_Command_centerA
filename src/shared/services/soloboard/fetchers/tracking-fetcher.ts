/**
 * Tracking Fetcher - 自建追踪系统
 * 
 * 功能:
 * - 从自建追踪 API 获取访客数据
 * - 支持自定义端点
 */

export interface TrackingConfig {
  apiUrl: string; // 自建追踪 API 地址
  apiKey?: string; // 可选的 API Key
  siteId?: string; // 站点 ID
}

export interface TrackingMetrics {
  visitors: number;
  pageViews: number;
  uniqueVisitors?: number;
  source: 'tracking';
  fetchedAt: Date;
}

export async function fetchTrackingMetrics(
  config: TrackingConfig
): Promise<TrackingMetrics> {
  try {
    const { apiUrl, apiKey, siteId } = config;

    // 构建请求 URL
    const url = new URL(apiUrl);
    if (siteId) {
      url.searchParams.append('site_id', siteId);
    }
    
    // 获取今日数据
    const today = new Date().toISOString().split('T')[0];
    url.searchParams.append('date', today);

    // 发送请求
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Tracking API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      visitors: data.visitors || data.unique_visitors || 0,
      pageViews: data.page_views || data.pageviews || 0,
      uniqueVisitors: data.unique_visitors || data.visitors || 0,
      source: 'tracking',
      fetchedAt: new Date(),
    };
  } catch (error: any) {
    console.error('Tracking fetch error:', error);
    throw new Error(`Failed to fetch tracking metrics: ${error.message}`);
  }
}

/**
 * 验证追踪配置
 */
export async function validateTrackingConfig(
  config: TrackingConfig
): Promise<boolean> {
  try {
    const metrics = await fetchTrackingMetrics(config);
    return true;
  } catch (error) {
    return false;
  }
}

