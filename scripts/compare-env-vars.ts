/**
 * 对比代码中使用的环境变量与 Vercel 中的变量
 * 确保完全匹配
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'rF4aDNj4aTRotWfhKQAzVNQd';
const PROJECT_NAME = 'shipany-digital-heirloom';
const VERCEL_API_URL = 'https://api.vercel.com';

// 从代码扫描结果读取（如果存在）
let codeEnvVars: string[] = [];

try {
  const codeEnvVarsData = require('../scripts/code-env-vars.json');
  codeEnvVars = codeEnvVarsData.all || [];
} catch {
  // 如果文件不存在，使用手动列表（基于代码扫描）
  codeEnvVars = [
    // Supabase
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_URL',
    
    // 数据库
    'DATABASE_URL',
    'POSTGRES_URL_NON_POOLING',
    'DATABASE_PROVIDER',
    'DB_SINGLETON_ENABLED',
    
    // 认证
    'AUTH_SECRET',
    'AUTH_URL',
    
    // 应用配置
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_APP_NAME',
    'NEXT_PUBLIC_THEME',
    'NEXT_PUBLIC_APPEARANCE',
    'NEXT_PUBLIC_DEFAULT_LOCALE',
    'NEXT_PUBLIC_DEBUG',
    
    // Vercel Blob
    'BLOB_READ_WRITE_TOKEN',
    'STORAGE_PROVIDER',
    
    // ShipAny
    'SHIPANY_API_KEY',
    'SHIPANY_MERCHANDISE_ID',
    'SHIPANY_API_URL',
    'SHIPANY_SHOP_ID',
    'SHIPANY_SENDER_NAME',
    'SHIPANY_SENDER_PHONE',
    'SHIPANY_SENDER_EMAIL',
    'SHIPANY_SENDER_ADDRESS_LINE1',
    'SHIPANY_SENDER_ADDRESS_LINE2',
    'SHIPANY_SENDER_CITY',
    'SHIPANY_SENDER_STATE',
    'SHIPANY_SENDER_ZIP_CODE',
    'SHIPANY_SENDER_COUNTRY_CODE',
    
    // Resend
    'RESEND_API_KEY',
    'RESEND_DEFAULT_FROM',
    
    // Creem
    'CREEM_ENABLED',
    'CREEM_ENVIRONMENT',
    'CREEM_API_KEY',
    'CREEM_SIGNING_SECRET',
    'CREEM_PRODUCT_IDS',
    'CREEM_SHIPPING_FEE_PRODUCT_ID',
    
    // Stripe (可选)
    'STRIPE_ENABLED',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SIGNING_SECRET',
    
    // PayPal (可选)
    'PAYPAL_ENABLED',
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET',
    'PAYPAL_ENVIRONMENT',
    
    // 其他
    'DEFAULT_PAYMENT_PROVIDER',
    'SELECT_PAYMENT_ENABLED',
    'NODE_ENV',
    'NEXT_RUNTIME',
  ];
}

interface VercelEnvVar {
  key: string;
  value: string;
  type: string;
  target?: string[];
  id?: string;
}

async function getProjectId(): Promise<string | null> {
  try {
    const response = await fetch(`${VERCEL_API_URL}/v9/projects/${PROJECT_NAME}`, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error(`❌ 获取项目信息失败: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.id || null;
  } catch (error: any) {
    console.error('❌ 获取项目 ID 失败:', error.message);
    return null;
  }
}

async function getVercelEnvVars(projectId: string): Promise<VercelEnvVar[]> {
  try {
    const response = await fetch(`${VERCEL_API_URL}/v10/projects/${projectId}/env`, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`获取环境变量失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.envs || [];
  } catch (error: any) {
    console.error('❌ 获取环境变量失败:', error.message);
    return [];
  }
}

async function main() {
  console.log('🔍 对比代码与 Vercel 环境变量...\n');
  
  const projectId = await getProjectId();
  if (!projectId) {
    console.error('❌ 无法获取项目 ID');
    process.exit(1);
  }
  
  console.log(`✅ 项目 ID: ${projectId}\n`);
  
  const vercelVars = await getVercelEnvVars(projectId);
  const vercelVarNames = new Set(vercelVars.map(v => v.key));
  const codeVarNames = new Set(codeEnvVars);
  
  console.log(`📋 代码中使用的变量: ${codeVarNames.size}`);
  console.log(`📋 Vercel 中的变量: ${vercelVarNames.size}\n`);
  
  // 找出缺失的变量
  const missingInVercel = codeEnvVars.filter(v => !vercelVarNames.has(v));
  const extraInVercel = Array.from(vercelVarNames).filter(v => !codeVarNames.has(v));
  
  // 必需变量（基于代码分析）
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'AUTH_SECRET',
    'AUTH_URL',
    'NEXT_PUBLIC_APP_URL',
  ];
  
  const missingRequired = missingInVercel.filter(v => requiredVars.includes(v));
  const missingOptional = missingInVercel.filter(v => !requiredVars.includes(v));
  
  // 输出结果
  if (missingRequired.length > 0) {
    console.log('❌ 缺失的必需变量（代码使用但 Vercel 中没有）：\n');
    for (const varName of missingRequired) {
      console.log(`  ❌ ${varName}`);
    }
    console.log('');
  }
  
  if (missingOptional.length > 0) {
    console.log('⚠️  缺失的可选变量（代码使用但 Vercel 中没有）：\n');
    for (const varName of missingOptional) {
      console.log(`  ⚠️  ${varName}`);
    }
    console.log('');
  }
  
  if (extraInVercel.length > 0) {
    console.log('ℹ️  Vercel 中的额外变量（代码未使用）：\n');
    for (const varName of extraInVercel) {
      // 过滤掉系统变量和已知的额外变量
      if (
        !varName.startsWith('VERCEL_') &&
        !varName.startsWith('NEXT_') &&
        !varName.includes('digital_heirloom') // 已删除的错误变量
      ) {
        console.log(`  ℹ️  ${varName}`);
      }
    }
    console.log('');
  }
  
  // 检查环境范围
  console.log('🔍 检查环境变量作用域：\n');
  const productionVars = vercelVars.filter(v => v.target?.includes('production'));
  const previewVars = vercelVars.filter(v => v.target?.includes('preview'));
  const developmentVars = vercelVars.filter(v => v.target?.includes('development'));
  
  console.log(`  Production: ${productionVars.length} 个变量`);
  console.log(`  Preview: ${previewVars.length} 个变量`);
  console.log(`  Development: ${developmentVars.length} 个变量\n`);
  
  // 检查必需变量是否在所有环境中
  for (const varName of requiredVars) {
    const varInVercel = vercelVars.find(v => v.key === varName);
    if (varInVercel) {
      const targets = varInVercel.target || [];
      const missingEnvs = ['production', 'preview', 'development'].filter(
        env => !targets.includes(env)
      );
      
      if (missingEnvs.length > 0) {
        console.log(`  ⚠️  ${varName} 缺少环境: ${missingEnvs.join(', ')}`);
      } else {
        console.log(`  ✅ ${varName} 在所有环境中`);
      }
    }
  }
  
  // 总结
  console.log('\n📊 对比结果：');
  console.log(`  ✅ 匹配的变量: ${codeVarNames.size - missingInVercel.length}`);
  console.log(`  ❌ 缺失的必需变量: ${missingRequired.length}`);
  console.log(`  ⚠️  缺失的可选变量: ${missingOptional.length}`);
  console.log(`  ℹ️  额外的变量: ${extraInVercel.length}`);
  
  if (missingRequired.length === 0 && missingOptional.length === 0) {
    console.log('\n✅ 所有代码中使用的环境变量都在 Vercel 中存在！');
    process.exit(0);
  } else {
    console.log('\n❌ 发现不匹配的变量，请修复后再部署！');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
