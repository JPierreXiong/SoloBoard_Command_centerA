/**
 * Sync Progress Dialog
 * 同步进度对话框
 * 
 * 功能：
 * 1. 实时显示同步进度
 * 2. 分步骤展示（Stripe、GA4、Uptime、Database）
 * 3. 每个步骤的状态指示器
 * 4. 错误信息展示
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Progress } from '@/shared/components/ui/progress';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  DollarSign,
  Users,
  Globe,
  Database,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface SyncStep {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  data?: any;
}

interface SyncProgressDialogProps {
  siteId: string;
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const STEPS = [
  { id: 'stripe', label: 'Stripe Revenue', icon: DollarSign },
  { id: 'ga4', label: 'GA4 Visitors', icon: Users },
  { id: 'uptime', label: 'Website Status', icon: Globe },
  { id: 'database', label: 'Update Database', icon: Database },
];

export function SyncProgressDialog({ siteId, open, onClose, onComplete }: SyncProgressDialogProps) {
  const [steps, setSteps] = useState<Record<string, SyncStep>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      // 重置状态
      setSteps({});
      setIsComplete(false);
      setProgress(0);
      return;
    }

    // 开始同步
    startSync();
  }, [open, siteId]);

  const startSync = async () => {
    try {
      const response = await fetch(`/api/soloboard/sites/${siteId}/sync-stream`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6)) as SyncStep;
            
            setSteps(prev => ({
              ...prev,
              [data.step]: data,
            }));

            // 更新进度
            if (data.step === 'complete') {
              setProgress(100);
              setIsComplete(true);
              setTimeout(() => {
                onComplete();
                onClose();
              }, 2000);
            } else {
              const completedSteps = Object.values(steps).filter(
                s => s.status === 'success' || s.status === 'error'
              ).length;
              setProgress((completedSteps / STEPS.length) * 100);
            }
          }
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSteps(prev => ({
        ...prev,
        error: {
          step: 'error',
          status: 'error',
          message: error instanceof Error ? error.message : 'Sync failed',
        },
      }));
    }
  };

  const getStepStatus = (stepId: string): SyncStep['status'] => {
    return steps[stepId]?.status || 'pending';
  };

  const getStepMessage = (stepId: string): string => {
    return steps[stepId]?.message || 'Waiting...';
  };

  const StatusIcon = ({ status }: { status: SyncStep['status'] }) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Syncing Data</DialogTitle>
          <DialogDescription>
            Please wait while we sync your website data...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              {isComplete ? 'Sync completed!' : `${Math.round(progress)}% complete`}
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {STEPS.map((step) => {
              const status = getStepStatus(step.id);
              const message = getStepMessage(step.id);
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                    status === 'running' && 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
                    status === 'success' && 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
                    status === 'error' && 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
                    status === 'pending' && 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                  )}
                >
                  <Icon className={cn(
                    'h-5 w-5 mt-0.5 flex-shrink-0',
                    status === 'running' && 'text-blue-500',
                    status === 'success' && 'text-green-500',
                    status === 'error' && 'text-red-500',
                    status === 'pending' && 'text-gray-400'
                  )} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{step.label}</p>
                      <StatusIcon status={status} />
                    </div>
                    <p className={cn(
                      'text-xs mt-1',
                      status === 'error' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                    )}>
                      {message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error Message */}
          {steps.error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {steps.error.message}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

