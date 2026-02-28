/**
 * 环境变量验证工具
 * 用于在开发环境中检查必需的环境变量是否已配置
 * 
 * 注意：仅在开发环境中输出警告，不阻止应用启动
 */

const REQUIRED_ENV_VARS = {
  // 基础配置
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  
  // 数据库配置（必需）
  DATABASE_URL: undefined,
  
  // 认证配置（必需）
  AUTH_SECRET: undefined,
  
  // 加密配置（必需）
  ENCRYPTION_KEY: undefined,
  
  // QStash 配置（定时任务必需）
  QSTASH_TOKEN: undefined,
  QSTASH_CURRENT_SIGNING_KEY: undefined,
  QSTASH_NEXT_SIGNING_KEY: undefined,
} as const;

const OPTIONAL_ENV_VARS = {
  // 支付配置（可选）
  CREEM_API_KEY: undefined,
  CREEM_ENABLED: undefined,
  DEFAULT_PAYMENT_PROVIDER: undefined,
  
  // 邮件配置（可选 - 用于告警通知）
  RESEND_API_KEY: undefined,
  RESEND_SENDER_EMAIL: undefined,
  
  // 存储配置（可选）
  BLOB_READ_WRITE_TOKEN: undefined,
  STORAGE_PROVIDER: undefined,
  
  // Supabase 配置（Digital Heirloom 功能，可选）
  NEXT_PUBLIC_SUPABASE_URL: undefined,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
  SUPABASE_SERVICE_ROLE_KEY: undefined,
  
  // ShipAny 配置（Digital Heirloom 功能，可选）
  SHIPANY_API_KEY: undefined,
  SHIPANY_MERCHANDISE_ID: undefined,
} as const;

/**
 * 验证环境变量
 * 仅在开发环境中输出警告
 */
export function validateEnvVars() {
  // 仅在开发环境中验证
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const missing: string[] = [];
  const warnings: string[] = [];

  // 检查必需的环境变量
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, defaultValue]) => {
    const value = process.env[key];
    if (!value && !defaultValue) {
      missing.push(key);
    }
  });

  // 检查可选但推荐的环境变量
  Object.keys(OPTIONAL_ENV_VARS).forEach((key) => {
    const value = process.env[key];
    if (!value) {
      warnings.push(key);
    }
  });

  // 输出警告信息
  if (missing.length > 0) {
    console.warn('');
    console.warn('⚠️  Missing required environment variables:');
    missing.forEach((key) => {
      console.warn(`   - ${key}`);
    });
    console.warn('');
    console.warn('💡 Please check your .env.local file and ensure all required variables are set.');
    console.warn('');
  }

  if (warnings.length > 0 && process.env.NEXT_PUBLIC_DEBUG === 'true') {
    console.warn('');
    console.warn('💡 Optional environment variables (recommended):');
    warnings.forEach((key) => {
      console.warn(`   - ${key}`);
    });
    console.warn('');
  }

  // 验证 Supabase 配置格式（如果配置了的话）
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL should start with https://');
  }

  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseKey && supabaseKey.length < 20) {
    console.warn('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY seems invalid (too short)');
  }

  return {
    missing,
    warnings,
    isValid: missing.length === 0,
  };
}

/**
 * 获取环境变量验证结果（用于 UI 显示）
 */
export function getEnvValidationStatus() {
  return validateEnvVars();
}


