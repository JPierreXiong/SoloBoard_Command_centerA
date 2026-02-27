/**
 * Add Site Flow - 融合版 3 步流程
 * 方案2的"魔法感"流程 + 方案1的"安全感"文案
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import { 
  Globe, 
  Lock, 
  CheckCircle2, 
  Loader2,
  CreditCard,
  ShoppingBag,
  Citrus,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface ProbeResult {
  status: 'online' | 'offline';
  online: boolean;
  logoUrl: string;
  domain: string;
  responseTime?: number;
  message: string;
}

interface PlatformConfig {
  id: string;
  name: string;
  icon: any;
  color: string;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  helpUrl: string;
}

const PAYMENT_PLATFORMS: PlatformConfig[] = [
  {
    id: 'creem',
    name: 'Creem',
    icon: CreditCard,
    color: 'from-blue-500 to-indigo-500',
    apiKeyLabel: 'Creem API Key',
    apiKeyPlaceholder: 'creem_...',
    helpUrl: 'https://creem.io/docs',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    icon: CreditCard,
    color: 'from-purple-500 to-pink-500',
    apiKeyLabel: 'Stripe Secret Key',
    apiKeyPlaceholder: 'sk_live_...',
    helpUrl: 'https://stripe.com/docs/keys',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    icon: ShoppingBag,
    color: 'from-green-600 to-teal-600',
    apiKeyLabel: 'Shopify Access Token',
    apiKeyPlaceholder: 'shpat_...',
    helpUrl: 'https://shopify.dev/docs/api/admin-rest',
  },
  {
    id: 'lemon',
    name: 'Lemon Squeezy',
    icon: Citrus,
    color: 'from-yellow-500 to-orange-500',
    apiKeyLabel: 'Lemon Squeezy API Key',
    apiKeyPlaceholder: 'lemon_...',
    helpUrl: 'https://docs.lemonsqueezy.com/api',
  },
];

export function AddSiteFlow() {
  const t = useTranslations('shipany');
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [isProbing, setIsProbing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 1: Domain only (simplified)
  const [domain, setDomain] = useState('');
  const [probeResult, setProbeResult] = useState<ProbeResult | null>(null);
  
  // Step 2: Payment platforms
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [otherPlatform, setOtherPlatform] = useState('');
  
  // Step 3: Analytics
  const [enableGA4, setEnableGA4] = useState(false);
  const [ga4PropertyId, setGA4PropertyId] = useState('');

  // Step 1: 探测域名
  const handleDomainProbe = async () => {
    if (!domain.trim()) return;
    
    setIsProbing(true);
    try {
      const response = await fetch(`/api/soloboard/probe?domain=${encodeURIComponent(domain)}`);
      const data = await response.json();
      setProbeResult(data);
      
      if (data.online) {
        setTimeout(() => setStep(2), 800);
      }
    } catch (error) {
      console.error('Probe failed:', error);
    } finally {
      setIsProbing(false);
    }
  };

  // Step 2: 切换平台选择
  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  // 提交表单
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/soloboard/sites/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: probeResult?.domain, // 使用域名作为名称
          domain: probeResult?.domain,
          logoUrl: probeResult?.logoUrl,
          platforms: selectedPlatforms,
          apiKeys,
          otherPlatform,
          enableGA4,
          ga4PropertyId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStep(4); // 完成页
        // 2秒后跳转到 Dashboard
        setTimeout(() => router.push('/soloboard'), 2000);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add site');
      }
    } catch (error) {
      console.error('Submit failed:', error);
      alert(`Failed to add website: ${error instanceof Error ? error.message : 'Please try again'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* 进度指示器 */}
      <div className="mb-8 flex items-center justify-center gap-2">
        <Badge variant={step >= 1 ? 'default' : 'outline'} className="gap-1">
          <Zap className="h-3 w-3" />
          {t('setup_time')}
        </Badge>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: 输入域名（简化版 - 只要 URL） */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Globe className="h-6 w-6" />
                  {t('step1.title')}
                </CardTitle>
                <CardDescription className="text-base">
                  {t('step1.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 网站 URL */}
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder={t('step1.url_placeholder')}
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDomainProbe()}
                    className="text-lg h-14"
                    disabled={isProbing}
                  />
                </div>

                {/* 探测结果 */}
                {probeResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg flex items-center gap-3 ${
                      probeResult.online 
                        ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' 
                        : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                    }`}
                  >
                    {probeResult.logoUrl && (
                      <img 
                        src={probeResult.logoUrl} 
                        alt="Site logo" 
                        className="w-10 h-10 rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <p className={`font-semibold ${probeResult.online ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        {probeResult.message}
                      </p>
                      <p className="text-sm text-muted-foreground">{probeResult.domain}</p>
                    </div>
                    {probeResult.online && <CheckCircle2 className="h-6 w-6 text-green-600" />}
                  </motion.div>
                )}

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{t('step1.we_will_monitor')}:</p>
                  <ul className="space-y-1 ml-4">
                    <li>• {t('step1.monitor_revenue')}</li>
                    <li>• {t('step1.monitor_traffic')}</li>
                    <li>• {t('step1.monitor_uptime')}</li>
                  </ul>
                </div>

                <Button 
                  onClick={handleDomainProbe} 
                  disabled={!domain.trim() || isProbing}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  {isProbing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('step1.checking')}
                    </>
                  ) : (
                    <>
                      {t('actions.next')}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: 选择收入来源 */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4 p-3 bg-muted rounded-lg">
                  {probeResult?.logoUrl && (
                    <img src={probeResult.logoUrl} className="w-8 h-8 rounded-lg" alt="Logo" />
                  )}
                  <span className="font-semibold">{probeResult?.domain}</span>
                  <Badge variant="outline" className="ml-auto">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {t('verified')}
                  </Badge>
                </div>
                <CardTitle className="text-2xl">{t('step2.title')}</CardTitle>
                <CardDescription className="text-base">
                  {t('step2.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 安全提示 */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2 mb-2">
                    <Lock className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      🔒 {t('step2.security_title')}
                    </p>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 ml-6">
                    {t('step2.security_description')}
                  </p>
                </div>

                {/* 平台选择 */}
                <div className="space-y-3">
                  {PAYMENT_PLATFORMS.map((platform) => {
                    const Icon = platform.icon;
                    const isSelected = selectedPlatforms.includes(platform.id);
                    
                    return (
                      <div key={platform.id} className="space-y-3">
                        <div
                          onClick={() => togglePlatform(platform.id)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox checked={isSelected} />
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${platform.color}`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-semibold">{platform.name}</span>
                          </div>
                        </div>

                        {/* API Key 输入 */}
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="ml-11 space-y-2"
                          >
                            <Label className="text-sm">{platform.apiKeyLabel}</Label>
                            <Input
                              type="password"
                              placeholder={platform.apiKeyPlaceholder}
                              value={apiKeys[platform.id] || ''}
                              onChange={(e) => setApiKeys(prev => ({ ...prev, [platform.id]: e.target.value }))}
                            />
                            <a 
                              href={platform.helpUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline inline-block"
                            >
                              {t('step2.how_to_get_key')} →
                            </a>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}

                  {/* 无收入选项 */}
                  <div
                    onClick={() => setSelectedPlatforms([])}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPlatforms.length === 0
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox checked={selectedPlatforms.length === 0} />
                      <span className="font-semibold">{t('step2.no_revenue')}</span>
                    </div>
                  </div>

                  {/* 其他支付平台 */}
                  <div className="space-y-3">
                    <div className="p-4 border-2 border-dashed rounded-lg">
                      <Label className="text-sm font-medium mb-2 block">
                        {t('step2.other_platform_name')}
                      </Label>
                      <Input
                        placeholder={t('step2.other_platform_placeholder')}
                        value={otherPlatform}
                        onChange={(e) => setOtherPlatform(e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('actions.back')}
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1">
                    {t('actions.next')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: 流量监控 */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  {t('step3.title')}
                </CardTitle>
                <CardDescription className="text-base">
                  {t('step3.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div
                    onClick={() => setEnableGA4(true)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      enableGA4 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox checked={enableGA4} />
                      <BarChart3 className="h-5 w-5" />
                      <span className="font-semibold">{t('step3.enable_ga4')}</span>
                    </div>
                  </div>

                  {enableGA4 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="ml-11 space-y-2"
                    >
                      <Label>Google Analytics Property ID</Label>
                      <Input
                        placeholder="123456789"
                        value={ga4PropertyId}
                        onChange={(e) => setGA4PropertyId(e.target.value)}
                      />
                    </motion.div>
                  )}

                  <div
                    onClick={() => setEnableGA4(false)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      !enableGA4 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox checked={!enableGA4} />
                      <span className="font-semibold">{t('step3.skip')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('actions.back')}
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('step3.submitting')}
                      </>
                    ) : (
                      <>
                        {t('step3.complete')}
                        <CheckCircle2 className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: 完成页 */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 border-green-500">
              <CardContent className="text-center py-12 space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
                </motion.div>
                
                <div>
                  <h2 className="text-3xl font-bold mb-2">🎉 {t('step4.title')}</h2>
                  <p className="text-muted-foreground">{t('step4.subtitle')}</p>
                </div>

                {probeResult?.logoUrl && (
                  <div className="flex items-center justify-center gap-3 p-4 bg-muted rounded-lg max-w-sm mx-auto">
                    <img src={probeResult.logoUrl} className="w-12 h-12 rounded-lg" alt="Logo" />
                    <div className="text-left">
                      <p className="font-semibold">{probeResult.domain}</p>
                      <p className="text-sm text-muted-foreground">{t('step4.monitoring')}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm text-muted-foreground max-w-md mx-auto">
                  <p className="font-medium text-foreground">{t('step4.we_will')}:</p>
                  <ul className="space-y-1">
                    <li>✓ {t('step4.monitor_uptime')}</li>
                    <li>✓ {t('step4.monitor_revenue')}</li>
                    <li>✓ {t('step4.monitor_traffic')}</li>
                    <li>✓ {t('step4.alert_issues')}</li>
                  </ul>
                </div>

                <Button size="lg" className="w-full max-w-sm" onClick={() => router.push('/soloboard')}>
                  {t('step4.view_dashboard')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

