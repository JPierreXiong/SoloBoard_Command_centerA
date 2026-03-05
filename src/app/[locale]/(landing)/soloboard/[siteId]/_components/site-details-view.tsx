/**
 * Site Details View Component
 * 网站详情视图 - 连接真实 API
 */

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  DollarSign,
  Activity,
  Calendar,
  Settings,
  RefreshCw,
  AlertCircle,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface SiteDetailsViewProps {
  siteId: string;
}

interface MetricData {
  date: Date;
  revenue: number;
  visitors: number;
  uptimePercentage: number;
  responseTime: number;
}

interface SiteData {
  site: {
    id: string;
    name: string;
    domain: string;
    url: string;
    logoUrl?: string;
    platform: string;
    status: string;
    lastSyncAt?: Date;
    lastSyncStatus?: string;
  };
  metrics: MetricData[];
  stats: {
    totalRevenue: number;
    totalVisitors: number;
    avgUptime: number;
    avgResponseTime: number;
  };
}

export function SiteDetailsView({ siteId }: SiteDetailsViewProps) {
  const t = useTranslations('common.soloboard');
  const [data, setData] = useState<SiteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取站点详情
  const fetchSiteDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/soloboard/sites/${siteId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch site details');
      }

      const result = await response.json();
      
      if (result.success) {
        setData(result);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load site details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSiteDetails();
  }, [siteId]);

  // 手动刷新
  const handleRefresh = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch(`/api/soloboard/sites/${siteId}/sync`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to sync site');
      }

      toast.success('Site synced successfully');
      await fetchSiteDetails();
    } catch (err: any) {
      toast.error(err.message || 'Failed to sync site');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-24">
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8 mt-24">
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-xl font-semibold mb-2">Error Loading Site</h3>
            <p className="text-muted-foreground mb-6">{error || 'Site not found'}</p>
            <Link href="/soloboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { site, metrics, stats } = data;
  
  // 计算今天的数据
  const todayMetrics = metrics[0] || { revenue: 0, visitors: 0, uptimePercentage: 100, responseTime: 0 };
  
  // 计算趋势
  const yesterdayMetrics = metrics[1] || { revenue: 0, visitors: 0 };
  const revenueTrend = yesterdayMetrics.revenue > 0
    ? ((todayMetrics.revenue - yesterdayMetrics.revenue) / yesterdayMetrics.revenue) * 100
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 mt-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/soloboard">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {site.logoUrl && (
              <img src={site.logoUrl} alt={site.name} className="w-10 h-10 rounded-lg" />
            )}
            <div>
              <h1 className="text-3xl font-bold">{site.name}</h1>
              <p className="text-muted-foreground">{site.domain}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={stats.avgUptime >= 99 ? 'default' : 'destructive'}>
            {stats.avgUptime >= 99 ? 'Online' : 'Issues Detected'}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handleRefresh}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
        </div>
      </div>

      {/* Today's Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={DollarSign}
          label="Today's Revenue"
          value={`$${todayMetrics.revenue.toLocaleString()}`}
          color="green"
        />
        <MetricCard
          icon={Users}
          label="Today's Visitors"
          value={todayMetrics.visitors.toLocaleString()}
          color="blue"
        />
        <MetricCard
          icon={Activity}
          label="Avg Uptime (30d)"
          value={`${stats.avgUptime.toFixed(1)}%`}
          color="purple"
        />
        <MetricCard
          icon={Zap}
          label="Avg Response Time"
          value={`${stats.avgResponseTime}ms`}
          color="orange"
        />
      </div>

      {/* 30-Day Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>30-Day Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Revenue</span>
              <span className="text-2xl font-bold text-green-600">
                ${stats.totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Visitors</span>
              <span className="text-2xl font-bold text-blue-600">
                {stats.totalVisitors.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Revenue Trend</span>
              <span className={`text-lg font-semibold ${revenueTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenueTrend >= 0 ? '+' : ''}{revenueTrend.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Platform</span>
              <Badge variant="secondary">{site.platform}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={site.status === 'active' ? 'default' : 'secondary'}>
                {site.status}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Last Sync</span>
              <span className="text-sm">
                {site.lastSyncAt 
                  ? new Date(site.lastSyncAt).toLocaleString() 
                  : 'Never'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              30-Day History
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {metrics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No data available yet. Sync your site to see metrics.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-right py-3 px-4 font-semibold">Revenue</th>
                    <th className="text-right py-3 px-4 font-semibold">Visitors</th>
                    <th className="text-right py-3 px-4 font-semibold">Uptime</th>
                    <th className="text-right py-3 px-4 font-semibold">Response Time</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        {new Date(metric.date).toLocaleDateString()}
                      </td>
                      <td className="text-right py-3 px-4 text-green-600 font-semibold">
                        ${metric.revenue.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-blue-600 font-semibold">
                        {metric.visitors.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4">
                        <Badge variant={metric.uptimePercentage >= 99 ? 'default' : 'destructive'}>
                          {metric.uptimePercentage}%
                        </Badge>
                      </td>
                      <td className="text-right py-3 px-4 text-muted-foreground">
                        {metric.responseTime}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Metric Card Component
function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: any; 
  label: string; 
  value: string; 
  color: string;
}) {
  const colorClasses = {
    green: 'from-green-500 to-emerald-500',
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-orange-500 to-red-500',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
