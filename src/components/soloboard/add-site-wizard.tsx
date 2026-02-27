/**
 * SoloBoard - 添加站点向导组件
 * 
 * 功能：美观的多步骤表单，引导用户添加监控站点
 * 支持：自动监控、Stripe、Creem、Google Analytics
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { 
  Globe, 
  CreditCard, 
  Users, 
  BarChart3, 
  Zap, 
  Lock, 
  CheckCircle2,
  ArrowRight,
  Info,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// 平台配置
const PLATFORMS = [
  {
    id: 'auto-monitor',
    name: '自动网站监控',
    icon: Globe,
    color: 'from-blue-500 to-cyan-500',
    description: '零配置，输入网址即可开始监控',
    features: [
      '网站在线状态',
      '响应时间监控',
      'SSL 证书检查',
      'SEO 分数分析',
      '技术栈检测',
      '性能监控'
    ],
    requiredFields: [
      {
        name: 'url',
        label: '网站地址',
        placeholder: 'https://example.com',
        type: 'url',
        required: true,
        help: '输入您要监控的网站完整地址'
      },
      {
        name: 'siteName',
        label: '站点名称',
        placeholder: '我的网站',
        type: 'text',
        required: false,
        help: '为这个站点起一个容易识别的名称'
      }
    ],
    setupTime: '30 秒',
    difficulty: 'easy',
    cost: 'free'
  },
  {
    id: 'stripe',
    name: 'Stripe 收入监控',
    icon: CreditCard,
    color: 'from-purple-500 to-pink-500',
    description: '实时追踪 Stripe 支付和收入数据',
    features: [
      '今日收入统计',
      '本月收入统计',
      '交易数量追踪',
      '待处理金额',
      '多币种支持',
      '收入趋势图'
    ],
    requiredFields: [
      {
        name: 'siteName',
        label: '站点名称',
        placeholder: 'Stripe 收入',
        type: 'text',
        required: true,
        help: '为这个 Stripe 账户起一个名称'
      },
      {
        name: 'stripeSecretKey',
        label: 'Stripe Secret Key',
        placeholder: 'sk_live_...',
        type: 'password',
        required: true,
        help: '从 Stripe Dashboard → Developers → API keys 获取'
      }
    ],
    setupGuide: {
      title: '如何获取 Stripe API Key',
      steps: [
        '访问 Stripe Dashboard (dashboard.stripe.com)',
        '点击 Developers → API keys',
        '复制 Secret key (sk_live_... 或 sk_test_...)',
        '建议创建 Restricted Key（只读权限）'
      ],
      link: 'https://dashboard.stripe.com/apikeys'
    },
    setupTime: '3 分钟',
    difficulty: 'medium',
    cost: 'free'
  },
  {
    id: 'creem',
    name: 'Creem 订阅管理',
    icon: Users,
    color: 'from-green-500 to-emerald-500',
    description: '监控 SaaS 订阅、MRR 和流失率',
    features: [
      'MRR 追踪',
      '活跃订阅数',
      '新增订阅统计',
      '流失率分析',
      '订阅生命周期',
      '收入预测'
    ],
    requiredFields: [
      {
        name: 'siteName',
        label: '站点名称',
        placeholder: 'Creem 订阅',
        type: 'text',
        required: true,
        help: '为这个 Creem 账户起一个名称'
      },
      {
        name: 'creemApiKey',
        label: 'Creem API Key',
        placeholder: 'creem_live_...',
        type: 'password',
        required: true,
        help: '从 Creem Dashboard → Settings → API Keys 获取'
      }
    ],
    setupGuide: {
      title: '如何获取 Creem API Key',
      steps: [
        '访问 Creem Dashboard (creem.io/dashboard)',
        '点击 Settings → API Keys',
        '创建只读权限的 API Key',
        '复制 API Key (creem_live_...)'
      ],
      link: 'https://creem.io/dashboard'
    },
    setupTime: '3 分钟',
    difficulty: 'medium',
    cost: 'free'
  },
  {
    id: 'ga4',
    name: 'Google Analytics',
    icon: BarChart3,
    color: 'from-orange-500 to-red-500',
    description: '实时网站流量和用户行为分析',
    features: [
      '实时活跃用户',
      '今日访问统计',
      '页面浏览量',
      '会话数追踪',
      '用户来源分析',
      '转化率监控'
    ],
    requiredFields: [
      {
        name: 'siteName',
        label: '站点名称',
        placeholder: 'GA4 流量',
        type: 'text',
        required: true,
        help: '为这个 GA4 属性起一个名称'
      },
      {
        name: 'propertyId',
        label: 'Property ID',
        placeholder: '123456789',
        type: 'text',
        required: true,
        help: 'GA4 属性 ID（纯数字）'
      },
      {
        name: 'clientEmail',
        label: 'Service Account Email',
        placeholder: 'xxx@xxx.iam.gserviceaccount.com',
        type: 'email',
        required: true,
        help: 'Google Cloud 服务账号邮箱'
      },
      {
        name: 'privateKey',
        label: 'Private Key',
        placeholder: '-----BEGIN PRIVATE KEY-----...',
        type: 'textarea',
        required: true,
        help: '服务账号的私钥（JSON 文件中的 private_key）'
      }
    ],
    setupGuide: {
      title: '如何设置 GA4 API',
      steps: [
        '访问 Google Cloud Console',
        '创建服务账号',
        '下载 JSON 密钥文件',
        '在 GA4 中添加服务账号为查看者',
        '复制 Property ID 和密钥信息'
      ],
      link: 'https://console.cloud.google.com'
    },
    setupTime: '10 分钟',
    difficulty: 'hard',
    cost: 'free'
  }
];

export function AddSiteWizard() {
  const [step, setStep] = useState<'select' | 'configure' | 'confirm'>('select');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const platform = PLATFORMS.find(p => p.id === selectedPlatform);

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatform(platformId);
    setStep('configure');
    setFormData({});
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!platform) return;

    // 验证必填字段
    const missingFields = platform.requiredFields
      .filter(field => field.required && !formData[field.name])
      .map(field => field.label);

    if (missingFields.length > 0) {
      toast.error(`请填写必填字段: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/soloboard/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.siteName || platform.name,
          platform: platform.id,
          url: formData.url || 'https://example.com',
          apiConfig: formData,
        }),
      });

      if (response.ok) {
        toast.success('站点添加成功！数据将在 15 分钟内开始同步。');
        setStep('select');
        setSelectedPlatform(null);
        setFormData({});
      } else {
        const error = await response.json();
        toast.error(error.message || '添加失败，请重试');
      }
    } catch (error) {
      console.error('Failed to add site:', error);
      toast.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 步骤指示器 */}
      <div className="flex items-center justify-center gap-4">
        <StepIndicator 
          number={1} 
          label="选择平台" 
          active={step === 'select'} 
          completed={step !== 'select'}
        />
        <div className="h-px w-12 bg-border" />
        <StepIndicator 
          number={2} 
          label="配置信息" 
          active={step === 'configure'} 
          completed={step === 'confirm'}
        />
        <div className="h-px w-12 bg-border" />
        <StepIndicator 
          number={3} 
          label="确认添加" 
          active={step === 'confirm'} 
          completed={false}
        />
      </div>

      {/* 步骤 1: 选择平台 */}
      {step === 'select' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 md:grid-cols-2"
        >
          {PLATFORMS.map((platform) => (
            <PlatformCard
              key={platform.id}
              platform={platform}
              onSelect={() => handlePlatformSelect(platform.id)}
            />
          ))}
        </motion.div>
      )}

      {/* 步骤 2: 配置信息 */}
      {step === 'configure' && platform && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${platform.color}`}>
                  <platform.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>{platform.name}</CardTitle>
                  <CardDescription>{platform.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* 设置指南 */}
              {platform.setupGuide && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Info className="h-5 w-5" />
                    <h4 className="font-semibold">{platform.setupGuide.title}</h4>
                  </div>
                  <ol className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
                    {platform.setupGuide.steps.map((step, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="font-semibold">{index + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <a
                    href={platform.setupGuide.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 hover:underline"
                  >
                    打开设置页面
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}

              {/* 表单字段 */}
              <div className="space-y-4">
                {platform.requiredFields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    
                    {field.type === 'textarea' ? (
                      <textarea
                        id={field.name}
                        placeholder={field.placeholder}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        required={field.required}
                        className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                      />
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        required={field.required}
                      />
                    )}
                    
                    {field.help && (
                      <p className="text-xs text-muted-foreground">{field.help}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('select');
                    setSelectedPlatform(null);
                  }}
                  className="flex-1"
                >
                  返回
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? '添加中...' : '添加站点'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// 平台卡片组件
function PlatformCard({ 
  platform, 
  onSelect 
}: { 
  platform: typeof PLATFORMS[0]; 
  onSelect: () => void;
}) {
  const Icon = platform.icon;
  
  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
    hard: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
  };

  const difficultyLabels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '复杂'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all h-full"
        onClick={onSelect}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-lg bg-gradient-to-br ${platform.color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className={difficultyColors[platform.difficulty]}>
                {difficultyLabels[platform.difficulty]}
              </Badge>
              {platform.cost === 'free' && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  免费
                </Badge>
              )}
            </div>
          </div>
          
          <CardTitle className="mt-4">{platform.name}</CardTitle>
          <CardDescription>{platform.description}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* 功能列表 */}
          <div className="space-y-2">
            {platform.features.slice(0, 4).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{feature}</span>
              </div>
            ))}
            {platform.features.length > 4 && (
              <p className="text-xs text-muted-foreground">
                +{platform.features.length - 4} 更多功能
              </p>
            )}
          </div>

          {/* 设置时间 */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
            <Zap className="h-4 w-4" />
            <span>设置时间: {platform.setupTime}</span>
          </div>
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
          w-10 h-10 rounded-full flex items-center justify-center font-semibold
          ${completed ? 'bg-green-600 text-white' : ''}
          ${active ? 'bg-primary text-primary-foreground' : ''}
          ${!active && !completed ? 'bg-muted text-muted-foreground' : ''}
        `}
      >
        {completed ? <CheckCircle2 className="h-5 w-5" /> : number}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

