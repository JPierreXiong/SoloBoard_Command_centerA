/**
 * Custom Hook: useSites
 * 获取所有站点数据
 */

'use client';

import { useState, useEffect } from 'react';

interface Site {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string;
  status: 'online' | 'offline' | 'warning';
  todayRevenue: number;
  todayVisitors: number;
  avgRevenue7d: number;
  platforms: string[];
}

interface Summary {
  totalSites: number;
  totalRevenue: number;
  totalVisitors: number;
  sitesOnline: number;
}

interface UseSitesReturn {
  sites: Site[];
  summary: Summary;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSites(): UseSitesReturn {
  const [sites, setSites] = useState<Site[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalSites: 0,
    totalRevenue: 0,
    totalVisitors: 0,
    sitesOnline: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSites = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/soloboard/dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch sites');
      }

      const data = await response.json();
      setSites(data.sites || []);
      setSummary(data.summary || {
        totalSites: 0,
        totalRevenue: 0,
        totalVisitors: 0,
        sitesOnline: 0,
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Error fetching sites:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  return {
    sites,
    summary,
    isLoading,
    error,
    refetch: fetchSites,
  };
}

