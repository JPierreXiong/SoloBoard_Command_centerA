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
import { Plus, TrendingUp, Users, Globe, AlertCircle, RefreshCw, MoreVertical, Trash2, ExternalLink, Zap } from 'lucide-react';
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
import { WizardBatchAddDialog } from '@/components/soloboard/wizard-batch-add-dialog';
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
  const [isBatchAddOpen, setIsBatchAddOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
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
    
    // 获取要删除的站点信息
    const site = sites.find(s => s.id === siteToDelete);
    if (!site) return;
    
    // 验证输入的域名
    if (deleteConfirmText !== site.domain) {
      toast.error('Domain name does not match');
      return;
    }
    
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
      setDeleteConfirmText('');
    }
  };

  // 打开删除确认对话框
  const confirmDelete = (siteId: string) => {
    setSiteToDelete(siteId);
    setDeleteConfirmText('');
    setDeleteDialogOpen(true);
  };

  // 格式化网站名称 - 避免显示 WWW
  const formatSiteName = (name: string, domain: string): string => {
    if (!name || name === 'WWW' || name.toLowerCase() === 'www' || name.trim() === '') {
      return domain.replace(/^(https?:\/\/)?(www\.)?/, '');
    }
    return name;
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
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
            variant="outline"
            size="lg" 
            className="gap-2"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-5 w-5" />
            {t('add_single_site')}
          </Button>
          <Button 
            size="lg" 
            className="gap-2 shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            onClick={() => setIsBatchAddOpen(true)}
          >
            <Zap className="h-5 w-5" />
            {t('batch_add_sites')}
          </Button>
        </div>
      </div>

      {/* Plan Quota Info */}
      {!isLoading && !error && (
        <div className="mb-8">
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Current Plan: <span className="font-bold">Free</span>
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {sites.length} / 1 site used
                      {sites.length >= 1 && (
                        <span className="ml-2 text-orange-600 dark:text-orange-400 font-semibold">
                          • Limit reached
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {sites.length >= 1 && (
                  <Link href="/pricing">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Upgrade to Base (5 sites) or Pro (Unlimited)
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
            <EmptyState t={t} onAddClick={() => setIsAddDialogOpen(true)} />
          ) : (
            <>
              {/* Info Banner - How to see real data */}
              {sortedSites.some(site => site.todayRevenue === 0 && site.todayVisitors === 0) && (
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          Seeing $0 revenue and 0 visitors?
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                          To display real revenue and visitor data, you need to configure API integrations for your websites. 
                          Click "View Details" on any site card, then click the settings icon to add your Stripe API key, 
                          Google Analytics 4 property ID, or other integrations.
                        </p>
                        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Uptime monitoring works automatically - no configuration needed!</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
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
            </>
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

      {/* 批量添加站点对话框 - 3步向导式 */}
      <Dialog open={isBatchAddOpen} onOpenChange={setIsBatchAddOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Batch Add Websites</DialogTitle>
          </DialogHeader>
          <WizardBatchAddDialog 
            onSuccess={() => {
              setIsBatchAddOpen(false);
              refetch();
            }}
            onClose={() => setIsBatchAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Delete Website
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This action cannot be undone. This will permanently delete your website
                and all associated data.
              </p>
              {siteToDelete && (() => {
                const site = sites.find(s => s.id === siteToDelete);
                return site ? (
                  <div className="space-y-2">
                    <label htmlFor="delete-confirm" className="text-sm font-medium text-foreground">
                      Type <span className="font-mono font-bold">{site.domain}</span> to confirm:
                    </label>
                    <input
                      id="delete-confirm"
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={site.domain}
                      className="w-full px-3 py-2 border rounded-md"
                      disabled={isDeleting}
                    />
                  </div>
                ) : null;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSite}
              disabled={isDeleting || (() => {
                const site = sites.find(s => s.id === siteToDelete);
                return !site || deleteConfirmText !== site.domain;
              })()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Website'}
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
  // 格式化网站名称
  const formatSiteName = (name: string, domain: string): string => {
    if (!name || name === 'WWW' || name.toLowerCase() === 'www' || name.trim() === '') {
      return domain.replace(/^(https?:\/\/)?(www\.)?/, '');
    }
    return name;
  };

  const displayName = formatSiteName(site.name, site.domain);
  
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
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{displayName}</h3>
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
function EmptyState({ t, onAddClick }: { t: any; onAddClick: () => void }) {
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
          onClick={onAddClick}
        >
          <Plus className="h-5 w-5" />
          {t('empty_state.add_button')}
        </Button>
      </CardContent>
    </Card>
  );
}

