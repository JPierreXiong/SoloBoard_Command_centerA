/**
 * 设置 Vercel 环境变量脚本
 * 使用 Vercel API 批量设置环境变量
 */

const VERCEL_TOKEN = 'rF4aDNj4aTRotWfhKQAzVNQd';
const VERCEL_API_URL = 'https://api.vercel.com';

// 需要设置的环境变量
const envVars = {
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
};

// 环境类型：production, preview, development
const environments = ['production', 'preview', 'development'] as const;

async function getProjectId(projectName: string): Promise<string | null> {
  try {
    const response = await fetch(`${VERCEL_API_URL}/v9/projects/${projectName}`, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error(`❌ 项目 "${projectName}" 未找到`);
        return null;
      }
      throw new Error(`获取项目信息失败: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('获取项目 ID 失败:', error);
    return null;
  }
}

async function setEnvVar(
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

    if (!response.ok) {
      const error = await response.text();
      console.error(`  ❌ 设置 ${key} (${environment}) 失败:`, error);
      return false;
    }

    console.log(`  ✅ ${key} (${environment})`);
    return true;
  } catch (error) {
    console.error(`  ❌ 设置 ${key} (${environment}) 失败:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 开始设置 Vercel 环境变量...\n');

  // 项目名称
  const projectName = 'shipany-digital-heirloom';

  console.log(`📦 项目名称: ${projectName}`);
  console.log(`🔑 Token: ${VERCEL_TOKEN.substring(0, 10)}...\n`);

  // 获取项目 ID
  console.log('🔍 获取项目信息...');
  const projectId = await getProjectId(projectName);

  if (!projectId) {
    console.error('\n❌ 无法获取项目 ID，请检查：');
    console.error('  1. Token 是否正确');
    console.error('  2. 项目名称是否正确');
    console.error('  3. Token 是否有项目访问权限');
    process.exit(1);
  }

  console.log(`✅ 项目 ID: ${projectId}\n`);

  // 设置环境变量
  console.log('📝 设置环境变量...\n');
  let successCount = 0;
  let failCount = 0;

  for (const [key, value] of Object.entries(envVars)) {
    console.log(`设置 ${key}:`);
    
    for (const env of environments) {
      const success = await setEnvVar(projectId, key, value, env);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // 避免 API 限流
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('');
  }

  console.log('\n📊 设置结果:');
  console.log(`  ✅ 成功: ${successCount}`);
  console.log(`  ❌ 失败: ${failCount}`);
  console.log('\n✨ 完成！请到 Vercel Dashboard 验证环境变量。');
}

main().catch(console.error);
