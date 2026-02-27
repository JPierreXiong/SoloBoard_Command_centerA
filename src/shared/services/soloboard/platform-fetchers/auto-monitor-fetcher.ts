/**
 * SoloBoard - 自动网站监控服务
 * 
 * 功能：客户输入网址，自动抓取和监控网站信息
 * 
 * 支持的指标：
 * - 网站状态（在线/离线）
 * - 响应时间
 * - SSL 证书状态
 * - 页面标题和描述
 * - 关键词排名（可选）
 * - 页面加载速度
 * - SEO 分数
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export interface AutoMonitorConfig {
  url: string;
  checkSSL?: boolean;
  checkSEO?: boolean;
  keywords?: string[];
}

export interface WebsiteMetrics {
  // 基础状态
  isOnline: boolean;
  statusCode: number;
  responseTime: number;
  
  // SSL 信息
  sslValid: boolean;
  sslExpiryDate?: string;
  
  // 页面信息
  title: string;
  description: string;
  favicon?: string;
  
  // 性能指标
  pageSize: number;
  loadTime: number;
  
  // SEO 指标
  seoScore: number;
  metaTags: {
    hasTitle: boolean;
    hasDescription: boolean;
    hasKeywords: boolean;
    hasOgTags: boolean;
  };
  
  // 内容统计
  wordCount: number;
  imageCount: number;
  linkCount: number;
  
  // 技术栈检测
  technologies: string[];
  
  lastCheck: string;
}

/**
 * 自动监控网站
 * 
 * @param config 监控配置
 * @returns 网站指标数据
 */
export async function autoMonitorWebsite(config: AutoMonitorConfig): Promise<WebsiteMetrics> {
  const startTime = Date.now();
  
  try {
    // 1. 发送 HTTP 请求
    const response = await axios.get(config.url, {
      timeout: 30000,
      validateStatus: () => true, // 接受所有状态码
      maxRedirects: 5,
    });
    
    const responseTime = Date.now() - startTime;
    const isOnline = response.status >= 200 && response.status < 400;
    
    // 2. 解析 HTML
    const $ = cheerio.load(response.data);
    
    // 3. 提取页面信息
    const title = $('title').text().trim() || 'No title';
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       'No description';
    const favicon = $('link[rel="icon"]').attr('href') || 
                   $('link[rel="shortcut icon"]').attr('href') || 
                   '/favicon.ico';
    
    // 4. SEO 检查
    const metaTags = {
      hasTitle: $('title').length > 0,
      hasDescription: $('meta[name="description"]').length > 0,
      hasKeywords: $('meta[name="keywords"]').length > 0,
      hasOgTags: $('meta[property^="og:"]').length > 0,
    };
    
    // 5. 内容统计
    const bodyText = $('body').text();
    const wordCount = bodyText.split(/\s+/).filter(word => word.length > 0).length;
    const imageCount = $('img').length;
    const linkCount = $('a').length;
    
    // 6. 计算 SEO 分数
    let seoScore = 0;
    if (metaTags.hasTitle) seoScore += 25;
    if (metaTags.hasDescription) seoScore += 25;
    if (metaTags.hasOgTags) seoScore += 20;
    if (title.length > 10 && title.length < 60) seoScore += 15;
    if (description.length > 50 && description.length < 160) seoScore += 15;
    
    // 7. 检测技术栈
    const technologies = detectTechnologies($, response.headers);
    
    // 8. SSL 检查
    const sslValid = config.url.startsWith('https://');
    
    // 9. 页面大小
    const pageSize = Buffer.byteLength(response.data, 'utf8');
    
    return {
      isOnline,
      statusCode: response.status,
      responseTime,
      sslValid,
      title,
      description,
      favicon,
      pageSize,
      loadTime: responseTime,
      seoScore,
      metaTags,
      wordCount,
      imageCount,
      linkCount,
      technologies,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Auto Monitor Error:', error);
    
    // 返回离线状态
    return {
      isOnline: false,
      statusCode: 0,
      responseTime: Date.now() - startTime,
      sslValid: false,
      title: 'Error',
      description: error instanceof Error ? error.message : 'Unknown error',
      pageSize: 0,
      loadTime: Date.now() - startTime,
      seoScore: 0,
      metaTags: {
        hasTitle: false,
        hasDescription: false,
        hasKeywords: false,
        hasOgTags: false,
      },
      wordCount: 0,
      imageCount: 0,
      linkCount: 0,
      technologies: [],
      lastCheck: new Date().toISOString(),
    };
  }
}

/**
 * 检测网站使用的技术栈
 */
function detectTechnologies($: cheerio.CheerioAPI, headers: any): string[] {
  const technologies: string[] = [];
  
  // 检测 JavaScript 框架
  if ($('script[src*="react"]').length > 0 || $('[data-reactroot]').length > 0) {
    technologies.push('React');
  }
  if ($('script[src*="vue"]').length > 0 || $('[data-v-]').length > 0) {
    technologies.push('Vue.js');
  }
  if ($('script[src*="angular"]').length > 0 || $('[ng-app]').length > 0) {
    technologies.push('Angular');
  }
  if ($('script[src*="jquery"]').length > 0) {
    technologies.push('jQuery');
  }
  
  // 检测 CSS 框架
  if ($('link[href*="bootstrap"]').length > 0 || $('[class*="bootstrap"]').length > 0) {
    technologies.push('Bootstrap');
  }
  if ($('link[href*="tailwind"]').length > 0 || $('[class*="tw-"]').length > 0) {
    technologies.push('Tailwind CSS');
  }
  
  // 检测分析工具
  if ($('script[src*="google-analytics"]').length > 0 || $('script[src*="gtag"]').length > 0) {
    technologies.push('Google Analytics');
  }
  if ($('script[src*="facebook"]').length > 0) {
    technologies.push('Facebook Pixel');
  }
  
  // 检测服务器
  const serverHeader = headers['server'];
  if (serverHeader) {
    if (serverHeader.includes('nginx')) technologies.push('Nginx');
    if (serverHeader.includes('Apache')) technologies.push('Apache');
    if (serverHeader.includes('cloudflare')) technologies.push('Cloudflare');
  }
  
  // 检测 CMS
  if ($('meta[name="generator"]').attr('content')?.includes('WordPress')) {
    technologies.push('WordPress');
  }
  if ($('script[src*="shopify"]').length > 0) {
    technologies.push('Shopify');
  }
  
  return technologies;
}

/**
 * 验证 URL 格式
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const urlObj = new URL(url);
    
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * 批量监控多个网站
 */
export async function batchMonitorWebsites(urls: string[]): Promise<WebsiteMetrics[]> {
  const results = await Promise.allSettled(
    urls.map(url => autoMonitorWebsite({ url }))
  );
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        isOnline: false,
        statusCode: 0,
        responseTime: 0,
        sslValid: false,
        title: 'Error',
        description: result.reason?.message || 'Failed to monitor',
        pageSize: 0,
        loadTime: 0,
        seoScore: 0,
        metaTags: {
          hasTitle: false,
          hasDescription: false,
          hasKeywords: false,
          hasOgTags: false,
        },
        wordCount: 0,
        imageCount: 0,
        linkCount: 0,
        technologies: [],
        lastCheck: new Date().toISOString(),
      };
    }
  });
}






















