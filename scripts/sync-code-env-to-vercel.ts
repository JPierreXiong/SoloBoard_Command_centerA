/**
 * 同步代码中需要的环境变量到 Vercel
 * 确保每个变量在所有环境（Production, Preview, Development）中都存在
 * 
 * 使用方法：
 * VERCEL_TOKEN=your-token pnpm tsx scripts/sync-code-env-to-vercel.ts
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'rF4aDNj4aTRotWfhKQAzVNQd';
const PROJECT_NAME = 'shipany-digital-heirloom';
const VERCEL_API_URL = 'https://api.vercel.com';

// 代码中实际使用的环境变量（必需变量）
const REQUIRED_ENV_VARS: Record<string, string> = {
  // Supabase 配置（必需）
  'NEXT_PUBLIC_SUPABASE_URL': 'https://vkafrwwskupsyibrvcvd.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrYWZyd3dza3Vwc3lpYnJ2Y3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NDE0NTcsImV4cCI6MjA4MzUxNzQ1N30.mpur4h25R891qzycu9A38QIveUCHMigEM3yPLx8EmMg',
  'SUPABASE_SERVICE_ROLE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrYWZyd3dza3Vwc3lpYnJ2Y3ZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk0MTQ1NywiZXhwIjoyMDgzNTE3NDU3fQ.g-zsgOAF5R8w5IQQWUbrGohyfbN1opZWYBDjlq-hgE8',
  'SUPABASE_URL': 'https://vkafrwwskupsyibrvcvd.supabase.co',
  
  // 数据库配置（必需）
  'DATABASE_URL': 'postgres://postgres.vkafrwwskupsyibrvcvd:lEuluFvxDT90QiFz@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true',
  'POSTGRES_URL_NON_POOLING': 'postgres://postgres.vkafrwwskupsyibrvcvd:lEuluFvxDT90QiFz@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
  
  // 认证配置（必需）
  'AUTH_SECRET': '6doOS5VaVh4CEVpYXaG0BrupEuVCPPxt7B4/02O/ucQ=',
  'AUTH_URL': 'https://www.digitalheirloom.app',
  
  // 应用配置（必需）
  'NEXT_PUBLIC_APP_URL': 'https://www.digitalheirloom.app',
  'NEXT_PUBLIC_APP_NAME': 'Digital Heirloom',
  
  // Vercel Blob（必需）
  'BLOB_READ_WRITE_TOKEN': 'vercel_blob_rw_T1QruDd1XViT9FhM_y9TAKwEjlSRuuQXRo9B5vJKNyGulcJ',
  
  // ShipAny 配置（必需）
  'SHIPANY_API_KEY': 'e50e2b3d-a412-4f90-95eb-aafc9837b9ea',
  'SHIPANY_MERCHANDISE_ID': '1955cf99-daf3-4587-a698-2c28ea9180cc',
  'SHIPANY_API_URL': 'https://api.shipany.io/v1',
  
  // Resend 配置（必需）
  'RESEND_API_KEY': 're_JrzLE2sa_HAe9ZVgzmszQ1iepVhRUS4Ci',
  'RESEND_DEFAULT_FROM': 'security@afterglow.app',
  
  // Creem 配置（必需）
  'CREEM_PRODUCT_IDS': JSON.stringify({
    "digital-heirloom-base-annual": "prod_4oN2BFtSPSpAnYcvUN0uoi",
    "digital-heirloom-pro-annual": "prod_4epepOcgUjSjPoWmAnBaFt"
  }),
};

const ALL_ENVIRONMENTS = ['production', 'preview', 'development'] as const;

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

async function deleteEnvVar(projectId: string, envVarId: string): Promise<boolean> {
  try {
    const response = await fetch(`${VERCEL_API_URL}/v10/projects/${projectId}/env/${envVarId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
    });

    return response.ok;
  } catch (error: any) {
    console.error(`❌ 删除环境变量失败:`, error.message);
    return false;
  }
}

async function createEnvVar(
  projectId: string,
  key: string,
  value: string,
  target: string[]
): Promise<boolean> {
  try {
    const response = await fetch(`${VERCEL_API_URL}/v10/projects/${projectId}/env`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
        value,
        type: 'encrypted',
        target,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ 创建失败:`, error);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error(`❌ 创建环境变量失败:`, error.message);
    return false;
  }
}

async function ensureEnvVarInAllEnvironments(
  projectId: string,
  key: string,
  value: string,
  existingVars: VercelEnvVar[]
): Promise<{ success: boolean; action: string }> {
  // 查找现有的变量
  const existing = existingVars.filter(v => v.key === key);
  
  // 检查是否在所有环境中都存在
  const existingTargets = new Set<string>();
  for (const envVar of existing) {
    (envVar.target || []).forEach(env => existingTargets.add(env));
  }
  
  const missingEnvs = ALL_ENVIRONMENTS.filter(env => !existingTargets.has(env));
  
  if (missingEnvs.length === 0 && existing.length > 0) {
    // 所有环境都已存在，检查值是否匹配
    const firstVar = existing[0];
    if (firstVar.value === value) {
      return { success: true, action: 'already_exists' };
    } else {
      // 值不匹配，需要更新
      console.log(`  ⚠️  变量值不匹配，需要更新`);
    }
  }
  
  // 删除所有现有的变量（如果存在）
  if (existing.length > 0) {
    for (const envVar of existing) {
      if (envVar.id) {
        await deleteEnvVar(projectId, envVar.id);
        await new Promise(resolve => setTimeout(resolve, 200)); // 避免速率限制
      }
    }
  }
  
  // 创建新变量（包含所有环境）
  const success = await createEnvVar(projectId, key, value, [...ALL_ENVIRONMENTS]);
  
  if (success) {
    return { success: true, action: existing.length > 0 ? 'updated' : 'created' };
  } else {
    return { success: false, action: 'failed' };
  }
}

async function main() {
  console.log('🔄 同步代码环境变量到 Vercel...\n');
  
  const projectId = await getProjectId();
  if (!projectId) {
    console.error('❌ 无法获取项目 ID');
    process.exit(1);
  }
  
  console.log(`✅ 项目 ID: ${projectId}\n`);
  
  // 获取现有环境变量
  console.log('🔍 获取现有环境变量...');
  const existingVars = await getVercelEnvVars(projectId);
  console.log(`找到 ${existingVars.length} 个现有环境变量\n`);
  
  // 同步每个必需变量
  console.log('📝 同步环境变量到所有环境...\n');
  
  const results: Array<{
    key: string;
    success: boolean;
    action: string;
  }> = [];
  
  for (const [key, value] of Object.entries(REQUIRED_ENV_VARS)) {
    console.log(`处理 ${key}...`);
    
    const result = await ensureEnvVarInAllEnvironments(
      projectId,
      key,
      value,
      existingVars
    );
    
    results.push({ key, ...result });
    
    if (result.success) {
      const actionEmoji = result.action === 'created' ? '✅ 创建' : 
                         result.action === 'updated' ? '🔄 更新' : 
                         '✓ 已存在';
      console.log(`  ${actionEmoji} - 所有环境已配置`);
    } else {
      console.log(`  ❌ 失败`);
    }
    
    // 避免速率限制
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // 输出结果
  console.log('\n📊 同步结果：\n');
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const createdCount = results.filter(r => r.action === 'created').length;
  const updatedCount = results.filter(r => r.action === 'updated').length;
  const existingCount = results.filter(r => r.action === 'already_exists').length;
  
  console.log(`  ✅ 成功: ${successCount}`);
  console.log(`    - 新建: ${createdCount}`);
  console.log(`    - 更新: ${updatedCount}`);
  console.log(`    - 已存在: ${existingCount}`);
  console.log(`  ❌ 失败: ${failCount}`);
  console.log(`  📦 总计: ${results.length}`);
  
  // 验证结果
  console.log('\n🔍 验证同步结果...\n');
  const finalVars = await getVercelEnvVars(projectId);
  
  let allCorrect = true;
  for (const key of Object.keys(REQUIRED_ENV_VARS)) {
    const vars = finalVars.filter(v => v.key === key);
    const targets = new Set<string>();
    vars.forEach(v => (v.target || []).forEach(env => targets.add(env)));
    
    const missingEnvs = ALL_ENVIRONMENTS.filter(env => !targets.has(env));
    
    if (missingEnvs.length > 0) {
      console.log(`  ⚠️  ${key} - 缺少环境: ${missingEnvs.join(', ')}`);
      allCorrect = false;
    } else {
      console.log(`  ✅ ${key} - 所有环境已配置`);
    }
  }
  
  if (allCorrect && failCount === 0) {
    console.log('\n✅ 所有环境变量已成功同步到所有环境！');
    console.log('\n💡 下一步：');
    console.log('  1. 前往 Vercel Dashboard 验证变量');
    console.log('  2. 重新部署项目（Redeploy）');
    console.log('  3. 验证网站功能');
    process.exit(0);
  } else {
    console.log('\n⚠️  部分变量可能需要手动检查');
    console.log('\n💡 建议：');
    console.log('  1. 前往 Vercel Dashboard 手动验证');
    console.log('  2. 对于失败的变量，手动添加缺失的环境');
    console.log('  3. 重新部署项目');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
