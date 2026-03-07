/**
 * Tracking Script 对话框
 * 显示和管理网站的 JS Tracking 脚本
 * 
 * 功能:
 * 1. 显示 tracking script
 * 2. 一键复制代码
 * 3. 安装说明
 * 4. 启用/禁用开关
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Code, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';

interface TrackingScriptDialogProps {
  siteId: string;
  siteName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrackingScriptDialog({
  siteId,
  siteName,
  open,
  onOpenChange,
}: TrackingScriptDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // 获取 tracking script
  useEffect(() => {
    if (open) {
      fetchTrackingScript();
    }
  }, [open, siteId]);

  const fetchTrackingScript = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/soloboard/sites/${siteId}/tracking-script`);
      const data = await response.json();
      
      if (data.success) {
        setTrackingData(data);
      } else {
        toast.error('Failed to load tracking script');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // 复制代码
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('代码已复制到剪贴板');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('复制失败，请手动复制');
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!trackingData) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Tracking Script - {siteName}
          </DialogTitle>
          <DialogDescription>
            将此脚本添加到您的网站以追踪访客数据
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="script" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="script">脚本代码</TabsTrigger>
            <TabsTrigger value="instructions">安装说明</TabsTrigger>
            <TabsTrigger value="stats">统计信息</TabsTrigger>
          </TabsList>

          {/* 脚本代码 */}
          <TabsContent value="script" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="success">已启用</Badge>
                <span className="text-sm text-muted-foreground">
                  Script ID: {trackingData.tracking.scriptId}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(trackingData.tracking.script)}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    复制代码
                  </>
                )}
              </Button>
            </div>

            {/* 代码显示 */}
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                <code>{trackingData.tracking.script}</code>
              </pre>
            </div>

            {/* 性能信息 */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">脚本大小</p>
                <p className="text-sm font-semibold">
                  {(trackingData.stats.estimatedSize / 1024).toFixed(2)} KB
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">加载时间</p>
                <p className="text-sm font-semibold">{trackingData.stats.loadTime}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">性能影响</p>
                <p className="text-sm font-semibold text-green-600">
                  {trackingData.stats.impact}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* 安装说明 */}
          <TabsContent value="instructions" className="space-y-6">
            {/* Step 1 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="font-semibold">
                  {trackingData.tracking.instructions.step1.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground ml-10">
                {trackingData.tracking.instructions.step1.description}
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="font-semibold">
                  {trackingData.tracking.instructions.step2.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground ml-10">
                {trackingData.tracking.instructions.step2.description}
              </p>
              <div className="ml-10 space-y-2">
                <p className="text-sm font-medium">常见位置：</p>
                <ul className="space-y-1">
                  {trackingData.tracking.instructions.step2.locations.map((location: string, index: number) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {location}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="font-semibold">
                  {trackingData.tracking.instructions.step3.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground ml-10">
                {trackingData.tracking.instructions.step3.description}
              </p>
            </div>

            {/* 提示 */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                    重要提示
                  </h4>
                  <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                    <li>• 脚本应该放在 &lt;/body&gt; 标签之前以获得最佳性能</li>
                    <li>• 脚本会自动追踪页面浏览和 SPA 路由变化</li>
                    <li>• 数据通常在 5-10 分钟内显示在 Dashboard</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 统计信息 */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Script ID</p>
                <p className="font-mono text-sm">{trackingData.tracking.scriptId}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">状态</p>
                <Badge variant="success">已启用</Badge>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">脚本大小</p>
                <p className="font-semibold">
                  {(trackingData.stats.estimatedSize / 1024).toFixed(2)} KB
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">性能影响</p>
                <p className="font-semibold text-green-600">极小</p>
              </div>
            </div>

            {/* 功能列表 */}
            <div className="space-y-2">
              <h3 className="font-semibold">追踪功能</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  页面浏览量 (Page Views)
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  唯一访客 (Unique Visitors)
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  来源追踪 (Referrer Tracking)
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  SPA 路由变化 (Single Page App Support)
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  设备信息 (Screen Size, Language)
                </li>
              </ul>
            </div>

            {/* 文档链接 */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="font-semibold mb-2">需要帮助？</h3>
              <a
                href="/docs/tracking-script"
                target="_blank"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                查看完整文档
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </TabsContent>
        </Tabs>

        {/* 底部操作 */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          <Button
            onClick={() => handleCopy(trackingData.tracking.script)}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            复制脚本代码
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


