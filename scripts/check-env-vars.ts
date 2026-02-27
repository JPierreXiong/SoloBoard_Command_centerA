/**
 * 检查环境变量配置
 * 用于诊断 Vercel 部署后的环境变量问题
 * 
 * 使用方法：
 * pnpm tsx scripts/check-env-vars.ts
 */

console.log('🔍 检查环境变量配置...\n');

const requiredVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
  'DATABASE_URL': process.env.DATABASE_URL,
  'AUTH_SECRET': process.env.AUTH_SECRET,
  'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
  'AUTH_URL': process.env.AUTH_URL,
};

const optionalVars = {
  'BLOB_READ_WRITE_TOKEN': process.env.BLOB_READ_WRITE_TOKEN,
  'SHIPANY_API_KEY': process.env.SHIPANY_API_KEY,
  'RESEND_API_KEY': process.env.RESEND_API_KEY,
};

console.log('📋 必需环境变量：');
let missingRequired = false;
for (const [key, value] of Object.entries(requiredVars)) {
  const exists = !!value;
  const status = exists ? '✅' : '❌';
  const displayValue = exists 
    ? (key.includes('SECRET') || key.includes('KEY') 
        ? `${value.substring(0, 20)}...` 
        : value)
    : '未设置';
  
  console.log(`  ${status} ${key}: ${displayValue}`);
  if (!exists) {
    missingRequired = true;
  }
}

console.log('\n📋 可选环境变量：');
for (const [key, value] of Object.entries(optionalVars)) {
  const exists = !!value;
  const status = exists ? '✅' : '⚠️';
  const displayValue = exists 
    ? (key.includes('SECRET') || key.includes('KEY') 
        ? `${value.substring(0, 20)}...` 
        : value)
    : '未设置';
  
  console.log(`  ${status} ${key}: ${displayValue}`);
}

console.log('\n🔍 环境变量验证：');

// 验证 Supabase URL 格式
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  if (!supabaseUrl.startsWith('https://')) {
    console.log('  ❌ NEXT_PUBLIC_SUPABASE_URL 必须以 https:// 开头');
  } else if (!supabaseUrl.includes('.supabase.co')) {
    console.log('  ⚠️  NEXT_PUBLIC_SUPABASE_URL 格式可能不正确（应包含 .supabase.co）');
  } else {
    console.log('  ✅ NEXT_PUBLIC_SUPABASE_URL 格式正确');
  }
} else {
  console.log('  ❌ NEXT_PUBLIC_SUPABASE_URL 未设置');
}

// 验证 AUTH_SECRET
const authSecret = process.env.AUTH_SECRET;
if (authSecret) {
  if (authSecret.length < 32) {
    console.log('  ⚠️  AUTH_SECRET 长度可能不足（建议至少 32 字符）');
  } else {
    console.log('  ✅ AUTH_SECRET 已设置');
  }
} else {
  console.log('  ❌ AUTH_SECRET 未设置');
}

console.log('\n📊 检查结果：');
if (missingRequired) {
  console.log('  ❌ 缺少必需的环境变量！');
  console.log('\n💡 解决方案：');
  console.log('  1. 前往 Vercel Dashboard -> Settings -> Environment Variables');
  console.log('  2. 确保所有必需变量都已设置');
  console.log('  3. 确保变量已勾选 Production、Preview、Development 环境');
  console.log('  4. 重新部署项目（Redeploy）');
  process.exit(1);
} else {
  console.log('  ✅ 所有必需的环境变量都已设置');
  console.log('\n💡 如果仍然遇到问题：');
  console.log('  1. 确保在 Vercel 中重新部署了项目');
  console.log('  2. 检查浏览器控制台是否有其他错误');
  console.log('  3. 确认用户已登录（401 错误可能是未登录）');
  process.exit(0);
}
