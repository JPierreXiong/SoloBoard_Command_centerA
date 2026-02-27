#!/usr/bin/env tsx
/**
 * 检查必需的环境变量是否已配置
 */
import { config } from 'dotenv';
import { resolve } from 'path';

// 加载 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') });

const requiredEnvVars = [
  'NEXT_PUBLIC_APP_URL',
  'DATABASE_URL',
  'AUTH_SECRET',
  'SHIPANY_API_KEY',
  'SHIPANY_MERCHANDISE_ID',
];

const optionalEnvVars = [
  'RESEND_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

console.log('🔍 检查环境变量配置...\n');

let hasErrors = false;
const missing: string[] = [];
const present: string[] = [];

// 检查必需变量
console.log('📋 必需环境变量:');
requiredEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value || value.trim() === '') {
    missing.push(varName);
    console.log(`  ❌ ${varName}: 未设置`);
    hasErrors = true;
  } else {
    present.push(varName);
    // 隐藏敏感信息
    const displayValue = varName.includes('KEY') || varName.includes('SECRET')
      ? `${value.substring(0, 8)}...`
      : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
  }
});

console.log('\n📋 可选环境变量:');
optionalEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (value && value.trim() !== '') {
    const displayValue = varName.includes('KEY') || varName.includes('SECRET')
      ? `${value.substring(0, 8)}...`
      : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`  ⚠️  ${varName}: 未设置（可选）`);
  }
});

console.log('\n' + '='.repeat(60));

if (hasErrors) {
  console.log('\n❌ 发现缺失的必需环境变量！');
  console.log('\n请确保 .env.local 文件中包含以下变量：\n');
  missing.forEach((varName) => {
    console.log(`  ${varName}=your-value-here`);
  });
  console.log('\n参考文件: env.digital-heirloom.example.txt');
  process.exit(1);
} else {
  console.log('\n✅ 所有必需环境变量已配置！');
  process.exit(0);
}
