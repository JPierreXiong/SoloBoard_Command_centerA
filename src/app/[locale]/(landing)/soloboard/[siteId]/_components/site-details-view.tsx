/**
 * Site Details View Component
 * 网站详情视图 - 连接真实 API + 新功能集成
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
  Download,
  FileText,
  FileJson,
  FileSpreadsheet
} from 'lucide-react';
import Link from 'next/link';
import { useSiteHistory } from '@/shared/hooks/use-site-history';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

interface SiteDetailsViewProps {
  siteId: string;
}

interface SiteInfo {
  id: string;
  name: string;
  domain: string;
  status: 'online' | 'offline' | 'warning';
  todayRevenue: number;
  todayVisitors: number;
  platforms: string[];
  logoUrl?: string;
}

export function SiteDetailsView({ siteId }: SiteDetailsViewProps) {
  const t = useTranslations('common.soloboard');
  const tStatus = useTranslations('common.soloboard.status');
  const { history, isLoading: historyLoading, error: historyError, refetch: refetchHistory } = useSiteHistory(siteId, 30);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取站点基本信息
  useEffect(() => {
    const fetchSiteInfo = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/soloboard/sites/${siteId}/metrics`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch site info');
        }

        const data = await response.json();
        setSiteInfo(data.site);
      } catch (err: any) {
        setError(err.message);
        toast.error('Failed to load site details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSiteInfo();
  }, [siteId]);

  // 手动刷新
  const handleRefresh = async () => {
    try {
      const response = await fetch(`/api/soloboard/sites/${siteId}/sync`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to sync site');
      }

      toast.success('Site synced successfully');
      refetchHistory();
      // 重新获取站点信息
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Failed to sync site');
    }
  };

  // 导出数据
  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      toast.loading(`Exporting ${format.toUpperCase()}...`);
      
      const response = await fetch(`/api/soloboard/sites/${siteId}/export?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${siteInfo?.name || 'site'}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`${format.toUpperCase()} exported successfully`);
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-8">
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !siteInfo) {
    return (
      <div className="container mx-auto px-4 py-8 mt-8">
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

  // 计算统计数据
  const avgRevenue = history.length > 0 
    ? Math.round(history.reduce((sum, d) => sum + d.revenue, 0) / history.length)
    : 0;
  
  const avgVisitors = history.length > 0
    ? Math.round(history.reduce((sum, d) => sum + d.visitors, 0) / history.length)
    : 0;

  const trend = history.length >= 2
    ? ((siteInfo.todayRevenue - history[1].revenue) / Math.max(history[1].revenue, 1)) * 100
    : 0;

  // 安全的数字格式化函数
  const formatNumber = (num: number): string => {
    try {
      return num.toLocaleString('en-US');
    } catch {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/soloboard">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('site_details.back')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{siteInfo.name}</h1>
            <p className="text-muted-foreground">{siteInfo.domain}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={siteInfo.status === 'online' ? 'success' : 'destructive'}>
            {tStatus(siteInfo.status)}
          </Badge>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            Sync
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            {t('site_details.settings')}
          </Button>
        </div>
      </div>

      {/* Today's Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={DollarSign}
          label={t('site_card.today_revenue')}
          value={`$${formatNumber(siteInfo.todayRevenue)}`}
          color="green"
        />
        <MetricCard
          icon={Users}
          label={t('site_card.today_visitors')}
          value={formatNumber(siteInfo.todayVisitors)}
          color="blue"
        />
        <MetricCard
          icon={Activity}
          label={t('site_details.avg_revenue')}
          value={`$${formatNumber(avgRevenue)}`}
          color="purple"
        />
        <MetricCard
          icon={TrendingUp}
          label={t('site_details.trend')}
          value={`${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`}
          color={trend > 0 ? 'green' : 'orange'}
        />
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('site_details.history')} ({history.length} days)
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  {t('site_details.export')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')} className="gap-2">
                  <FileJson className="h-4 w-4" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No history data available yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">{t('site_details.date')}</th>
                    <th className="text-right py-3 px-4 font-semibold">{t('site_details.revenue')}</th>
                    <th className="text-right py-3 px-4 font-semibold">{t('site_details.visitors')}</th>
                    <th className="text-right py-3 px-4 font-semibold">{t('site_details.avg_order')}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((day) => (
                    <tr key={day.date} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">{new Date(day.date).toLocaleDateString()}</td>
                      <td className="text-right py-3 px-4 text-green-600 font-semibold">
                        ${formatNumber(day.revenue / 100)}
                      </td>
                      <td className="text-right py-3 px-4 text-blue-600 font-semibold">
                        {formatNumber(day.visitors)}
                      </td>
                      <td className="text-right py-3 px-4 text-muted-foreground">
                        ${day.visitors > 0 ? ((day.revenue / 100) / day.visitors).toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('site_details.platforms')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {siteInfo.platforms && siteInfo.platforms.length > 0 ? (
              siteInfo.platforms.map((platform) => (
                <Badge key={platform} variant="secondary">
                  {platform.toUpperCase()}
                </Badge>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No platforms connected yet</p>
            )}
          </div>
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
