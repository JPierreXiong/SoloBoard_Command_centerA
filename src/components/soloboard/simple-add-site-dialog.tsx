/**
 * 简化的添加网站对话框
 * 移除 ShipAny 复杂流程，提供简单直观的添加体验
 */

'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Globe, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { UpgradePromptDialog } from './upgrade-prompt-dialog';

interface SimpleAddSiteDialogProps {
  onSuccess?: () => void;
}

export function SimpleAddSiteDialog({ onSuccess }: SimpleAddSiteDialogProps) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [limitInfo, setLimitInfo] = useState({
    currentPlan: 'Free',
    currentCount: 0,
    limit: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast.error('Please enter a website URL');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/soloboard/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || url,
          url: url,
          platform: 'UPTIME',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Website added successfully!');
        setUrl('');
        setName('');
        onSuccess?.();
      } else {
        // 处理订阅限制错误
        if (response.status === 403 && data.currentPlan) {
          setLimitInfo({
            currentPlan: data.currentPlan,
            currentCount: data.currentCount,
            limit: data.limit,
          });
          setShowUpgradeDialog(true);
          toast.error(data.message || 'Site limit reached');
        } else {
          toast.error(data.error || data.message || 'Failed to add website');
        }
      }
    } catch (error) {
      console.error('Failed to add site:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold">Add Website to Monitor</h3>
          <p className="text-sm text-muted-foreground">
            Enter your website URL and we'll start monitoring it for you
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">
              Website URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://your-website.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              We'll monitor uptime, performance, and SSL certificate
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Site Name <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="My Awesome Site"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Give it a friendly name for easy identification
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            We'll automatically monitor:
          </p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <CheckCircle2 className="h-4 w-4" />
              <span>Website uptime (is it online?)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <CheckCircle2 className="h-4 w-4" />
              <span>Response time (how fast?)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <CheckCircle2 className="h-4 w-4" />
              <span>SSL certificate status</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={loading || !url}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding Website...
            </>
          ) : (
            <>
              <Globe className="mr-2 h-4 w-4" />
              Add Website
            </>
          )}
        </Button>
      </form>

      {/* 升级提示对话框 */}
      <UpgradePromptDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        currentPlan={limitInfo.currentPlan}
        currentCount={limitInfo.currentCount}
        limit={limitInfo.limit}
      />
    </>
  );
}

