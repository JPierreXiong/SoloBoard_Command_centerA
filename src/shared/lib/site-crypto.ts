/**
 * SoloBoard - 站点 API 配置加密工具
 * 
 * 用于加密和解密用户的 API Key、Client Secret 等敏感信息
 * 使用 AES-256-CBC 算法，确保数据库中的敏感信息安全
 * 
 * ⚠️ 安全要求：
 * 1. 必须在 .env.local 中配置 ENCRYPTION_KEY（32 字节）
 * 2. 生成命令: openssl rand -base64 32
 * 3. 不要将 ENCRYPTION_KEY 提交到 Git
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size

/**
 * 获取加密密钥
 * 从环境变量中读取，如果不存在则抛出错误
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY is not set in environment variables. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }
  
  // 确保密钥长度为 32 字节（256 位）
  const keyBuffer = Buffer.from(key, 'base64');
  
  if (keyBuffer.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be 32 bytes (256 bits). Current length: ${keyBuffer.length} bytes. ` +
      'Generate a new one with: openssl rand -base64 32'
    );
  }
  
  return keyBuffer;
}

/**
 * 加密站点 API 配置
 * 
 * @param plaintext - 要加密的明文（通常是 JSON 字符串）
 * @returns 加密后的字符串，格式：iv:encryptedData（十六进制）
 * 
 * @example
 * ```typescript
 * const config = {
 *   apiKey: 'sk_test_xxx',
 *   clientSecret: 'secret_xxx'
 * };
 * const encrypted = encryptSiteConfig(JSON.stringify(config));
 * ```
 */
export function encryptSiteConfig(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // 返回格式：iv:encryptedData
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt site configuration');
  }
}

/**
 * 解密站点 API 配置
 * 
 * @param ciphertext - 加密的字符串，格式：iv:encryptedData
 * @returns 解密后的明文
 * 
 * @example
 * ```typescript
 * const encrypted = 'abc123:def456...';
 * const decrypted = decryptSiteConfig(encrypted);
 * const config = JSON.parse(decrypted);
 * ```
 */
export function decryptSiteConfig(ciphertext: string): string {
  try {
    const key = getEncryptionKey();
    const parts = ciphertext.split(':');
    
    if (parts.length !== 2) {
      throw new Error('Invalid ciphertext format. Expected format: iv:encryptedData');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt site configuration');
  }
}

/**
 * 站点 API 配置类型定义
 */
export interface SiteApiConfig {
  // Google Analytics 4
  ga4?: {
    propertyId: string; // GA4 Property ID (e.g., "123456789")
    credentials: string; // Service Account JSON (stringified)
  };
  
  // Stripe
  stripe?: {
    secretKey: string; // sk_test_xxx or sk_live_xxx
    publishableKey?: string; // pk_test_xxx or pk_live_xxx
  };
  
  // Lemon Squeezy
  lemonSqueezy?: {
    apiKey: string; // API Key
    storeId: string; // Store ID
  };
  
  // Shopify
  shopify?: {
    shopDomain: string; // mystore.myshopify.com
    accessToken: string; // Admin API access token
  };
  
  // Uptime 监控（自定义）
  uptime?: {
    url: string; // 要监控的 URL
    interval?: number; // 检查间隔（秒）
  };
  
  // Custom API
  customApi?: {
    url: string;
    method?: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: string;
    auth?: {
      type: 'bearer' | 'basic' | 'apikey';
      token?: string;
      username?: string;
      password?: string;
      apiKey?: string;
      apiKeyHeader?: string;
    };
    dataPath?: string;
    transform?: string;
    metrics?: Array<{
      name: string;
      label: string;
      jsonPath: string;
      type: 'number' | 'string' | 'boolean';
      format?: 'currency' | 'percentage' | 'number';
      unit?: string;
    }>;
  };
}

/**
 * 加密站点 API 配置对象
 * 
 * @param config - API 配置对象
 * @returns 加密后的字符串
 */
export function encryptSiteConfigObject(config: SiteApiConfig): string {
  return encryptSiteConfig(JSON.stringify(config));
}

/**
 * 解密站点 API 配置对象
 * 
 * @param encrypted - 加密的字符串
 * @returns API 配置对象
 */
export function decryptSiteConfigObject(encrypted: string): SiteApiConfig {
  const decrypted = decryptSiteConfig(encrypted);
  return JSON.parse(decrypted) as SiteApiConfig;
}

/**
 * 验证加密密钥是否正确配置
 * 
 * @returns true 如果密钥配置正确
 */
export function validateEncryptionKey(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

/**
 * 测试加密/解密功能
 * 仅用于开发环境测试
 */
export function testEncryption(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('testEncryption should not be called in production');
  }
  
  const testData = {
    stripe: {
      secretKey: 'sk_test_123456789',
      publishableKey: 'pk_test_123456789',
    },
  };
  
  console.log('🔐 Testing encryption...');
  console.log('Original:', testData);
  
  const encrypted = encryptSiteConfigObject(testData);
  console.log('Encrypted:', encrypted);
  
  const decrypted = decryptSiteConfigObject(encrypted);
  console.log('Decrypted:', decrypted);
  
  const isMatch = JSON.stringify(testData) === JSON.stringify(decrypted);
  console.log('✅ Test result:', isMatch ? 'PASSED' : 'FAILED');
}

// Aliases for backward compatibility
export const encryptApiConfig = encryptSiteConfig;
export const decryptApiConfig = decryptSiteConfig;


