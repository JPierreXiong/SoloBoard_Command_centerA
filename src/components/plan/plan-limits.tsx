'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { AlertCircle, ArrowUpRight, Check, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import Link from 'next/link';

interface PlanLimitProps {
  planType: 'free' | 'base' | 'pro';
  currentUsage: number;
  maxLimit: number;
  resourceType: string;
  upgradeUrl?: string;
}

/**
 * 计划限制显示组件
 */
export function PlanLimit({
  planType,
  currentUsage,
  maxLimit,
  resourceType,
  upgradeUrl = '/pricing',
}: PlanLimitProps) {
  const percentage = (currentUsage / maxLimit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = currentUsage >= maxLimit;

  return (
    <Card className={isAtLimit ? 'border-red-500' : isNearLimit ? 'border-yellow-500' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {resourceType} Usage
          </CardTitle>
          <Badge variant={planType === 'pro' ? 'default' : planType === 'base' ? 'secondary' : 'outline'}>
            {planType.toUpperCase()}
          </Badge>
        </div>
        <CardDescription>
          {currentUsage} of {maxLimit} {resourceType.toLowerCase()} used
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={percentage} className="h-2" />
        
        {isAtLimit && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Limit Reached</AlertTitle>
            <AlertDescription>
              You've reached your {resourceType.toLowerCase()} limit. Upgrade to add more.
            </AlertDescription>
          </Alert>
        )}
        
        {isNearLimit && !isAtLimit && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Approaching Limit</AlertTitle>
            <AlertDescription>
              You're using {percentage.toFixed(0)}% of your {resourceType.toLowerCase()} limit.
            </AlertDescription>
          </Alert>
        )}
        
        {(isAtLimit || isNearLimit) && planType !== 'pro' && (
          <Link href={upgradeUrl}>
            <Button className="w-full mt-4" variant={isAtLimit ? 'default' : 'outline'}>
              Upgrade Plan
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 功能锁定组件
 */
interface FeatureLockProps {
  featureName: string;
  currentPlan: 'free' | 'base' | 'pro';
  requiredPlan: 'base' | 'pro';
  description?: string;
}

export function FeatureLock({
  featureName,
  currentPlan,
  requiredPlan,
  description,
}: FeatureLockProps) {
  const planLevels = { free: 0, base: 1, pro: 2 };
  const hasAccess = planLevels[currentPlan] >= planLevels[requiredPlan];

  if (hasAccess) {
    return null;
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle className="text-lg">
              {featureName} - {requiredPlan.toUpperCase()} Feature
            </CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <Link href="/pricing">
              <Button className="w-full">
                Upgrade to {requiredPlan.toUpperCase()}
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      <div className="opacity-50 pointer-events-none">
        {/* 被锁定的内容 */}
      </div>
    </div>
  );
}

/**
 * 计划功能对比表
 */
interface PlanComparisonProps {
  currentPlan: 'free' | 'base' | 'pro';
}

export function PlanComparison({ currentPlan }: PlanComparisonProps) {
  const features = [
    { name: 'Projects', free: '1', base: '5', pro: '10' },
    { name: 'Data Sources', free: '3', base: 'All', pro: 'All' },
    { name: 'Auto-refresh', free: '48h', base: '6h', pro: '60min' },
    { name: 'Data History', free: '7 days', base: '1 year', pro: 'Permanent' },
    { name: 'Advanced Analytics', free: false, base: true, pro: true },
    { name: 'Email Alerts', free: false, base: true, pro: true },
    { name: 'White-label', free: false, base: false, pro: true },
    { name: 'Team Collaboration', free: false, base: false, pro: true },
    { name: 'API Access', free: false, base: false, pro: true },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Feature</th>
            <th className="text-center p-4">Free</th>
            <th className="text-center p-4">Base</th>
            <th className="text-center p-4">Pro</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr key={index} className="border-b">
              <td className="p-4 font-medium">{feature.name}</td>
              <td className="text-center p-4">
                {typeof feature.free === 'boolean' ? (
                  feature.free ? <Check className="inline h-5 w-5 text-green-500" /> : <X className="inline h-5 w-5 text-red-500" />
                ) : (
                  feature.free
                )}
              </td>
              <td className="text-center p-4">
                {typeof feature.base === 'boolean' ? (
                  feature.base ? <Check className="inline h-5 w-5 text-green-500" /> : <X className="inline h-5 w-5 text-red-500" />
                ) : (
                  feature.base
                )}
              </td>
              <td className="text-center p-4">
                {typeof feature.pro === 'boolean' ? (
                  feature.pro ? <Check className="inline h-5 w-5 text-green-500" /> : <X className="inline h-5 w-5 text-red-500" />
                ) : (
                  feature.pro
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * 升级提示横幅
 */
interface UpgradeBannerProps {
  currentPlan: 'free' | 'base';
  message: string;
}

export function UpgradeBanner({ currentPlan, message }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(`upgrade-banner-${currentPlan}-dismissed`);
    if (isDismissed) {
      setDismissed(true);
    }
  }, [currentPlan]);

  const handleDismiss = () => {
    localStorage.setItem(`upgrade-banner-${currentPlan}-dismissed`, 'true');
    setDismissed(true);
  };

  if (dismissed || currentPlan === 'pro') {
    return null;
  }

  return (
    <Alert className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Upgrade Available</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        <div className="flex gap-2">
          <Link href="/pricing">
            <Button size="sm">
              View Plans
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

