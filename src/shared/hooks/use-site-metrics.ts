/**
 * Custom Hook: useSiteMetrics
 * 获取单个站点的详细指标
 */

'use client';

import { useState, useEffect } from 'react';

interface SiteMetrics {
  siteId: string;
  name: string;
  domain: string;
  status: string;
  metrics: {
    revenue: {
      today: number;
      yesterday: number;
      last7days: number;
      sources: Record<string, number>;
    };
    visitors: {
      today: number;
      yesterday: number;
      last7days: number;
      sources: Record<string, number>;
    };
    uptime: {
      status: string;
      responseTime: number;
      uptimePercentage: number;
    };
  };
  lastUpdated: string;
}

interface UseSiteMetricsReturn {
  metrics: SiteMetrics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSiteMetrics(siteId: string): UseSiteMetricsReturn {
  const [metrics, setMetrics] = useState<SiteMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/soloboard/sites/${siteId}/metrics`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch site metrics');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Error fetching site metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (siteId) {
      fetchMetrics();
    }
  }, [siteId]);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics,
  };
}







