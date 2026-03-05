/**
 * Custom Hook: useSiteHistory
 * 获取站点历史数据
 */

'use client';

import { useState, useEffect } from 'react';

interface HistoryDataPoint {
  date: string;
  revenue: number;
  visitors: number;
}

interface UseSiteHistoryReturn {
  history: HistoryDataPoint[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSiteHistory(siteId: string, days: number = 30): UseSiteHistoryReturn {
  const [history, setHistory] = useState<HistoryDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/soloboard/sites/${siteId}/history?days=${days}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch site history');
      }

      const data = await response.json();
      setHistory(data.history || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Error fetching site history:', err);
      // 设置空数组以防止组件崩溃
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (siteId) {
      fetchHistory();
    }
  }, [siteId, days]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}

