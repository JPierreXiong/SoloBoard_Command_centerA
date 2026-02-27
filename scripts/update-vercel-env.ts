/**
 * 更新 Vercel 环境变量脚本
 * 先删除再创建，或使用 PATCH 更新
 */

const VERCEL_TOKEN = 'rF4aDNj4aTRotWfhKQAzVNQd';
const VERCEL_API_URL = 'https://api.vercel.com';
const PROJECT_NAME = 'shipany-digital-heirloom';

// 需要设置的环境变量
const envVars = {
  // 基础应用配置
  'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL || 'https://www.digitalheirloom.app',
  'NEXT_PUBLIC_APP_NAME': 'Digital Heirloom',
  
  // 认证配置（必需）
  'AUTH_SECRET': '6doOS5VaVh4CEVpYXaG0BrupEuVCPPxt7B4/02O/ucQ=',
  'AUTH_URL': process.env.AUTH_URL || 'https://www.digitalheirloom.app',
  
  // Supabase 配置
  'NEXT_PUBLIC_SUPABASE_URL': 'https://vkafrwwskupsyibrvcvd.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrYWZyd3dza3Vwc3lpYnJ2Y3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NDE0NTcsImV4cCI6MjA4MzUxNzQ1N30.mpur4h25R891qzycu9A38QIveUCHMigEM3yPLx8EmMg',
  'SUPABASE_SERVICE_ROLE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrYWZyd3dza3Vwc3lpYnJ2Y3ZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk0MTQ1NywiZXhwIjoyMDgzNTE3NDU3fQ.g-zsgOAF5R8w5IQQWUbrGohyfbN1opZWYBDjlq-hgE8',
  'SUPABASE_URL': 'https://vkafrwwskupsyibrvcvd.supabase.co',
  
  // 数据库配置
  'DATABASE_URL': 'postgres://postgres.vkafrwwskupsyibrvcvd:lEuluFvxDT90QiFz@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true',
  'POSTGRES_URL_NON_POOLING': 'postgres://postgres.vkafrwwskupsyibrvcvd:lEuluFvxDT90QiFz@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
  
  // Vercel Blob
  'BLOB_READ_WRITE_TOKEN': 'vercel_blob_rw_T1QruDd1XViT9FhM_y9TAKwEjlSRuuQXRo9B5vJKNyGulcJ',
  
  // ShipAny 配置（物理资产寄送）
  'SHIPANY_API_KEY': 'e50e2b3d-a412-4f90-95eb-aafc9837b9ea',
  'SHIPANY_MERCHANDISE_ID': '1955cf99-daf3-4587-a698-2c28ea9180cc',
  'SHIPANY_API_URL': 'https://api.shipany.io/v1',
  
  // Resend 邮件服务配置
  'RESEND_API_KEY': 're_JrzLE2sa_HAe9ZVgzmszQ1iepVhRUS4Ci',
  'RESEND_DEFAULT_FROM': 'security@afterglow.app',
  
  // Creem 支付配置
  'CREEM_ENABLED': 'true',
  'CREEM_ENVIRONMENT': 'production',
  'CREEM_API_KEY': 'creem_2HGGaY2qzPVRkCP0kESZXU',
  'CREEM_SIGNING_SECRET': 'whsec_567Ldwvldo5m33S87geqWy',
  'CREEM_PRODUCT_IDS': JSON.stringify({
    "digital-heirloom-base-annual": "prod_4oN2BFtSPSpAnYcvUN0uoi",
    "digital-heirloom-pro-annual": "prod_4epepOcgUjSjPoWmAnBaFt"
  }),
};

const environments = ['production', 'preview', 'development'] as const;

async function getProjectId(): Promise<string | null> {
  try {
    const response = await fetch(`${VERCEL_API_URL}/v9/projects/${PROJECT_NAME}`, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`获取项目信息失败: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('获取项目 ID 失败:', error);
    return null;
  }
}

async function getEnvVars(projectId: string): Promise<any[]> {
  try {
    const response = await fetch(
      `${VERCEL_API_URL}/v9/projects/${projectId}/env`,
      {
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`获取环境变量失败: ${response.statusText}`);
    }

    const data = await response.json();
    return data.envs || [];
  } catch (error) {
    console.error('获取环境变量失败:', error);
    return [];
  }
}

async function deleteEnvVar(projectId: string, envVarId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${VERCEL_API_URL}/v9/projects/${projectId}/env/${envVarId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
        },
      }
    );

    return response.ok;
  } catch (error) {
    return false;
  }
}

async function createEnvVar(
  projectId: string,
  key: string,
  value: string,
  environment: typeof environments[number]
): Promise<boolean> {
  try {
    const response = await fetch(
      `${VERCEL_API_URL}/v10/projects/${projectId}/env`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value,
          type: 'encrypted',
          target: [environment],
        }),
      }
    );

    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🚀 开始更新 Vercel 环境变量...\n');

  const projectId = await getProjectId();
  if (!projectId) {
    console.error('❌ 无法获取项目 ID');
    process.exit(1);
  }

  console.log(`✅ 项目 ID: ${projectId}\n`);

  // 获取现有环境变量
  console.log('🔍 获取现有环境变量...');
  const existingEnvs = await getEnvVars(projectId);
  console.log(`找到 ${existingEnvs.length} 个现有环境变量\n`);

  // 更新环境变量
  console.log('📝 更新环境变量...\n');
  let successCount = 0;
  let failCount = 0;

  for (const [key, value] of Object.entries(envVars)) {
    console.log(`处理 ${key}:`);

    // 查找现有的环境变量
    const existing = existingEnvs.filter((env: any) => env.key === key);

    if (existing.length > 0) {
      // 删除现有的
      for (const env of existing) {
        await deleteEnvVar(projectId, env.id);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // 创建新的
    for (const env of environments) {
      const success = await createEnvVar(projectId, key, value, env);
      if (success) {
        console.log(`  ✅ ${env}`);
        successCount++;
      } else {
        console.log(`  ❌ ${env}`);
        failCount++;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('');
  }

  console.log('\n📊 更新结果:');
  console.log(`  ✅ 成功: ${successCount}`);
  console.log(`  ❌ 失败: ${failCount}`);
  console.log('\n✨ 完成！请到 Vercel Dashboard 验证环境变量。');
}

main().catch(console.error);
