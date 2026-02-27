/**
 * SoloBoard - 环境变量生成脚本
 * 
 * 用于快速生成所需的加密密钥
 * 
 * 使用方法：
 * pnpm tsx scripts/generate-env-keys.ts
 */

import { randomBytes } from 'crypto';

console.log('🔐 SoloBoard - 环境变量密钥生成器\n');
console.log('=' .repeat(60));

// 生成 32 字节的随机密钥
function generateKey(): string {
  return randomBytes(32).toString('base64');
}

// 生成所有必需的密钥
const keys = {
  ENCRYPTION_KEY: generateKey(),
  AUTH_SECRET: generateKey(),
  CRON_SECRET: generateKey(),
};

console.log('\n📋 复制以下内容到你的 .env.local 文件：\n');
console.log('# ============================================');
console.log('# SoloBoard - 自动生成的密钥');
console.log('# 生成时间:', new Date().toISOString());
console.log('# ============================================\n');

console.log('# 站点配置加密密钥（32 字节）');
console.log(`ENCRYPTION_KEY=${keys.ENCRYPTION_KEY}\n`);

console.log('# 认证密钥（32 字节）');
console.log(`AUTH_SECRET=${keys.AUTH_SECRET}\n`);

console.log('# Cron Job 密钥（32 字节）');
console.log(`CRON_SECRET=${keys.CRON_SECRET}\n`);

console.log('# ============================================');
console.log('# 其他必需的环境变量（请手动填写）');
console.log('# ============================================\n');

console.log('# 应用 URL');
console.log('NEXT_PUBLIC_APP_URL=http://localhost:3000\n');

console.log('# 数据库连接');
console.log('DATABASE_URL=postgresql://user:password@host:5432/soloboard\n');

console.log('# 存储（Vercel Blob）');
console.log('BLOB_READ_WRITE_TOKEN=your-vercel-blob-token\n');

console.log('=' .repeat(60));
console.log('\n⚠️  安全提示：');
console.log('1. 不要将 .env.local 文件提交到 Git');
console.log('2. 生产环境使用不同的密钥');
console.log('3. 定期轮换密钥');
console.log('4. ENCRYPTION_KEY 泄露将导致所有用户的 API Key 暴露\n');

console.log('✅ 密钥生成完成！');
console.log('📝 下一步：复制上面的内容到 .env.local 文件\n');
























