/**
 * 升级提示对话框
 * 当用户达到站点限制时显示
 */

'use client';

import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';

interface UpgradePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: string;
  currentCount: number;
  limit: number;
}

export function UpgradePromptDialog({
  open,
  onOpenChange,
  currentPlan,
  currentCount,
  limit,
}: UpgradePromptDialogProps) {
  const t = useTranslations('soloboard.upgrade_dialog');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {t('title', { plan: currentPlan, limit })}
          </DialogTitle>
          <DialogDescription className="text-base">
            {t('description', { plan: currentPlan, limit })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 当前状态 */}
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                {t('current_limit')}
              </h3>
            </div>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {t('usage', { current: currentCount, limit })}
            </p>
            <div className="mt-2 w-full bg-yellow-200 dark:bg-yellow-900 rounded-full h-2">
              <div
                className="bg-yellow-600 dark:bg-yellow-500 h-2 rounded-full transition-all"
                style={{ width: `${(currentCount / limit) * 100}%` }}
              />
            </div>
          </div>

          {/* 套餐对比 */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Base Plan */}
            <Card className="border-2 border-blue-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-3 py-1 rounded-bl-lg">
                {t('recommended')}
              </div>
              <CardHeader>
                <CardTitle className="text-xl">{t('base_plan.title')}</CardTitle>
                <CardDescription>{t('base_plan.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {t('base_plan.price')}
                    <span className="text-lg font-normal text-muted-foreground">
                      {t('base_plan.period')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('base_plan.billing')}
                  </p>
                </div>

                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>{t('base_plan.features.sites')}</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{t('base_plan.features.monitoring')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{t('base_plan.features.email')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{t('base_plan.features.stats')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{t('base_plan.features.credits')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{t('base_plan.features.history')}</span>
                  </li>
                </ul>

                <Button className="w-full" size="lg" asChild>
                  <a href="/pricing">
                    {t('upgrade_now')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-purple-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs px-3 py-1 rounded-bl-lg">
                {t('most_powerful')}
              </div>
              <CardHeader>
                <CardTitle className="text-xl">{t('pro_plan.title')}</CardTitle>
                <CardDescription>{t('pro_plan.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {t('pro_plan.price')}
                    <span className="text-lg font-normal text-muted-foreground">
                      {t('pro_plan.period')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('pro_plan.billing')}
                  </p>
                </div>

                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>{t('pro_plan.features.sites')}</strong> 🚀</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{t('pro_plan.features.all_base')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{t('pro_plan.features.advanced')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{t('pro_plan.features.api')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{t('pro_plan.features.credits')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{t('pro_plan.features.history')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{t('pro_plan.features.support')}</span>
                  </li>
                </ul>

                <Button className="w-full" size="lg" variant="outline" asChild>
                  <a href="/pricing">
                    {t('upgrade_now')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 对比表格 */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-semibold">{t('comparison.feature')}</th>
                  <th className="text-center p-3 font-semibold">{t('comparison.free')}</th>
                  <th className="text-center p-3 font-semibold bg-blue-50 dark:bg-blue-950">
                    {t('comparison.base')}
                  </th>
                  <th className="text-center p-3 font-semibold bg-purple-50 dark:bg-purple-950">
                    {t('comparison.pro')}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3">{t('comparison.sites')}</td>
                  <td className="text-center p-3">1</td>
                  <td className="text-center p-3 bg-blue-50 dark:bg-blue-950 font-semibold">5</td>
                  <td className="text-center p-3 bg-purple-50 dark:bg-purple-950 font-semibold">∞</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">{t('comparison.email_alerts')}</td>
                  <td className="text-center p-3">❌</td>
                  <td className="text-center p-3 bg-blue-50 dark:bg-blue-950">✅</td>
                  <td className="text-center p-3 bg-purple-50 dark:bg-purple-950">✅</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">{t('comparison.api_access')}</td>
                  <td className="text-center p-3">❌</td>
                  <td className="text-center p-3 bg-blue-50 dark:bg-blue-950">❌</td>
                  <td className="text-center p-3 bg-purple-50 dark:bg-purple-950">✅</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">{t('comparison.data_history')}</td>
                  <td className="text-center p-3">3 {t('comparison.days')}</td>
                  <td className="text-center p-3 bg-blue-50 dark:bg-blue-950">7 {t('comparison.days')}</td>
                  <td className="text-center p-3 bg-purple-50 dark:bg-purple-950">90 {t('comparison.days')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 底部提示 */}
          <div className="text-center text-sm text-muted-foreground">
            <p>{t('footer')}</p>
            <p className="mt-1">
              {t('contact')} <a href="/contact" className="text-primary hover:underline">{t('contact_us')}</a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

