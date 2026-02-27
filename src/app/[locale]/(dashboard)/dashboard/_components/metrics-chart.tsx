/**
 * SoloBoard - 趋势图表组件
 * 
 * 使用 Recharts 显示站点指标的历史趋势
 */

'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface MetricsChartProps {
  siteId: string;
  platform: 'GA4' | 'STRIPE' | 'UPTIME' | 'LEMON_SQUEEZY' | 'SHOPIFY';
}

interface HistoryData {
  timestamp: string;
  value: number;
}

export function MetricsChart({ siteId, platform }: MetricsChartProps) {
  const [data, setData] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    loadHistoryData();
  }, [siteId, timeRange]);

  const loadHistoryData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/soloboard/sites/${siteId}/history?range=${timeRange}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        // 转换数据格式
        const formattedData = result.data.map((item: any) => ({
          timestamp: new Date(item.recordedAt).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          value: getMetricValue(item.metrics),
        }));
        setData(formattedData);
      }
    } catch (error) {
      console.error('加载历史数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 根据平台提取指标值
  const getMetricValue = (metrics: any): number => {
    switch (platform) {
      case 'GA4':
        return metrics.activeUsers || 0;
      case 'STRIPE':
        return (metrics.todayRevenue || 0) / 100;
      case 'UPTIME':
        return metrics.responseTime || 0;
      default:
        return 0;
    }
  };

  // 获取指标名称
  const getMetricName = (): string => {
    switch (platform) {
      case 'GA4':
        return '在线用户数';
      case 'STRIPE':
        return '收入 ($)';
      case 'UPTIME':
        return '响应时间 (ms)';
      default:
        return '指标';
    }
  };

  // 获取颜色
  const getColor = (): string => {
    switch (platform) {
      case 'GA4':
        return '#3b82f6'; // blue
      case 'STRIPE':
        return '#10b981'; // green
      case 'UPTIME':
        return '#8b5cf6'; // purple
      default:
        return '#6b7280'; // gray
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
        暂无历史数据
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 时间范围选择 */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {getMetricName()}趋势
        </h4>
        <div className="flex space-x-2">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {range === '24h' ? '24小时' : range === '7d' ? '7天' : '30天'}
            </button>
          ))}
        </div>
      </div>

      {/* 图表 */}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`color-${siteId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={getColor()} stopOpacity={0.3} />
              <stop offset="95%" stopColor={getColor()} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="timestamp"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={getColor()}
            strokeWidth={2}
            fill={`url(#color-${siteId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}











