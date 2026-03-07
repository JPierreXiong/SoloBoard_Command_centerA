/**
 * 3 步向导式批量添加站点对话框
 * Wizard-Style Batch Add Sites Dialog
 * 
 * Step 1: 域名矩阵 - 批量输入 + 自动验证 + Logo 预览
 * Step 2: 秘钥映射 - 全局/单独配置 + 智能平台识别
 * Step 3: 指标激活 - 选择追踪指标
 * 
 * 不改变 ShipAny 结构 - 独立组件
 */

'use client';

import { useState } from 'react';
import { 
  Globe, 
  Zap, 
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  TrendingUp,
  Users,
  Activity,
  Bell,
  BarChart3
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Progress } from '@/shared/components/ui/progress';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { toast } from 'sonner';
import { detectPlatform } from '@/shared/utils/platform-detector';

interface DomainInfo {
  domain: string;
  name: string;
  status: 'pending' | 'validating' | 'online' | 'offline';
  logoUrl?: string;
  detectedPlatforms?: string[];
  confidence?: number;
}

interface ApiKeyConfig {
  stripe?: string;
  ga4?: string;
  shopify?: string;
  shopifyDomain?: string;
  lemon?: string;
}

interface SiteConfig extends DomainInfo {
  apiKeys: ApiKeyConfig;
  selectedMetrics: string[];
}

interface WizardBatchAddDialogProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export function WizardBatchAddDialog({ onSuccess, onClose }: WizardBatchAddDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [domains, setDomains] = useState<DomainInfo[]>([]);
  const [domainInput, setDomainInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  
  // Step 2: API Key 配置
  const [configMode, setConfigMode] = useState<'global' | 'individual'>('global');
  const [globalApiKeys, setGlobalApiKeys] = useState<ApiKeyConfig>({});
  const [individualConfigs, setIndividualConfigs] = useState<Map<string, ApiKeyConfig>>(new Map());
  
  // Step 3: 指标选择
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue', 'visitors', 'uptime']);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);

  // ============================================
  // Step 1: 域名验证
  // ============================================
  
  const handleValidateDomains = async () => {
    const lines = domainInput.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length === 0) {
      toast.error('请输入至少一个域名');
      return;
    }
    
    if (lines.length > 10) {
      toast.error('最多支持 10 个域名');
      return;
    }
    
    setIsValidating(true);
    const newDomains: DomainInfo[] = [];
    
    try {
      // 并发验证所有域名
      const validationPromises = lines.map(async (line) => {
        const domain = line.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const name = domain.split('.')[0];
        
        const domainInfo: DomainInfo = {
          domain,
          name,
          status: 'validating',
        };
        
        try {
          // 1. 检查域名可访问性
          const url = `https://${domain}`;
          const response = await fetch(url, { 
            method: 'HEAD',
            mode: 'no-cors',
            signal: AbortSignal.timeout(5000)
          });
          
          domainInfo.status = 'online';
          domainInfo.logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
          
          // 2. 智能平台识别
          try {
            const detection = await detectPlatform(domain);
            domainInfo.detectedPlatforms = detection.recommendedPlatforms;
            domainInfo.confidence = detection.confidence;
          } catch (err) {
            console.error('Platform detection failed:', err);
          }
          
        } catch (error) {
          domainInfo.status = 'offline';
        }
        
        return domainInfo;
      });
      
      const results = await Promise.all(validationPromises);
      setDomains(results);
      
      const onlineCount = results.filter(d => d.status === 'online').length;
      toast.success(`验证完成！${onlineCount}/${results.length} 个站点在线`);
      
    } catch (error) {
      toast.error('验证失败，请重试');
    } finally {
      setIsValidating(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (domains.length === 0) {
        toast.error('请先验证域名');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // ============================================
  // Step 2: API Key 配置
  // ============================================
  
  const applyGlobalKeys = () => {
    const newConfigs = new Map<string, ApiKeyConfig>();
    domains.forEach(domain => {
      newConfigs.set(domain.domain, { ...globalApiKeys });
    });
    setIndividualConfigs(newConfigs);
    toast.success('已应用全局配置到所有站点');
  };

  const updateIndividualConfig = (domain: string, keys: Partial<ApiKeyConfig>) => {
    const newConfigs = new Map(individualConfigs);
    const existing = newConfigs.get(domain) || {};
    newConfigs.set(domain, { ...existing, ...keys });
    setIndividualConfigs(newConfigs);
  };

  // ============================================
  // Step 3: 提交
  // ============================================
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitProgress(0);
    
    try {
      // 构建提交数据
      const sites = domains.map(domain => {
        const apiConfig = configMode === 'global' 
          ? globalApiKeys 
          : (individualConfigs.get(domain.domain) || {});
        
        return {
          domain: domain.domain,
          name: domain.name,
          platform: domain.detectedPlatforms?.[0] || 'UPTIME',
          apiConfig,
          metrics: selectedMetrics,
        };
      });
      
      // 提交到 API
      const response = await fetch('/api/soloboard/sites/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sites }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSubmitProgress(100);
        toast.success(`成功添加 ${data.successful} 个站点！`);
        
        setTimeout(() => {
          onSuccess?.();
        }, 1500);
      } else {
        if (response.status === 403) {
          toast.error(data.message || '站点数量超过限制');
        } else {
          toast.error(data.error || '添加失败');
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('网络错误，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // 渲染
  // ============================================
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
          <Zap className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">批量添加网站</h2>
        <p className="text-sm text-muted-foreground">
          3 步快速配置，一次性添加最多 10 个网站
        </p>
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center gap-2">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center font-bold
              ${currentStep >= step 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-500'}
            `}>
              {step}
            </div>
            {step < 3 && (
              <div className={`w-16 h-1 ${currentStep > step ? 'bg-blue-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: 域名矩阵 */}
      {currentStep === 1 && (
        <Step1DomainGrid
          domainInput={domainInput}
          setDomainInput={setDomainInput}
          domains={domains}
          isValidating={isValidating}
          onValidate={handleValidateDomains}
          onNext={handleNextStep}
        />
      )}

      {/* Step 2: 秘钥映射 */}
      {currentStep === 2 && (
        <Step2KeyMapping
          domains={domains}
          configMode={configMode}
          setConfigMode={setConfigMode}
          globalApiKeys={globalApiKeys}
          setGlobalApiKeys={setGlobalApiKeys}
          individualConfigs={individualConfigs}
          updateIndividualConfig={updateIndividualConfig}
          applyGlobalKeys={applyGlobalKeys}
          onPrev={handlePrevStep}
          onNext={handleNextStep}
        />
      )}

      {/* Step 3: 指标激活 */}
      {currentStep === 3 && (
        <Step3MetricsSelection
          selectedMetrics={selectedMetrics}
          setSelectedMetrics={setSelectedMetrics}
          domains={domains}
          isSubmitting={isSubmitting}
          submitProgress={submitProgress}
          onPrev={handlePrevStep}
          onSubmit={handleSubmit}
          onClose={onClose}
        />
      )}
    </div>
  );
}

// ============================================
// Step 1: 域名矩阵组件
// ============================================

function Step1DomainGrid({
  domainInput,
  setDomainInput,
  domains,
  isValidating,
  onValidate,
  onNext,
}: any) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              📋 批量粘贴域名
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              每行一个域名，最多 10 个。系统将自动验证可访问性并获取 Logo。
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>域名列表</Label>
        <Textarea
          placeholder="example1.com&#10;example2.com&#10;example3.com"
          value={domainInput}
          onChange={(e) => setDomainInput(e.target.value)}
          rows={8}
          className="font-mono text-sm"
          disabled={isValidating || domains.length > 0}
        />
        <p className="text-xs text-muted-foreground">
          支持格式：example.com 或 https://example.com
        </p>
      </div>

      {domains.length === 0 ? (
        <Button
          onClick={onValidate}
          disabled={isValidating || !domainInput.trim()}
          className="w-full"
          size="lg"
        >
          {isValidating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              验证中...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              验证域名并继续
            </>
          )}
        </Button>
      ) : (
        <>
          {/* 验证结果 */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {domains.map((domain: DomainInfo, index: number) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border"
              >
                {domain.logoUrl ? (
                  <img
                    src={domain.logoUrl}
                    alt={domain.name}
                    className="w-10 h-10 rounded-lg"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{domain.domain}</p>
                    {domain.status === 'online' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  {domain.detectedPlatforms && domain.detectedPlatforms.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      检测到: {domain.detectedPlatforms.join(', ')} 
                      {domain.confidence && ` (${domain.confidence}% 置信度)`}
                    </p>
                  )}
                </div>
                
                <div className="text-sm">
                  {domain.status === 'online' ? (
                    <span className="text-green-600">🟢 在线</span>
                  ) : (
                    <span className="text-red-600">❌ 离线</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setDomainInput('');
              }}
              className="flex-1"
            >
              重新输入
            </Button>
            <Button
              onClick={onNext}
              className="flex-1"
              size="lg"
            >
              下一步：配置数据源
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// Step 2: 秘钥映射组件
// ============================================

function Step2KeyMapping({
  domains,
  configMode,
  setConfigMode,
  globalApiKeys,
  setGlobalApiKeys,
  individualConfigs,
  updateIndividualConfig,
  applyGlobalKeys,
  onPrev,
  onNext,
}: any) {
  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
              🔑 配置数据源
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              选择全局设置（所有站点使用相同 API Key）或单独设置（每个站点不同）
            </p>
          </div>
        </div>
      </div>

      {/* 配置模式选择 */}
      <RadioGroup value={configMode} onValueChange={(value: any) => setConfigMode(value)}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="global" id="global" />
          <Label htmlFor="global">⚪ 全局设置（推荐）</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="individual" id="individual" />
          <Label htmlFor="individual">⚫ 单独设置</Label>
        </div>
      </RadioGroup>

      {/* 全局模式 */}
      {configMode === 'global' && (
        <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
          <h3 className="font-semibold text-sm">全局 API Key 配置</h3>
          
          <div className="space-y-2">
            <Label className="text-xs">Stripe Key (收入追踪)</Label>
            <Input
              type="password"
              placeholder="sk_live_..."
              value={globalApiKeys.stripe || ''}
              onChange={(e) => setGlobalApiKeys({ ...globalApiKeys, stripe: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">GA4 Property ID (流量追踪)</Label>
            <Input
              placeholder="G-XXXXXX"
              value={globalApiKeys.ga4 || ''}
              onChange={(e) => setGlobalApiKeys({ ...globalApiKeys, ga4: e.target.value })}
            />
          </div>
          
          <Button
            variant="outline"
            onClick={applyGlobalKeys}
            className="w-full"
            size="sm"
          >
            应用到所有 {domains.length} 个站点
          </Button>
        </div>
      )}

      {/* 单独模式 */}
      {configMode === 'individual' && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {domains.map((domain: DomainInfo) => (
            <div key={domain.domain} className="p-3 bg-white dark:bg-gray-800 rounded-lg border space-y-2">
              <p className="font-semibold text-sm">{domain.domain}</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="password"
                  placeholder="Stripe Key"
                  value={individualConfigs.get(domain.domain)?.stripe || ''}
                  onChange={(e) => updateIndividualConfig(domain.domain, { stripe: e.target.value })}
                  className="text-xs"
                />
                <Input
                  placeholder="GA4 ID"
                  value={individualConfigs.get(domain.domain)?.ga4 || ''}
                  onChange={(e) => updateIndividualConfig(domain.domain, { ga4: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrev} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          上一步
        </Button>
        <Button onClick={onNext} className="flex-1" size="lg">
          下一步：选择指标
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// Step 3: 指标选择组件
// ============================================

function Step3MetricsSelection({
  selectedMetrics,
  setSelectedMetrics,
  domains,
  isSubmitting,
  submitProgress,
  onPrev,
  onSubmit,
  onClose,
}: any) {
  const metrics = [
    { id: 'revenue', label: '💰 销售额 (Revenue)', icon: TrendingUp },
    { id: 'visitors', label: '👥 访客数 (Visitors)', icon: Users },
    { id: 'uptime', label: '⚡ 响应速度 (Speed)', icon: Activity },
    { id: 'conversion', label: '📊 转化率 (Conversion)', icon: BarChart3 },
    { id: 'alerts', label: '🔔 告警通知 (Alerts)', icon: Bell },
  ];

  const toggleMetric = (metricId: string) => {
    if (selectedMetrics.includes(metricId)) {
      setSelectedMetrics(selectedMetrics.filter((m: string) => m !== metricId));
    } else {
      setSelectedMetrics([...selectedMetrics, metricId]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-green-50 dark:bg-green-950 p-4 rounded-xl border border-green-200 dark:border-green-800">
        <div className="flex items-start gap-3">
          <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
              📊 选择追踪指标
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              选择您想要追踪的数据指标，可随时在设置中修改
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all
              ${selectedMetrics.includes(metric.id)
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-gray-200 hover:border-gray-300'}
            `}
            onClick={() => toggleMetric(metric.id)}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedMetrics.includes(metric.id)}
                onCheckedChange={() => toggleMetric(metric.id)}
              />
              <metric.icon className="h-5 w-5" />
              <span className="font-medium">{metric.label}</span>
            </div>
          </div>
        ))}
      </div>

      {isSubmitting && (
        <div className="space-y-2">
          <Progress value={submitProgress} />
          <p className="text-sm text-center text-muted-foreground">
            正在添加 {domains.length} 个站点...
          </p>
        </div>
      )}

      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-100 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm">
              数据加密保护已激活
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              API Keys 将通过 AES-256 军事级加密存储
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrev} disabled={isSubmitting} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          上一步
        </Button>
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          取消
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || selectedMetrics.length === 0}
          className="flex-1"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              添加中...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              完成并添加 {domains.length} 个站点
            </>
          )}
        </Button>
      </div>
    </div>
  );
}


