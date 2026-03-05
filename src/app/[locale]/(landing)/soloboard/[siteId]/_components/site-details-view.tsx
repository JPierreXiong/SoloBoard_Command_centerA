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
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useSiteHistory } from '@/shared/hooks/use-site-history';
import { MiniChart } from '@/components/soloboard/mini-chart';
import { toast } from 'sonner';

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
    } catch (err: any) {
      toast.error(err.message || 'Failed to sync site');
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
            <h1 className="text-3xl font-bold">{MOCK_SITE.name}</h1>
            <p className="text-muted-foreground">{MOCK_SITE.domain}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={MOCK_SITE.status === 'online' ? 'success' : 'destructive'}>
            {t(`status.${MOCK_SITE.status}`)}
          </Badge>
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
          value={`$${MOCK_SITE.todayRevenue.toLocaleString()}`}
          color="green"
        />
        <MetricCard
          icon={Users}
          label={t('site_card.today_visitors')}
          value={MOCK_SITE.todayVisitors.toLocaleString()}
          color="blue"
        />
        <MetricCard
          icon={Activity}
          label={t('site_details.avg_revenue')}
          value={`$${Math.round(MOCK_SITE.history.reduce((sum, d) => sum + d.revenue, 0) / MOCK_SITE.history.length)}`}
          color="purple"
        />
        <MetricCard
          icon={TrendingUp}
          label={t('site_details.trend')}
          value="+12.5%"
          color="orange"
        />
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('site_details.history')}
            </CardTitle>
            <Button variant="outline" size="sm">
              {t('site_details.export')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
                {MOCK_SITE.history.map((day) => (
                  <tr key={day.date} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">{day.date}</td>
                    <td className="text-right py-3 px-4 text-green-600 font-semibold">
                      ${day.revenue.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 text-blue-600 font-semibold">
                      {day.visitors.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 text-muted-foreground">
                      ${(day.revenue / Math.max(day.visitors, 1)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Platform Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('site_details.platforms')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {MOCK_SITE.platforms.map((platform) => (
              <Badge key={platform} variant="secondary">
                {platform.toUpperCase()}
              </Badge>
            ))}
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







