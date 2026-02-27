/**
 * Anomaly Detection Service
 * 异常检测逻辑 - 让 SoloBoard 从"数据展示器"进化为"经营警报器"
 */

export type SiteStatus = 'online' | 'warning' | 'offline';

export interface AnomalyAlert {
  type: 'no_sales' | 'low_traffic' | 'site_down';
  severity: 'critical' | 'warning';
  message: string;
}

interface CurrentMetrics {
  revenue: number;
  visitors: number;
  uptimeStatus: 'up' | 'down';
}

interface HistoricalAverage {
  avgRevenue7d: number;
  avgVisitors7d: number;
}

/**
 * 检测网站异常状态
 * 
 * 优先级：
 * 1. 🔴 RED (offline): 网站宕机
 * 2. 🟡 YELLOW (warning): 无单警报 或 流量异常
 * 3. 🟢 GREEN (online): 一切正常
 */
export function detectAnomaly(
  current: CurrentMetrics,
  historical: HistoricalAverage
): { status: SiteStatus; alert: AnomalyAlert | null } {
  const currentHour = new Date().getHours();

  // 1. 🔴 最高优先级：网站宕机
  if (current.uptimeStatus === 'down') {
    return {
      status: 'offline',
      alert: {
        type: 'site_down',
        severity: 'critical',
        message: 'Website is offline',
      },
    };
  }

  // 2. 🟡 无单警报 (Pro 功能)
  // 条件：7天平均有销量 && 今日销量为0 && 当前时间 >= 下午4点
  if (
    historical.avgRevenue7d > 0 &&
    current.revenue === 0 &&
    currentHour >= 16
  ) {
    return {
      status: 'warning',
      alert: {
        type: 'no_sales',
        severity: 'warning',
        message: 'No sales today (usually has sales)',
      },
    };
  }

  // 3. 🟡 流量异常
  // 条件：今日访客 < 7天平均访客的 70%
  if (
    historical.avgVisitors7d > 0 &&
    current.visitors < historical.avgVisitors7d * 0.7
  ) {
    const dropPercentage = Math.round(
      ((historical.avgVisitors7d - current.visitors) /
        historical.avgVisitors7d) *
        100
    );
    return {
      status: 'warning',
      alert: {
        type: 'low_traffic',
        severity: 'warning',
        message: `Traffic is ${dropPercentage}% below average`,
      },
    };
  }

  // 4. 🟢 一切正常
  return {
    status: 'online',
    alert: null,
  };
}

/**
 * 计算历史平均值
 * 从历史数据表中计算最近7天的平均值
 */
export function calculateHistoricalAverage(
  historyData: Array<{ revenue: number; visitors: number }>
): HistoricalAverage {
  if (historyData.length === 0) {
    return {
      avgRevenue7d: 0,
      avgVisitors7d: 0,
    };
  }

  const totalRevenue = historyData.reduce(
    (sum, day) => sum + (day.revenue || 0),
    0
  );
  const totalVisitors = historyData.reduce(
    (sum, day) => sum + (day.visitors || 0),
    0
  );

  return {
    avgRevenue7d: totalRevenue / historyData.length,
    avgVisitors7d: totalVisitors / historyData.length,
  };
}

/**
 * 批量检测多个站点的异常
 */
export function detectMultipleSiteAnomalies(
  sites: Array<{
    id: string;
    current: CurrentMetrics;
    historical: HistoricalAverage;
  }>
): Map<
  string,
  { status: SiteStatus; alert: AnomalyAlert | null }
> {
  const results = new Map();

  sites.forEach((site) => {
    const anomaly = detectAnomaly(site.current, site.historical);
    results.set(site.id, anomaly);
  });

  return results;
}
