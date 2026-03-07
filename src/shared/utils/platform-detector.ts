/**
 * 智能平台识别工具
 * Platform Detector
 * 
 * 功能:
 * 1. 自动检测网站是否为 Shopify
 * 2. 检测是否安装 GA4
 * 3. 推荐数据源配置
 */

export interface PlatformDetectionResult {
  isShopify: boolean;
  hasGA4: boolean;
  hasStripe: boolean;
  recommendedPlatforms: string[];
  confidence: number; // 0-100
  details: {
    shopifyIndicators?: string[];
    ga4PropertyId?: string;
    detectedTechnologies?: string[];
  };
}

/**
 * 检测网站平台类型
 */
export async function detectPlatform(domain: string): Promise<PlatformDetectionResult> {
  const result: PlatformDetectionResult = {
    isShopify: false,
    hasGA4: false,
    hasStripe: false,
    recommendedPlatforms: ['UPTIME'], // 默认推荐监控
    confidence: 0,
    details: {},
  };

  try {
    // 确保域名格式正确
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    
    // 1. 获取网站 HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SoloBoard/1.0; +https://soloboard.app)',
      },
      signal: AbortSignal.timeout(5000), // 5秒超时
    });

    if (!response.ok) {
      return result;
    }

    const html = await response.text();
    const headers = response.headers;

    // 2. 检测 Shopify
    const shopifyIndicators: string[] = [];
    
    if (headers.get('x-shopify-stage')) {
      shopifyIndicators.push('x-shopify-stage header');
      result.isShopify = true;
    }
    
    if (html.includes('Shopify.shop') || html.includes('cdn.shopify.com')) {
      shopifyIndicators.push('Shopify CDN');
      result.isShopify = true;
    }
    
    if (html.includes('shopify-features')) {
      shopifyIndicators.push('Shopify features');
      result.isShopify = true;
    }

    if (result.isShopify) {
      result.details.shopifyIndicators = shopifyIndicators;
      result.recommendedPlatforms.push('SHOPIFY');
      result.confidence += 30;
    }

    // 3. 检测 GA4
    const ga4Match = html.match(/G-[A-Z0-9]{10}/);
    if (ga4Match) {
      result.hasGA4 = true;
      result.details.ga4PropertyId = ga4Match[0];
      result.recommendedPlatforms.push('GA4');
      result.confidence += 25;
    }

    // 4. 检测 Stripe
    if (html.includes('stripe.com') || html.includes('js.stripe.com')) {
      result.hasStripe = true;
      result.recommendedPlatforms.push('STRIPE');
      result.confidence += 20;
    }

    // 5. 检测其他技术栈
    const technologies: string[] = [];
    
    if (html.includes('lemonsqueezy')) {
      technologies.push('Lemon Squeezy');
      result.recommendedPlatforms.push('LEMON');
      result.confidence += 15;
    }
    
    if (html.includes('paddle.com')) {
      technologies.push('Paddle');
    }
    
    if (html.includes('gumroad')) {
      technologies.push('Gumroad');
    }

    result.details.detectedTechnologies = technologies;

    // 6. 计算最终置信度
    result.confidence = Math.min(result.confidence, 100);

  } catch (error) {
    console.error('Platform detection error:', error);
    // 返回默认结果
  }

  return result;
}

/**
 * 批量检测多个网站
 */
export async function detectPlatformsBatch(domains: string[]): Promise<Map<string, PlatformDetectionResult>> {
  const results = new Map<string, PlatformDetectionResult>();
  
  // 限制并发数为 3，避免触发速率限制
  const concurrency = 3;
  const chunks: string[][] = [];
  
  for (let i = 0; i < domains.length; i += concurrency) {
    chunks.push(domains.slice(i, i + concurrency));
  }
  
  for (const chunk of chunks) {
    const promises = chunk.map(async (domain) => {
      const result = await detectPlatform(domain);
      results.set(domain, result);
    });
    
    await Promise.all(promises);
  }
  
  return results;
}

/**
 * 根据检测结果推荐配置
 */
export function getRecommendedConfig(detection: PlatformDetectionResult): {
  platform: string;
  message: string;
  requiredFields: string[];
} {
  if (detection.isShopify) {
    return {
      platform: 'SHOPIFY',
      message: '检测到 Shopify 商店！建议配置 Shopify API 以追踪销售数据。',
      requiredFields: ['shopifyDomain', 'shopifyAccessToken'],
    };
  }
  
  if (detection.hasGA4) {
    return {
      platform: 'GA4',
      message: `检测到 GA4 (${detection.details.ga4PropertyId})！建议配置 GA4 以追踪访客数据。`,
      requiredFields: ['ga4PropertyId', 'ga4ServiceAccount'],
    };
  }
  
  if (detection.hasStripe) {
    return {
      platform: 'STRIPE',
      message: '检测到 Stripe 集成！建议配置 Stripe API 以追踪收入数据。',
      requiredFields: ['stripeKey'],
    };
  }
  
  return {
    platform: 'UPTIME',
    message: '未检测到特定平台，建议使用基础监控功能。',
    requiredFields: [],
  };
}


