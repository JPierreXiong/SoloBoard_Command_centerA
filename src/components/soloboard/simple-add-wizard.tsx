/**
 * SoloBoard - 简化的 3 步添加流程
 * 
 * Step 1: 输入网址
 * Step 2: 选择收款方式
 * Step 3: 是否监控流量
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Badge } from '@/shared/components/ui/badge';
import { 
  Globe, 
  CreditCard, 
  Users, 
  BarChart3, 
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Info,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface PaymentPlatform {
  id: string;
  name: string;
  icon: any;
  color: string;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  helpUrl: string;
}

const PAYMENT_PLATFORMS: PaymentPlatform[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    icon: CreditCard,
    color: 'from-purple-500 to-pink-500',
    apiKeyLabel: 'Stripe Secret Key',
    apiKeyPlaceholder: 'sk_live_...',
    helpUrl: 'https://dashboard.stripe.com/apikeys',
  },
  {
    id: 'creem',
    name: 'Creem',
    icon: Users,
    color: 'from-green-500 to-emerald-500',
    apiKeyLabel: 'Creem API Key',
    apiKeyPlaceholder: 'creem_live_...',
    helpUrl: 'https://creem.io/dashboard',
  },
];

export function SimpleAddWizard({ onSuccess }: { onSuccess?: () => void }) {
  const t = useTranslations('shipany');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [siteUrl, setSiteUrl] = useState('');
  const [siteName, setSiteName] = useState('');
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [enableGA4, setEnableGA4] = useState(false);
  const [ga4PropertyId, setGa4PropertyId] = useState('');

  const handleNext = () => {
    if (step === 1) {
      if (!siteUrl) {
        toast.error('Please enter a website URL');
        return;
      }
      // Validate URL format
      try {
        new URL(siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`);
      } catch {
        toast.error('Please enter a valid URL');
        return;
      }
    }
    
    if (step === 2) {
      // Validate API keys for selected platforms
      for (const platform of selectedPayments) {
        if (!apiKeys[platform]) {
          toast.error(`Please enter API key for ${platform}`);
          return;
        }
      }
    }
    
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Prepare API config
      const platforms: Record<string, any> = {};
      
      selectedPayments.forEach(platform => {
        if (platform === 'stripe') {
          platforms.stripe = { secretKey: apiKeys[platform] };
        } else if (platform === 'creem') {
          platforms.creem = { apiKey: apiKeys[platform] };
        }
      });
      
      if (enableGA4 && ga4PropertyId) {
        platforms.ga4 = { propertyId: ga4PropertyId };
      }

      const response = await fetch('/api/soloboard/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: siteName || siteUrl,
          url: siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`,
          domain: siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''),
          platform: selectedPayments.length > 0 ? selectedPayments[0] : 'uptime',
          apiConfig: {
            platforms,
          },
        }),
      });

      if (response.ok) {
        toast.success('🎉 Website added successfully!');
        
        // Reset form
        setSiteUrl('');
        setSiteName('');
        setSelectedPayments([]);
        setApiKeys({});
        setEnableGA4(false);
        setGa4PropertyId('');
        setStep(1);
        
        onSuccess?.();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add website');
      }
    } catch (error) {
      console.error('Failed to add site:', error);
      toast.error('Network error, please try again');
    } finally {
      setLoading(false);
    }
  };

  const togglePayment = (platformId: string) => {
    setSelectedPayments(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((num) => (
          <div key={num} className="flex items-center">
            <div 
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all
                ${step >= num 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
                }
              `}
            >
              {step > num ? <CheckCircle2 className="h-5 w-5" /> : num}
            </div>
            {num < 3 && (
              <div 
                className={`w-12 h-1 mx-2 transition-all ${
                  step > num ? 'bg-primary' : 'bg-muted'
                }`} 
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {step === 1 && t('step1.title')}
                {step === 2 && t('step2.title')}
                {step === 3 && t('step3.title')}
              </CardTitle>
              <CardDescription>
                {step === 1 && t('step1.description')}
                {step === 2 && t('step2.description')}
                {step === 3 && t('step3.description')}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Step 1: Website URL */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">Website URL *</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder={t('step1.url_placeholder')}
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">{t('step1.site_name_label')}</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder={t('step1.site_name_placeholder')}
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                    />
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-2">
                    <p className="font-semibold text-blue-700 dark:text-blue-300">
                      {t('step1.we_will_monitor')}
                    </p>
                    <ul className="space-y-1 text-sm text-blue-600 dark:text-blue-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        {t('step1.monitor_uptime')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        {t('step1.monitor_revenue')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        {t('step1.monitor_traffic')}
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Step 2: Payment Platforms */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg flex items-start gap-3">
                    <Lock className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-700 dark:text-green-300">
                        {t('step2.security_title')}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {t('step2.security_description')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {PAYMENT_PLATFORMS.map((platform) => {
                      const Icon = platform.icon;
                      const isSelected = selectedPayments.includes(platform.id);
                      
                      return (
                        <div key={platform.id} className="space-y-3">
                          <div
                            className={`
                              p-4 border-2 rounded-lg cursor-pointer transition-all
                              ${isSelected 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50'
                              }
                            `}
                            onClick={() => togglePayment(platform.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={() => togglePayment(platform.id)}
                              />
                              <div className={`p-2 rounded-lg bg-gradient-to-br ${platform.color}`}>
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold">{platform.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {t(`step2.${platform.id}_description`)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pl-12 space-y-2"
                            >
                              <Label htmlFor={`${platform.id}-key`}>
                                {platform.apiKeyLabel} *
                              </Label>
                              <Input
                                id={`${platform.id}-key`}
                                type="password"
                                placeholder={platform.apiKeyPlaceholder}
                                value={apiKeys[platform.id] || ''}
                                onChange={(e) => setApiKeys(prev => ({
                                  ...prev,
                                  [platform.id]: e.target.value
                                }))}
                              />
                              <a
                                href={platform.helpUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                              >
                                <Info className="h-3 w-3" />
                                {t('step2.how_to_get_key')}
                              </a>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedPayments([])}
                  >
                    {t('step2.no_revenue')}
                  </Button>
                </div>
              )}

              {/* Step 3: Google Analytics */}
              {step === 3 && (
                <div className="space-y-4">
                  <div
                    className={`
                      p-4 border-2 rounded-lg cursor-pointer transition-all
                      ${enableGA4 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                    onClick={() => setEnableGA4(!enableGA4)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={enableGA4}
                        onCheckedChange={setEnableGA4}
                      />
                      <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{t('step3.enable_ga4')}</p>
                        <p className="text-sm text-muted-foreground">
                          Track daily visitors and page views
                        </p>
                      </div>
                    </div>
                  </div>

                  {enableGA4 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2"
                    >
                      <Label htmlFor="ga4-property">
                        {t('step3.ga4_property_label')}
                      </Label>
                      <Input
                        id="ga4-property"
                        type="text"
                        placeholder={t('step3.ga4_property_placeholder')}
                        value={ga4PropertyId}
                        onChange={(e) => setGa4PropertyId(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Find this in Google Analytics → Admin → Property Settings
                      </p>
                    </motion.div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setEnableGA4(false)}
                  >
                    {t('step3.skip')}
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {step > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('actions.back')}
                  </Button>
                )}
                
                {step < 3 ? (
                  <Button
                    onClick={handleNext}
                    className="flex-1"
                  >
                    {t('actions.next')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
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
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}


