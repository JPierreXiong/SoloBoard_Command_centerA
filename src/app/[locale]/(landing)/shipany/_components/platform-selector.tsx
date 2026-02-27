/**
 * Platform Selector Component
 * 平台选择组件 - 显示可用的监控平台
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { 
  Globe, 
  CreditCard, 
  BarChart3,
  Citrus,
  ShoppingBag,
  CheckCircle2,
  Zap,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

// 平台图标映射
const PLATFORM_ICONS = {
  uptime: Globe,
  ga4: BarChart3,
  stripe: CreditCard,
  lemon: Citrus,
  shopify: ShoppingBag,
};

// 平台颜色映射
const PLATFORM_COLORS = {
  uptime: 'from-green-500 to-emerald-500',
  ga4: 'from-orange-500 to-red-500',
  stripe: 'from-purple-500 to-pink-500',
  lemon: 'from-yellow-500 to-orange-500',
  shopify: 'from-green-600 to-teal-600',
};

// 平台配置
const PLATFORMS = ['uptime', 'ga4', 'stripe', 'lemon', 'shopify'] as const;

type Platform = typeof PLATFORMS[number];

const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  hard: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

const SETUP_TIMES = {
  uptime: '30s',
  ga4: '10min',
  stripe: '3min',
  lemon: '3min',
  shopify: '5min',
};

const DIFFICULTIES: Record<Platform, 'easy' | 'medium' | 'hard'> = {
  uptime: 'easy',
  ga4: 'hard',
  stripe: 'medium',
  lemon: 'medium',
  shopify: 'medium',
};

export function PlatformSelector() {
  const t = useTranslations('shipany');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
    // TODO: 导航到配置页面
    console.log('Selected platform:', platform);
  };

  return (
    <div className="space-y-8">
      {/* 步骤指示器 */}
      <div className="flex items-center justify-center gap-4">
        <StepIndicator 
          number={1} 
          label={t('steps.select_platform')} 
          active={true} 
          completed={false}
        />
        <div className="h-px w-12 bg-border" />
        <StepIndicator 
          number={2} 
          label={t('steps.configure')} 
          active={false} 
          completed={false}
        />
        <div className="h-px w-12 bg-border" />
        <StepIndicator 
          number={3} 
          label={t('steps.confirm')} 
          active={false} 
          completed={false}
        />
      </div>

      {/* 平台卡片网格 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto"
      >
        {PLATFORMS.map((platform) => (
          <PlatformCard
            key={platform}
            platform={platform}
            onSelect={() => handlePlatformSelect(platform)}
            t={t}
          />
        ))}
      </motion.div>
    </div>
  );
}

// 平台卡片组件
function PlatformCard({ 
  platform, 
  onSelect,
  t
}: { 
  platform: Platform;
  onSelect: () => void;
  t: any;
}) {
  const Icon = PLATFORM_ICONS[platform];
  const color = PLATFORM_COLORS[platform];
  const difficulty = DIFFICULTIES[platform];
  const setupTime = SETUP_TIMES[platform];
  
  // 获取平台特性
  const features = Object.keys(t.raw(`platforms.${platform}.features`)).map(key => 
    t(`platforms.${platform}.features.${key}`)
  );

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all h-full flex flex-col"
        onClick={onSelect}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className={DIFFICULTY_COLORS[difficulty]}>
                {t(`difficulty.${difficulty}`)}
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {t('labels.free')}
              </Badge>
            </div>
          </div>
          
          <CardTitle className="mt-4">{t(`platforms.${platform}.name`)}</CardTitle>
          <CardDescription>{t(`platforms.${platform}.description`)}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 flex-1 flex flex-col">
          {/* 功能列表 */}
          <div className="space-y-2 flex-1">
            {features.slice(0, 4).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
            {features.length > 4 && (
              <p className="text-xs text-muted-foreground">
                {t('labels.more_features', { count: features.length - 4 })}
              </p>
            )}
          </div>

          {/* 设置时间 */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
            <Zap className="h-4 w-4" />
            <span>{t('labels.setup_time')}: {setupTime}</span>
          </div>

          {/* 选择按钮 */}
          <Button className="w-full mt-4" onClick={onSelect}>
            {t('actions.next')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// 步骤指示器组件
function StepIndicator({ 
  number, 
  label, 
  active, 
  completed 
}: { 
  number: number; 
  label: string; 
  active: boolean; 
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={`
          w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
          ${completed ? 'bg-green-600 text-white' : ''}
          ${active ? 'bg-primary text-primary-foreground' : ''}
          ${!active && !completed ? 'bg-muted text-muted-foreground' : ''}
        `}
      >
        {completed ? <CheckCircle2 className="h-5 w-5" /> : number}
      </div>
      <span className="text-xs font-medium text-center max-w-[80px]">{label}</span>
    </div>
  );
}

