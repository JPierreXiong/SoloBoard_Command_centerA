/**
 * SoloBoard - 顶部统计卡片组件
 * 
 * 设计理念：
 * - 全局概览：所有站点的汇总数据
 * - 信号灯色：绿色（收入）、蓝色（流量）、紫色（站点）
 * - 大字报：核心数字一目了然
 */

'use client';

import { Card, CardContent } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  color?: 'blue' | 'green' | 'purple' | 'yellow';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  className,
}: StatCardProps) {
  // 颜色配置
  const colorConfig = {
    blue: {
      border: 'border-blue-500/50',
      bg: 'bg-blue-500/10',
      icon: 'text-blue-500',
      glow: 'shadow-blue-500/20',
    },
    green: {
      border: 'border-green-500/50',
      bg: 'bg-green-500/10',
      icon: 'text-green-500',
      glow: 'shadow-green-500/20',
    },
    purple: {
      border: 'border-purple-500/50',
      bg: 'bg-purple-500/10',
      icon: 'text-purple-500',
      glow: 'shadow-purple-500/20',
    },
    yellow: {
      border: 'border-yellow-500/50',
      bg: 'bg-yellow-500/10',
      icon: 'text-yellow-500',
      glow: 'shadow-yellow-500/20',
    },
  };

  const currentColor = colorConfig[color];

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg',
        currentColor.border,
        currentColor.glow,
        className
      )}
    >
      {/* 背景装饰 */}
      <div className={cn('absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20', currentColor.bg)} />

      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            {/* 标题 */}
            <p className="text-sm font-medium text-muted-foreground">{title}</p>

            {/* 核心数值 */}
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
              {subtitle && (
                <span className="text-sm text-muted-foreground">{subtitle}</span>
              )}
            </div>

            {/* 趋势信息 */}
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                <span
                  className={cn(
                    'font-medium',
                    trend.value > 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend.value > 0 ? '+' : ''}
                  {trend.value}%
                </span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>

          {/* 图标 */}
          <div className={cn('p-3 rounded-lg', currentColor.bg)}>
            <Icon className={cn('w-6 h-6', currentColor.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



