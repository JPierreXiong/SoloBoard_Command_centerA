/**
 * SoloBoard - 自定义指标服务
 * 
 * 功能：
 * 1. 支持用户添加自定义 API 端点
 * 2. 定期抓取自定义指标数据
 * 3. 在仪表板中显示自定义指标
 */

import { db } from '@/config/db';
import { monitoredSites, siteMetricsHistory } from '@/config/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { encryptApiConfig, decryptApiConfig } from '@/shared/lib/site-crypto';

/**
 * 自定义 API 配置
 */
export interface CustomApiConfig {
  url: string; // API 端点 URL
  method?: 'GET' | 'POST'; // HTTP 方法
  headers?: Record<string, string>; // 请求头
  body?: string; // 请求体（JSON 字符串）
  auth?: {
    type: 'bearer' | 'basic' | 'apikey';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string; // 例如 'X-API-Key'
  };
  dataPath?: string; // JSON 路径，例如 'data.metrics.revenue'
  transform?: string; // JavaScript 转换函数（字符串形式）
}

/**
 * 自定义指标映射
 */
export interface CustomMetricMapping {
  name: string; // 指标名称，例如 'revenue'
  label: string; // 显示标签，例如 '收入'
  jsonPath: string; // JSON 路径，例如 'data.revenue'
  type: 'number' | 'string' | 'boolean'; // 数据类型
  format?: 'currency' | 'percentage' | 'number'; // 格式化方式
  unit?: string; // 单位，例如 'USD', '%'
}

/**
 * 添加自定义 API 站点
 */
export async function addCustomApiSite(
  userId: string,
  name: string,
  url: string,
  config: CustomApiConfig,
  metrics: CustomMetricMapping[]
) {
  const siteId = nanoid();

  // 验证 API 配置
  const isValid = await validateCustomApi(config);
  if (!isValid) {
    throw new Error('Invalid API configuration');
  }

  // 加密配置
  const encryptedConfig = encryptApiConfig(JSON.stringify({
    customApi: {
      ...config,
      metrics,
    },
  }));

  // 保存到数据库
  await db().insert(monitoredSites).values({
    id: siteId,
    userId,
    name,
    url,
    platform: 'CUSTOM_API',
    encryptedConfig,
    status: 'active',
    healthStatus: 'unknown',
    displayOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`[Custom API] Site added: ${siteId}`);
  return siteId;
}

/**
 * 验证自定义 API 配置
 */
async function validateCustomApi(config: CustomApiConfig): Promise<boolean> {
  try {
    const response = await fetchCustomApi(config);
    return response !== null;
  } catch (error) {
    console.error('[Custom API] Validation failed:', error);
    return false;
  }
}

/**
 * 抓取自定义 API 数据
 */
export async function fetchCustomApiMetrics(config: CustomApiConfig) {
  try {
    const data = await fetchCustomApi(config);
    
    if (!data) {
      throw new Error('No data returned from API');
    }

    // 提取指标
    const metrics: Record<string, any> = {};
    
    if (config.dataPath) {
      // 使用指定的数据路径
      const value = getValueByPath(data, config.dataPath);
      metrics.value = value;
    } else {
      // 返回整个响应
      metrics.raw = data;
    }

    // 应用转换函数
    if (config.transform) {
      try {
        const transformFn = new Function('data', config.transform);
        const transformed = transformFn(data);
        Object.assign(metrics, transformed);
      } catch (error) {
        console.error('[Custom API] Transform error:', error);
      }
    }

    return {
      ...metrics,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Custom API] Fetch error:', error);
    throw error;
  }
}

/**
 * 发起自定义 API 请求
 */
async function fetchCustomApi(config: CustomApiConfig) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
  };

  // 添加认证
  if (config.auth) {
    switch (config.auth.type) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${config.auth.token}`;
        break;
      case 'basic':
        const credentials = Buffer.from(
          `${config.auth.username}:${config.auth.password}`
        ).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
        break;
      case 'apikey':
        const headerName = config.auth.apiKeyHeader || 'X-API-Key';
        headers[headerName] = config.auth.apiKey || '';
        break;
    }
  }

  const options: RequestInit = {
    method: config.method || 'GET',
    headers,
  };

  if (config.body && config.method === 'POST') {
    options.body = config.body;
  }

  const response = await fetch(config.url, options);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return await response.json();
}

/**
 * 根据 JSON 路径获取值
 */
function getValueByPath(obj: any, path: string): any {
  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * 格式化自定义指标
 */
export function formatCustomMetric(
  value: any,
  mapping: CustomMetricMapping
): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  switch (mapping.format) {
    case 'currency':
      const amount = typeof value === 'number' ? value : parseFloat(value);
      return `${mapping.unit || '$'}${amount.toFixed(2)}`;
    
    case 'percentage':
      const percent = typeof value === 'number' ? value : parseFloat(value);
      return `${percent.toFixed(1)}%`;
    
    case 'number':
      const num = typeof value === 'number' ? value : parseFloat(value);
      return num.toLocaleString();
    
    default:
      return String(value);
  }
}

/**
 * 同步自定义 API 站点数据
 */
export async function syncCustomApiSite(siteId: string) {
  try {
    // 获取站点配置
    const site = await db()
      .select()
      .from(monitoredSites)
      .where(eq(monitoredSites.id, siteId))
      .limit(1);

    if (!site.length || site[0].platform !== 'CUSTOM_API') {
      throw new Error('Invalid custom API site');
    }

    const siteData = site[0];

    // 解密配置
    const configStr = decryptApiConfig(siteData.encryptedConfig);
    const config = JSON.parse(configStr);
    if (!config.customApi) {
      throw new Error('No custom API configuration found');
    }

    // 抓取数据
    const metrics = await fetchCustomApiMetrics(config.customApi);

    // 保存历史数据
    await db().insert(siteMetricsHistory).values({
      id: nanoid(),
      siteId,
      metrics,
      recordedAt: new Date(),
      createdAt: new Date(),
    });

    // 更新站点快照
    await db()
      .update(monitoredSites)
      .set({
        lastSnapshot: {
          metrics,
          updatedAt: new Date().toISOString(),
        },
        lastSyncAt: new Date(),
        status: 'active',
        healthStatus: 'online',
      })
      .where(eq(monitoredSites.id, siteId));

    console.log(`[Custom API] Site synced: ${siteId}`);
  } catch (error) {
    console.error(`[Custom API] Sync error for site ${siteId}:`, error);

    // 更新错误状态
    await db()
      .update(monitoredSites)
      .set({
        status: 'error',
        lastErrorAt: new Date(),
        lastErrorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      .where(eq(monitoredSites.id, siteId));

    throw error;
  }
}

/**
 * 测试自定义 API 配置
 */
export async function testCustomApiConfig(config: CustomApiConfig) {
  try {
    const startTime = Date.now();
    const data = await fetchCustomApi(config);
    const responseTime = Date.now() - startTime;

    return {
      success: true,
      responseTime,
      data,
      message: 'API configuration is valid',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'API configuration test failed',
    };
  }
}

/**
 * 预设的自定义 API 模板
 */
export const CUSTOM_API_TEMPLATES = {
  // Plausible Analytics
  plausible: {
    name: 'Plausible Analytics',
    config: {
      url: 'https://plausible.io/api/v1/stats/aggregate',
      method: 'GET' as const,
      auth: {
        type: 'bearer' as const,
        token: '', // 用户需要填写
      },
      dataPath: 'results',
    },
    metrics: [
      {
        name: 'visitors',
        label: '访客数',
        jsonPath: 'visitors.value',
        type: 'number' as const,
        format: 'number' as const,
      },
      {
        name: 'pageviews',
        label: '浏览量',
        jsonPath: 'pageviews.value',
        type: 'number' as const,
        format: 'number' as const,
      },
    ],
  },

  // Custom REST API
  restApi: {
    name: 'Custom REST API',
    config: {
      url: '', // 用户需要填写
      method: 'GET' as const,
      headers: {},
      auth: {
        type: 'apikey' as const,
        apiKey: '',
        apiKeyHeader: 'X-API-Key',
      },
    },
    metrics: [
      {
        name: 'value',
        label: '数值',
        jsonPath: 'data.value',
        type: 'number' as const,
        format: 'number' as const,
      },
    ],
  },
};







