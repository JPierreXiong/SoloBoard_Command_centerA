#!/usr/bin/env tsx
/**
 * 生成 AUTH_SECRET 并更新 .env.local 文件
 */
import { randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const projectRoot = process.cwd();
const envLocalPath = resolve(projectRoot, '.env.local');

// 生成 32 字节的随机字符串，然后转换为 base64
const authSecret = randomBytes(32).toString('base64');

console.log('🔐 生成新的 AUTH_SECRET...\n');
console.log(`生成的 AUTH_SECRET: ${authSecret}\n`);

if (!existsSync(envLocalPath)) {
  console.log('❌ .env.local 文件不存在！');
  console.log('请先运行: npx tsx scripts/update-env-local.ts');
  process.exit(1);
}

// 读取文件
let content = readFileSync(envLocalPath, 'utf-8');

// 替换 AUTH_SECRET
const oldPattern = /AUTH_SECRET=.*/;
if (oldPattern.test(content)) {
  content = content.replace(oldPattern, `AUTH_SECRET=${authSecret}`);
  console.log('✅ 已更新 .env.local 中的 AUTH_SECRET');
} else {
  // 如果没有找到，添加到文件末尾
  content += `\nAUTH_SECRET=${authSecret}\n`;
  console.log('✅ 已添加 AUTH_SECRET 到 .env.local');
}

// 写入文件
writeFileSync(envLocalPath, content, 'utf-8');

console.log('\n✅ AUTH_SECRET 已成功配置！');
console.log('\n📋 下一步:');
console.log('   1. 重启开发服务器（如果正在运行）');
console.log('   2. 运行环境变量检查: npx tsx scripts/check-env.ts\n');
