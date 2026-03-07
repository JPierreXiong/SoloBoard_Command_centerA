/**
 * 批量添加站点对话框
 * Batch Add Sites Dialog
 * 
 * 功能:
 * 1. 批量粘贴域名 (从剪贴板)
 * 2. 表格式编辑 (最多 10 行)
 * 3. 批量应用 API Key
 * 4. 实时验证状态
 * 5. 并发提交
 * 
 * 不改变 ShipAny 结构 - 独立组件
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Globe, 
  Zap, 
  Trash2, 
  Plus, 
  ShieldCheck, 
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Progress } from '@/shared/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { toast } from 'sonner';

interface BatchSite {
  domain: string;
  name?: string;
  platform: 'UPTIME' | 'GA4' | 'STRIPE' | 'SHOPIFY' | 'LEMON';
  apiConfig?: {
    stripeKey?: string;
    ga4PropertyId?: string;
    shopifyDomain?: string;
    shopifyAccessToken?: string;
    lemonApiKey?: string;
  };
  status: 'pending' | 'validating' | 'success' | 'error';
  error?: string;
}

interface BatchAddSitesDialogProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export function BatchAddSitesDialog({ onSuccess, onClose }: BatchAddSitesDialogProps) {
  const t = useTranslations('common.soloboard.batch_add');
  
  const [sites, setSites] = useState<BatchSite[]>([
    { domain: '', platform: 'UPTIME', status: 'pending' }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batchApiKey, setBatchApiKey] = useState({
    stripe: '',
    ga4: '',
    shopify: '',
    lemon: '',
  });

  // 🎯 核心功能 1: 批量粘贴域名
  const handleBatchPaste = (e: React.ClipboardEvent, index: number) => {
    const text = e.clipboardData.getData('text');
    const lines = text.split(/[\n,]/).map(line => line.trim()).filter(line => line);
    
    if (lines.length > 1) {
      e.preventDefault();
      
      // 解析域名列表
      const newSites: BatchSite[] = lines.slice(0, 10).map(line => {
        // 支持格式: "domain.com" 或 "Name, domain.com"
        const parts = line.split(',').map(p => p.trim());
        const domain = parts.length > 1 ? parts[1] : parts[0];
        const name = parts.length > 1 ? parts[0] : domain;
        
        return {
          domain: domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
          name,
          platform: 'UPTIME',
          status: 'pending',
        };
      });
      
      setSites(newSites);
      toast.success(t('toast_success', { count: newSites.length }));
    }
  };

  // 🎯 核心功能 2: 批量应用 API Key
  const applyApiKeyToAll = (key: string, type: 'stripe' | 'ga4' | 'shopify' | 'lemon') => {
    if (!key.trim()) return;
    
    setSites(sites.map(site => {
      const apiConfig = site.apiConfig || {};
      
      switch (type) {
        case 'stripe':
          return { ...site, apiConfig: { ...apiConfig, stripeKey: key } };
        case 'ga4':
          return { ...site, apiConfig: { ...apiConfig, ga4PropertyId: key } };
        case 'shopify':
          return { ...site, apiConfig: { ...apiConfig, shopifyAccessToken: key } };
        case 'lemon':
          return { ...site, apiConfig: { ...apiConfig, lemonApiKey: key } };
        default:
          return site;
      }
    }));
    
    toast.success(`${t('apply_button')} ${type.toUpperCase()} Key`);
  };

  // 更新单个站点
  const updateSite = (index: number, updates: Partial<BatchSite>) => {
    setSites(sites.map((site, i) => i === index ? { ...site, ...updates } : site));
  };

  // 删除站点
  const deleteSite = (index: number) => {
    if (sites.length === 1) {
      toast.error(t('toast_batch_error'));
      return;
    }
    setSites(sites.filter((_, i) => i !== index));
  };

  // 添加空行
  const addEmptySite = () => {
    if (sites.length >= 10) {
      toast.error(t('toast_limit_error'));
      return;
    }
    setSites([...sites, { domain: '', platform: 'UPTIME', status: 'pending' }]);
  };

  // 🎯 核心功能 3: 批量提交
  const handleBatchSubmit = async () => {
    // 验证
    const validSites = sites.filter(s => s.domain.trim());
    if (validSites.length === 0) {
      toast.error(t('toast_batch_error'));
      return;
    }

    setIsSubmitting(true);
    setProgress(0);

    try {
      const response = await fetch('/api/soloboard/sites/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sites: validSites }),
      });

      const data = await response.json();

      if (response.ok) {
        // 更新每个站点的状态
        const updatedSites = sites.map((site, index) => {
          const result = data.results?.[index];
          if (!result) return site;
          
          return {
            ...site,
            status: result.status === 'success' ? 'success' : 'error',
            error: result.error,
          };
        });
        
        setSites(updatedSites);
        setProgress(100);
        
        toast.success(t('toast_success', { count: data.successful }));
        
        if (data.failed > 0) {
          toast.warning(`${data.failed} ${t('toast_batch_error')}`);
        }
        
        // 延迟关闭，让用户看到结果
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      } else {
        // 处理订阅限制错误
        if (response.status === 403) {
          toast.error(data.message || t('toast_limit_error'));
        } else {
          toast.error(data.error || t('toast_batch_error'));
        }
      }
    } catch (error) {
      console.error('Batch add error:', error);
      toast.error(t('toast_network_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const successCount = sites.filter(s => s.status === 'success').length;
  const errorCount = sites.filter(s => s.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
          <Zap className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* 批量粘贴提示 */}
      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              {t('quick_import_title')}
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t('quick_import_description')}
            </p>
          </div>
        </div>
      </div>

      {/* 批量配置区 */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-3">
        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
          {t('batch_config_title')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">{t('stripe_key_label')}</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder={t('stripe_key_placeholder')}
                value={batchApiKey.stripe}
                onChange={(e) => setBatchApiKey({ ...batchApiKey, stripe: e.target.value })}
                className="text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyApiKeyToAll(batchApiKey.stripe, 'stripe')}
                disabled={!batchApiKey.stripe}
              >
                {t('apply_button')}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t('ga4_property_label')}</Label>
            <div className="flex gap-2">
              <Input
                placeholder={t('ga4_property_placeholder')}
                value={batchApiKey.ga4}
                onChange={(e) => setBatchApiKey({ ...batchApiKey, ga4: e.target.value })}
                className="text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyApiKeyToAll(batchApiKey.ga4, 'ga4')}
                disabled={!batchApiKey.ga4}
              >
                {t('apply_button')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 站点列表 */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {sites.map((site, index) => (
          <SiteRow
            key={index}
            site={site}
            index={index}
            onUpdate={(updates) => updateSite(index, updates)}
            onDelete={() => deleteSite(index)}
            onPaste={index === 0 ? handleBatchPaste : undefined}
            disabled={isSubmitting}
          />
        ))}
      </div>

      {/* 添加按钮 */}
      {sites.length < 10 && (
        <Button
          variant="outline"
          onClick={addEmptySite}
          disabled={isSubmitting}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('add_row_button', { current: sites.length, max: 10 })}
        </Button>
      )}

      {/* 进度显示 */}
      {isSubmitting && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-center text-muted-foreground">
            {t('progress_text', { success: successCount, error: errorCount })}
          </p>
        </div>
      )}

      {/* 安全声明 & 提交 */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-100 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-blue-900 rounded-xl shadow-sm text-blue-600 dark:text-blue-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm">
              {t('security_title')}
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {t('security_description')}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('cancel_button')}
          </Button>
          <Button
            onClick={handleBatchSubmit}
            disabled={isSubmitting || sites.filter(s => s.domain.trim()).length === 0}
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('submitting_button')}
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                {t('submit_button', { count: sites.filter(s => s.domain.trim()).length })}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// 站点行组件
function SiteRow({
  site,
  index,
  onUpdate,
  onDelete,
  onPaste,
  disabled,
}: {
  site: BatchSite;
  index: number;
  onUpdate: (updates: Partial<BatchSite>) => void;
  onDelete: () => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  disabled?: boolean;
}) {
  const t = useTranslations('common.soloboard.batch_add');
  
  const statusIcons = {
    pending: <AlertCircle className="h-4 w-4 text-gray-400" />,
    validating: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
    success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    error: <XCircle className="h-4 w-4 text-red-500" />,
  };

  const platformLabels: Record<string, string> = {
    'UPTIME': 'Uptime',
    'GA4': 'GA4',
    'STRIPE': 'Stripe',
    'SHOPIFY': 'Shopify',
    'LEMON': 'Lemon',
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border">
      {/* 状态图标 */}
      <div className="flex-shrink-0">
        {statusIcons[site.status]}
      </div>

      {/* 域名输入 */}
      <div className="flex-1 min-w-0">
        <Input
          placeholder={index === 0 ? t('domain_placeholder') + " (paste list)" : t('domain_placeholder')}
          value={site.domain}
          onChange={(e) => onUpdate({ domain: e.target.value })}
          onPaste={onPaste}
          disabled={disabled}
          className="text-sm"
        />
        {site.error && (
          <p className="text-xs text-red-500 mt-1">{site.error}</p>
        )}
      </div>

      {/* 平台选择 */}
      <Select
        value={site.platform}
        onValueChange={(value: any) => onUpdate({ platform: value })}
        disabled={disabled}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="UPTIME">{platformLabels['UPTIME']}</SelectItem>
          <SelectItem value="GA4">{platformLabels['GA4']}</SelectItem>
          <SelectItem value="STRIPE">{platformLabels['STRIPE']}</SelectItem>
          <SelectItem value="SHOPIFY">{platformLabels['SHOPIFY']}</SelectItem>
          <SelectItem value="LEMON">{platformLabels['LEMON']}</SelectItem>
        </SelectContent>
      </Select>

      {/* 删除按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        disabled={disabled}
        className="flex-shrink-0"
      >
        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
      </Button>
    </div>
  );
}

