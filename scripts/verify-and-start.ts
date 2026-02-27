#!/usr/bin/env tsx
/**
 * 验证 .env.local 文件并启动服务器
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const projectRoot = process.cwd();
const envLocalPath = join(projectRoot, '.env.local');
const examplePath = join(projectRoot, 'env.digital-heirloom.example.txt');

console.log('🔍 检查环境变量配置...\n');

// 检查 .env.local 是否存在
if (!existsSync(envLocalPath)) {
  console.log('❌ .env.local 文件不存在！');
  console.log(`\n正在从示例文件创建: ${envLocalPath}\n`);
  
  if (existsSync(examplePath)) {
    const exampleContent = readFileSync(examplePath, 'utf-8');
    // 生成 AUTH_SECRET
    const crypto = require('crypto');
    const authSecret = crypto.randomBytes(32).toString('base64');
    const updatedContent = exampleContent.replace(
      /AUTH_SECRET=.*/,
      `AUTH_SECRET=${authSecret}`
    );
    
    require('fs').writeFileSync(envLocalPath, updatedContent, 'utf-8');
    console.log('✅ .env.local 文件已创建\n');
  } else {
    console.log('❌ 找不到示例文件:', examplePath);
    process.exit(1);
  }
}

// 读取 .env.local
const envContent = readFileSync(envLocalPath, 'utf-8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// 检查必需变量
const required = [
  'NEXT_PUBLIC_APP_URL',
  'DATABASE_URL',
  'AUTH_SECRET',
  'SHIPANY_API_KEY',
  'SHIPANY_MERCHANDISE_ID',
];

const missing: string[] = [];
const present: string[] = [];

console.log('📋 必需环境变量检查:');
required.forEach((varName) => {
  const value = envVars[varName];
  if (!value || value === '' || value.includes('your-') || value.includes('here')) {
    missing.push(varName);
    console.log(`  ❌ ${varName}: 未设置或使用占位符`);
  } else {
    present.push(varName);
    const displayValue = varName.includes('KEY') || varName.includes('SECRET')
      ? `${value.substring(0, 12)}...`
      : value.length > 50
      ? `${value.substring(0, 50)}...`
      : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
  }
});

console.log('\n' + '='.repeat(60));

if (missing.length > 0) {
  console.log('\n❌ 发现缺失或未配置的必需环境变量！');
  console.log('\n请在 .env.local 文件中配置以下变量：\n');
  missing.forEach((varName) => {
    console.log(`  ${varName}=your-value-here`);
  });
  console.log('\n参考文件: env.digital-heirloom.example.txt');
  console.log('\n⚠️  配置完成后，请重新运行此脚本启动服务器。');
  process.exit(1);
}

console.log('\n✅ 所有必需环境变量已配置！');
console.log('\n🚀 正在启动开发服务器...\n');

// 启动服务器
try {
  execSync('pnpm dev', { 
    stdio: 'inherit',
    cwd: projectRoot,
    env: { ...process.env, ...envVars }
  });
} catch (error) {
  console.error('\n❌ 服务器启动失败');
  process.exit(1);
}
