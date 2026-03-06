/**
 * SoloBoard - Website Monitoring Dashboard
 * The Pulse: Exception-driven website list
 * 
 * 核心改进：
 * 1. 异常状态优先排序（红 → 黄 → 绿）
 * 2. 显示网站 Logo
 * 3. 优化视觉层次
 * 4. 集成简化的 3 步添加向导
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, TrendingUp, Users, Globe, AlertCircle, RefreshCw, MoreVertical, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { motion } from 'framer-motion';
import { useSites } from '@/shared/hooks/use-sites';
import { SimpleAddSiteDialog } from '@/components/soloboard/simple-add-site-dialog';
import { toast } from 'sonner';

type SiteStatus = 'online' | 'offline' | 'warning';

interface Site {
  id: string;
  domain: string;
  name: string;
  logoUrl?: string;
  status: SiteStatus;
  todayRevenue: number;
  todayVisitors: number;
  avgRevenue7d: number;
}

export function SoloBoardDashboard() {
  const t = useTranslations('common.soloboard');
  const { sites, summary, isLoading, error, refetch } = useSites();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 🎯 核心改进：异常状态优先排序
  // 排序规则：offline (红) → warning (黄) → online (绿)
  const sortedSites = [...sites].sort((a, b) => {
    const priority = { offline: 0, warning: 1, online: 2 };
    return priority[a.status] - priority[b.status];
  });

  // 处理添加站点成功
  const handleAddSuccess = () => {
    setIsAddDialogOpen(false);
    refetch();
    toast.success('Website added successfully!');
  };

  // 处理删除站点
  const handleDeleteSite = async () => {
    if (!siteToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/soloboard/sites/${siteToDelete}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Website deleted successfully!');
        refetch();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete website');
      }
    } catch (error) {
      toast.error('Failed to delete website');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSiteToDelete(null);
    }
  };

  // 打开删除确认对话框
  const confirmDelete = (siteId: string) => {
    setSiteToDelete(siteId);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-16">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('page.title')}</h1>
          <p className="text-muted-foreground">{t('page.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={refetch}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
          <Button 
            size="lg" 
            className="gap-2 shadow-lg hover:shadow-xl transition-all"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-5 w-5" />
            {t('add_button')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          icon={Globe}
          label={t('summary.total_sites')}
          value={summary.totalSites.toString()}
          color="blue"
        />
        <SummaryCard
          icon={TrendingUp}
          label={t('summary.total_revenue')}
          value={`$${summary.totalRevenue.toLocaleString()}`}
          color="green"
        />
        <SummaryCard
          icon={Users}
          label={t('summary.total_visitors')}
          value={summary.totalVisitors.toLocaleString()}
          color="purple"
        />
        <SummaryCard
          icon={AlertCircle}
          label={t('summary.sites_online')}
          value={`${summary.sitesOnline}/${summary.totalSites}`}
          color={summary.sitesOnline === summary.totalSites ? 'green' : 'red'}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">{t('loading')}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('error.title')}</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={refetch} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {t('error.retry')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sites List */}
      {!isLoading && !error && (
        <>
          {sortedSites.length === 0 ? (
            <EmptyState t={t} />
          ) : (
            <div className="space-y-4">
              {sortedSites.map((site, index) => (
                <motion.div
                  key={site.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <SiteCard site={site} t={t} onDelete={confirmDelete} />
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 添加站点对话框 - 简化版 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Add Website</DialogTitle>
          </DialogHeader>
          <SimpleAddSiteDialog onSuccess={handleAddSuccess} />
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Website</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this website? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSite}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Summary Card Component
function SummaryCard({ 
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
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    red: 'from-red-500 to-orange-500',
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

// Site Card Component - 优化版：显示 Logo + 删除按钮
function SiteCard({ site, t, onDelete }: { site: Site; t: any; onDelete: (siteId: string) => void }) {
  const statusConfig = {
    offline: {
      color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
      badge: 'destructive',
      borderColor: 'border-red-500',
      alert: t('alerts.offline'),
    },
    warning: {
      color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
      badge: 'warning',
      borderColor: 'border-yellow-500',
      alert: site.avgRevenue7d > 0 && site.todayRevenue === 0 
        ? t('alerts.no_sales') 
        : t('alerts.low_traffic'),
    },
    online: {
      color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
      badge: 'success',
      borderColor: '',
      alert: null,
    },
  };

  const config = statusConfig[site.status];

  return (
    <Card className={`${site.status !== 'online' ? 'border-2' : ''} ${config.borderColor}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Left: Site Info with Logo */}
          <div className="flex items-center gap-4 flex-1">
            {/* 🎯 显示网站 Logo */}
            {site.logoUrl ? (
              <img 
                src={site.logoUrl} 
                alt={site.name}
                className="w-12 h-12 rounded-lg object-cover border"
              />
            ) : (
              <div className={`w-12 h-12 rounded-lg ${config.color} flex items-center justify-center font-bold text-lg`}>
                {site.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{site.name}</h3>
                <Badge variant={config.badge as any}>
                  {t(`status.${site.status}`)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{site.domain}</p>
              {config.alert && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {config.alert}
                </p>
              )}
            </div>
          </div>

          {/* Right: Metrics + Actions */}
          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t('site_card.today_revenue')}</p>
              <p className="text-2xl font-bold text-green-600">
                ${site.todayRevenue.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t('site_card.today_visitors')}</p>
              <p className="text-2xl font-bold text-blue-600">
                {site.todayVisitors.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/soloboard/${site.id}`}>
                <Button variant="outline" size="sm" className="hover:bg-accent transition-colors">
                  {t('site_card.view_details')}
                </Button>
              </Link>
              
              {/* 操作菜单 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href={site.domain.startsWith('http') ? site.domain : `https://${site.domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Visit Website
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(site.id)}
                    className="text-destructive focus:text-destructive flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty State Component
function EmptyState({ t }: { t: any }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Globe className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{t('empty_state.title')}</h3>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          {t('empty_state.description')}
        </p>
        <Button 
          size="lg" 
          className="gap-2 shadow-lg hover:shadow-xl transition-all"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-5 w-5" />
          {t('empty_state.add_button')}
        </Button>
      </CardContent>
    </Card>
  );
}

