/**
 * 环境变量检查脚本
 * 运行: node check-env.js
 * 用途: 确保所有必需的环境变量已正确配置
 */

const requiredEnvs = {
  // 基础认证
  AUTH_SECRET: '用于 Better Auth 会话加密',
  
  // 数据库
  DATABASE_URL: '数据库连接字符串',
  
  // 加密和安全
  ENCRYPTION_KEY: '用于加密 API Keys 和敏感配置',
  CRON_SECRET: '用于验证 Cron Job 请求的安全密钥',
  
  // 应用配置
  NEXT_PUBLIC_APP_URL: '应用的公开访问 URL',
};

const optionalEnvs = {
  // Upstash 调度 (解决 Vercel Hobby 限制)
  QSTASH_CURRENT_SIGNING_KEY: 'Upstash QStash 当前签名密钥',
  QSTASH_NEXT_SIGNING_KEY: 'Upstash QStash 下一个签名密钥',
  QSTASH_URL: 'Upstash QStash API URL',
  
  // Creem 支付 (用于 SoloBoard 自己收款)
  CREEM_API_KEY: 'Creem 支付平台 API 密钥',
  CREEM_SIGNING_SECRET: 'Creem Webhook 签名密钥',
  
  // Stripe 支付 (可选)
  STRIPE_SECRET_KEY: 'Stripe 支付平台密钥',
  STRIPE_SIGNING_SECRET: 'Stripe Webhook 签名密钥',
};

console.log('🔍 开始检查 SoloBoard 环境变量配置...\n');

// 检查必需的环境变量
const missing = [];
const configured = [];

Object.entries(requiredEnvs).forEach(([key, description]) => {
  if (!process.env[key]) {
    missing.push({ key, description });
  } else {
    configured.push({ key, description });
  }
});

// 检查可选的环境变量
const optionalMissing = [];
const optionalConfigured = [];

Object.entries(optionalEnvs).forEach(([key, description]) => {
  if (!process.env[key]) {
    optionalMissing.push({ key, description });
  } else {
    optionalConfigured.push({ key, description });
  }
});

// 输出结果
if (missing.length > 0) {
  console.error('❌ 缺失以下必需的环境变量:\n');
  missing.forEach(({ key, description }) => {
    console.error(`   - ${key}`);
    console.error(`     说明: ${description}\n`);
  });
  
  console.log('💡 解决方案:');
  console.log('1. 在 Vercel 控制台 Settings -> Environment Variables 中添加');
  console.log('2. 本地开发: 复制 .env.example 为 .env.local 并填写密钥');
  console.log('3. 同步 Vercel 变量到本地: vercel env pull .env.local\n');
  
  console.log('🔑 生成密钥的方法:');
  console.log('   PowerShell: [Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Minimum 0 -Maximum 255) }))');
  console.log('   OpenSSL: openssl rand -base64 32\n');
} else {
  console.log('✅ 所有必需的环境变量已配置:\n');
  configured.forEach(({ key, description }) => {
    console.log(`   ✓ ${key}`);
  });
  console.log('');
}

// 输出可选变量状态
if (optionalConfigured.length > 0) {
  console.log('📦 已配置的可选功能:\n');
  optionalConfigured.forEach(({ key, description }) => {
    console.log(`   ✓ ${key} - ${description}`);
  });
  console.log('');
}

if (optionalMissing.length > 0) {
  console.log('ℹ️  未配置的可选功能 (不影响核心功能):\n');
  optionalMissing.forEach(({ key, description }) => {
    console.log(`   - ${key} - ${description}`);
  });
  console.log('');
}

// 额外检查: i18n 文件
console.log('🌐 检查国际化文件...');
try {
  const enMessages = require('./messages/en.json');
  const requiredKeys = [
    'landing.zero-knowledge-security',
    'landing.hero-title',
    'landing.hero-description',
  ];
  
  const missingKeys = requiredKeys.filter(key => {
    const keys = key.split('.');
    let obj = enMessages;
    for (const k of keys) {
      if (!obj || !obj[k]) return true;
      obj = obj[k];
    }
    return false;
  });
  
  if (missingKeys.length > 0) {
    console.warn('⚠️  警告: messages/en.json 中缺少以下键值:');
    missingKeys.forEach(key => console.warn(`   - ${key}`));
    console.log('   这可能导致页面渲染错误 (500)。\n');
  } else {
    console.log('   ✓ 国际化文件完整\n');
  }
} catch (e) {
  console.warn('⚠️  无法加载 messages/en.json，请手动检查国际化文件。\n');
}

// 检查 vercel.json 配置
console.log('⚙️  检查 Vercel 配置...');
try {
  const vercelConfig = require('./vercel.json');
  
  if (vercelConfig.crons && vercelConfig.crons.length > 0) {
    console.log('   ✓ Vercel Cron Jobs 已配置:');
    vercelConfig.crons.forEach(cron => {
      console.log(`     - ${cron.path} (${cron.schedule})`);
    });
  } else {
    console.log('   ℹ️  未配置 Vercel 原生 Cron (可能使用 Upstash)');
  }
  console.log('');
} catch (e) {
  console.warn('⚠️  无法读取 vercel.json\n');
}

// 最终总结
console.log('═══════════════════════════════════════════════════════');
if (missing.length === 0) {
  console.log('🎉 环境检查通过！可以部署到 Vercel。');
  console.log('');
  console.log('📋 部署前最后检查:');
  console.log('   1. ✓ 所有必需环境变量已配置');
  console.log('   2. □ 在 Vercel 后台设置相同的环境变量');
  console.log('   3. □ 运行 pnpm build 确保构建成功');
  console.log('   4. □ 推送到 GitHub 触发自动部署');
} else {
  console.log('❌ 环境检查失败！请先配置缺失的环境变量。');
  process.exit(1);
}
console.log('═══════════════════════════════════════════════════════');







