/**
 * 修复缺失的环境变量作用域
 * 确保所有必需变量在所有环境中都存在
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'rF4aDNj4aTRotWfhKQAzVNQd';
const PROJECT_NAME = 'shipany-digital-heirloom';
const VERCEL_API_URL = 'https://api.vercel.com';

// 必需变量（必须在所有环境中）
const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'AUTH_SECRET',
  'AUTH_URL',
  'NEXT_PUBLIC_APP_URL',
];

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

async function updateEnvVarTarget(
  projectId: string,
  envVarId: string,
  key: string,
  value: string,
  target: string[]
): Promise<boolean> {
  try {
    // 先删除旧变量
    await fetch(`${VERCEL_API_URL}/v10/projects/${projectId}/env/${envVarId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
    });

    // 创建新变量（包含所有环境）
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

    return response.ok;
  } catch (error: any) {
    console.error(`❌ 更新环境变量失败:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 修复缺失的环境变量作用域...\n');
  
  const projectId = await getProjectId();
  if (!projectId) {
    console.error('❌ 无法获取项目 ID');
    process.exit(1);
  }
  
  console.log(`✅ 项目 ID: ${projectId}\n`);
  
  const envVars = await getVercelEnvVars(projectId);
  
  // 检查每个必需变量
  const varsToFix: Array<{
    envVar: VercelEnvVar;
    missingEnvs: string[];
  }> = [];
  
  for (const varName of REQUIRED_VARS) {
    const envVar = envVars.find(v => v.key === varName);
    if (!envVar) {
      console.log(`❌ ${varName} - 变量不存在！`);
      continue;
    }
    
    const targets = envVar.target || [];
    const missingEnvs = ALL_ENVIRONMENTS.filter(env => !targets.includes(env));
    
    if (missingEnvs.length > 0) {
      varsToFix.push({ envVar, missingEnvs });
      console.log(`⚠️  ${varName} - 缺少环境: ${missingEnvs.join(', ')}`);
    } else {
      console.log(`✅ ${varName} - 所有环境已配置`);
    }
  }
  
  if (varsToFix.length === 0) {
    console.log('\n✅ 所有必需变量在所有环境中都已配置！');
    process.exit(0);
  }
  
  console.log(`\n🚀 开始修复 ${varsToFix.length} 个变量...\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const { envVar, missingEnvs } of varsToFix) {
    if (!envVar.id) {
      console.log(`⚠️  跳过 ${envVar.key} (缺少 ID)`);
      continue;
    }
    
    console.log(`🔄 更新 ${envVar.key}...`);
    const allTargets = [...new Set([...(envVar.target || []), ...ALL_ENVIRONMENTS])];
    
    const success = await updateEnvVarTarget(
      projectId,
      envVar.id,
      envVar.key,
      envVar.value,
      allTargets
    );
    
    if (success) {
      console.log(`  ✅ 成功 - 现在包含环境: ${allTargets.join(', ')}`);
      successCount++;
    } else {
      console.log(`  ❌ 失败`);
      failCount++;
    }
  }
  
  console.log('\n📊 修复结果：');
  console.log(`  ✅ 成功: ${successCount}`);
  console.log(`  ❌ 失败: ${failCount}`);
  
  if (successCount > 0) {
    console.log('\n💡 下一步：');
    console.log('  1. 前往 Vercel Dashboard 验证变量作用域已更新');
    console.log('  2. 重新部署项目（Redeploy）');
  }
  
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
