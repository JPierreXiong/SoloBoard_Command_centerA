const fs = require('fs');
const path = require('path');

// 读取 .env.local 文件
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

// 解析环境变量
const envVars = {};
envLines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

console.log('='.repeat(60));
console.log('环境变量检查报告');
console.log('='.repeat(60));
console.log('');

// 必需的环境变量
const required = [
  { key: 'DATABASE_URL', desc: '数据库连接地址' },
  { key: 'AUTH_SECRET', desc: '认证密钥' },
  { key: 'ENCRYPTION_KEY', desc: '加密密钥' },
  { key: 'QSTASH_TOKEN', desc: 'QStash Token' },
  { key: 'QSTASH_CURRENT_SIGNING_KEY', desc: 'QStash 当前签名密钥' },
  { key: 'QSTASH_NEXT_SIGNING_KEY', desc: 'QStash 下一个签名密钥' },
];

console.log('【必需环境变量】');
console.log('-'.repeat(60));
let missingRequired = [];
required.forEach(({ key, desc }) => {
  const exists = envVars[key] && envVars[key].length > 0;
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${key}`);
  console.log(`   ${desc}`);
  if (exists) {
    const preview = envVars[key].substring(0, 30) + (envVars[key].length > 30 ? '...' : '');
    console.log(`   值: ${preview}`);
  } else {
    missingRequired.push(key);
  }
  console.log('');
});

// 推荐的环境变量
const recommended = [
  { key: 'NEXT_PUBLIC_APP_NAME', desc: '应用名称', default: 'SoloBoard Command Center' },
  { key: 'NEXT_PUBLIC_APP_URL', desc: '应用URL', default: 'http://localhost:3003' },
  { key: 'CREEM_ENABLED', desc: 'Creem支付开关', default: 'true' },
  { key: 'CREEM_API_KEY', desc: 'Creem API密钥', default: '' },
  { key: 'DEFAULT_PAYMENT_PROVIDER', desc: '默认支付提供商', default: 'creem' },
];

console.log('【推荐环境变量】');
console.log('-'.repeat(60));
let missingRecommended = [];
recommended.forEach(({ key, desc, default: defaultVal }) => {
  const exists = envVars[key] && envVars[key].length > 0;
  const status = exists ? '✅' : '⚠️ ';
  console.log(`${status} ${key}`);
  console.log(`   ${desc}`);
  if (exists) {
    const preview = envVars[key].substring(0, 30) + (envVars[key].length > 30 ? '...' : '');
    console.log(`   值: ${preview}`);
  } else {
    missingRecommended.push({ key, default: defaultVal });
    if (defaultVal) {
      console.log(`   建议值: ${defaultVal}`);
    }
  }
  console.log('');
});

// 总结
console.log('='.repeat(60));
console.log('总结');
console.log('='.repeat(60));
console.log('');

if (missingRequired.length === 0) {
  console.log('✅ 所有必需的环境变量都已配置！');
} else {
  console.log('❌ 缺少以下必需的环境变量:');
  missingRequired.forEach(key => console.log(`   - ${key}`));
}

console.log('');

if (missingRecommended.length > 0) {
  console.log('⚠️  建议添加以下环境变量:');
  missingRecommended.forEach(({ key, default: defaultVal }) => {
    console.log(`   - ${key}${defaultVal ? ` = ${defaultVal}` : ''}`);
  });
}

console.log('');
console.log('='.repeat(60));

// 如果有缺失的必需变量，退出码为1
if (missingRequired.length > 0) {
  process.exit(1);
}




