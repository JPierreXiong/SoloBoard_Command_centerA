/**
 * Site Settings Dialog
 * 网站设置对话框
 * 
 * 功能：
 * 1. 编辑网站基本信息（名称、域名）
 * 2. 配置/修改 API Keys（Stripe、GA4、Shopify）
 * 3. 测试 API 连接
 * 4. 显示连接状态指示器
 * 5. 安全的 API Key 输入（遮蔽/显示切换）
 * 6. Webhook URL 展示和复制
 * 7. 删除网站（带二次确认）
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
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
import {
  Settings,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Trash2,
  AlertTriangle,
  Link as LinkIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface SiteSettingsDialogProps {
  siteId: string;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface SiteConfig {
  name: string;
  domain: string;
  stripeKey?: string;
  ga4PropertyId?: string;
  shopifyDomain?: string;
  shopifyAccessToken?: string;
  lemonApiKey?: string;
  syncInterval: number;
}

interface ConnectionStatus {
  stripe: 'connected' | 'disconnected' | 'error' | 'testing';
  ga4: 'connected' | 'disconnected' | 'error' | 'testing';
  shopify: 'connected' | 'disconnected' | 'error' | 'testing';
}

export function SiteSettingsDialog({ siteId, open, onClose, onSave }: SiteSettingsDialogProps) {
  const t = useTranslations('common.soloboard');
  
  const [config, setConfig] = useState<SiteConfig>({
    name: '',
    domain: '',
    syncInterval: 3600,
  });
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    stripe: 'disconnected',
    ga4: 'disconnected',
    shopify: 'disconnected',
  });
  
  const [showApiKeys, setShowApiKeys] = useState({
    stripe: false,
    ga4: false,
    shopify: false,
    lemon: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // 获取站点配置
  useEffect(() => {
    if (open && siteId) {
      fetchSiteConfig();
    }
  }, [open, siteId]);

  const fetchSiteConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/soloboard/sites/${siteId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch site config');
      }

      const data = await response.json();
      setConfig({
        name: data.name || '',
        domain: data.domain || '',
        stripeKey: data.stripeKey ? maskApiKey(data.stripeKey) : '',
        ga4PropertyId: data.ga4PropertyId || '',
        shopifyDomain: data.shopifyDomain || '',
        shopifyAccessToken: data.shopifyAccessToken ? maskApiKey(data.shopifyAccessToken) : '',
        lemonApiKey: data.lemonApiKey ? maskApiKey(data.lemonApiKey) : '',
        syncInterval: data.syncInterval || 3600,
      });

      // 设置连接状态
      setConnectionStatus({
        stripe: data.stripeKey ? 'connected' : 'disconnected',
        ga4: data.ga4PropertyId ? 'connected' : 'disconnected',
        shopify: data.shopifyAccessToken ? 'connected' : 'disconnected',
      });
    } catch (error) {
      toast.error('Failed to load site settings');
    } finally {
      setIsLoading(false);
    }
  };

  // 遮蔽 API Key（只显示前4位和后4位）
  const maskApiKey = (key: string): string => {
    if (!key || key.length < 8) return key;
    return `${key.substring(0, 4)}${'*'.repeat(Math.max(8, key.length - 8))}${key.substring(key.length - 4)}`;
  };

  // 测试 API 连接
  const testConnection = async (platform: 'stripe' | 'ga4' | 'shopify') => {
    try {
      setConnectionStatus(prev => ({ ...prev, [platform]: 'testing' }));
      
      const response = await fetch(`/api/soloboard/sites/${siteId}/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          apiKey: platform === 'stripe' ? config.stripeKey : 
                  platform === 'ga4' ? config.ga4PropertyId :
                  config.shopifyAccessToken,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setConnectionStatus(prev => ({ ...prev, [platform]: 'connected' }));
        toast.success(`${platform.toUpperCase()} connection successful`);
      } else {
        setConnectionStatus(prev => ({ ...prev, [platform]: 'error' }));
        toast.error(data.message || `${platform.toUpperCase()} connection failed`);
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, [platform]: 'error' }));
      toast.error('Connection test failed');
    }
  };

  // 保存设置
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/soloboard/sites/${siteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Settings saved successfully');
      onSave();
      onClose();
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // 删除网站
  const handleDelete = async () => {
    if (deleteConfirmText !== config.domain) {
      toast.error('Domain name does not match');
      return;
    }

    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/soloboard/sites/${siteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete site');
      }

      toast.success('Website deleted successfully');
      setDeleteDialogOpen(false);
      onSave();
      onClose();
    } catch (error) {
      toast.error('Failed to delete website');
    } finally {
      setIsDeleting(false);
    }
  };

  // 复制 Webhook URL
  const copyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin}/api/webhooks/stripe/${siteId}`;
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied to clipboard');
  };

  // 连接状态指示器
  const StatusIndicator = ({ status }: { status: ConnectionStatus[keyof ConnectionStatus] }) => {
    const statusConfig = {
      connected: { color: 'bg-green-500', icon: CheckCircle2, label: 'Connected' },
      disconnected: { color: 'bg-gray-400', icon: XCircle, label: 'Not configured' },
      error: { color: 'bg-red-500', icon: XCircle, label: 'Error' },
      testing: { color: 'bg-blue-500', icon: Loader2, label: 'Testing...' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        <Icon className={`h-4 w-4 ${status === 'testing' ? 'animate-spin' : ''}`} />
        <span className="text-xs text-muted-foreground">{config.label}</span>
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Site Settings
            </DialogTitle>
            <DialogDescription>
              Configure your website monitoring and integrations
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Basic Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="site-name">Site Name</Label>
                  <Input
                    id="site-name"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    placeholder="My Awesome Website"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">Domain (Read-only)</Label>
                  <Input
                    id="domain"
                    value={config.domain}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* Integrations */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Integrations</h3>

                {/* Stripe */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label>Stripe API Key</Label>
                      <StatusIndicator status={connectionStatus.stripe} />
                    </div>
                    {config.stripeKey && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testConnection('stripe')}
                        disabled={connectionStatus.stripe === 'testing'}
                      >
                        Test
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      type={showApiKeys.stripe ? 'text' : 'password'}
                      value={config.stripeKey || ''}
                      onChange={(e) => setConfig({ ...config, stripeKey: e.target.value })}
                      placeholder="sk_live_..."
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setShowApiKeys({ ...showApiKeys, stripe: !showApiKeys.stripe })}
                    >
                      {showApiKeys.stripe ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  {config.stripeKey && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs">
                      <LinkIcon className="h-3 w-3" />
                      <span className="flex-1 font-mono text-xs truncate">
                        {window.location.origin}/api/webhooks/stripe/{siteId}
                      </span>
                      <Button size="sm" variant="ghost" onClick={copyWebhookUrl} className="h-6 px-2">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* GA4 */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label>GA4 Property ID</Label>
                      <StatusIndicator status={connectionStatus.ga4} />
                    </div>
                    {config.ga4PropertyId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testConnection('ga4')}
                        disabled={connectionStatus.ga4 === 'testing'}
                      >
                        Test
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      type={showApiKeys.ga4 ? 'text' : 'password'}
                      value={config.ga4PropertyId || ''}
                      onChange={(e) => setConfig({ ...config, ga4PropertyId: e.target.value })}
                      placeholder="G-XXXXXXXXXX"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setShowApiKeys({ ...showApiKeys, ga4: !showApiKeys.ga4 })}
                    >
                      {showApiKeys.ga4 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Shopify */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label>Shopify</Label>
                      <StatusIndicator status={connectionStatus.shopify} />
                    </div>
                    {config.shopifyAccessToken && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testConnection('shopify')}
                        disabled={connectionStatus.shopify === 'testing'}
                      >
                        Test
                      </Button>
                    )}
                  </div>
                  
                  {!config.shopifyAccessToken ? (
                    <Button variant="outline" className="w-full">
                      + Add Shopify Integration
                    </Button>
                  ) : (
                    <>
                      <Input
                        value={config.shopifyDomain || ''}
                        onChange={(e) => setConfig({ ...config, shopifyDomain: e.target.value })}
                        placeholder="your-store.myshopify.com"
                      />
                      <div className="flex gap-2">
                        <Input
                          type={showApiKeys.shopify ? 'text' : 'password'}
                          value={config.shopifyAccessToken || ''}
                          onChange={(e) => setConfig({ ...config, shopifyAccessToken: e.target.value })}
                          placeholder="shpat_..."
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setShowApiKeys({ ...showApiKeys, shopify: !showApiKeys.shopify })}
                        >
                          {showApiKeys.shopify ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Monitoring */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Monitoring</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="sync-interval">Sync Interval</Label>
                  <Select
                    value={config.syncInterval.toString()}
                    onValueChange={(value) => setConfig({ ...config, syncInterval: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3600">1 hour</SelectItem>
                      <SelectItem value="21600">6 hours</SelectItem>
                      <SelectItem value="86400">24 hours</SelectItem>
                      <SelectItem value="172800">48 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="space-y-4 pt-4 border-t border-destructive/20">
                <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Danger Zone
                </h3>
                
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Website
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isLoading}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Website
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This action cannot be undone. This will permanently delete your website
                and all associated data.
              </p>
              <div className="space-y-2">
                <Label htmlFor="delete-confirm">
                  Type <span className="font-mono font-bold">{config.domain}</span> to confirm:
                </Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={config.domain}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || deleteConfirmText !== config.domain}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Website'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


