/**
 * 删除重复的错误命名的环境变量
 * 
 * 使用方法：
 * VERCEL_TOKEN=your-token pnpm tsx scripts/remove-duplicate-env-vars.ts
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'rF4aDNj4aTRotWfhKQAzVNQd';
const PROJECT_NAME = 'shipany-digital-heirloom';
const VERCEL_API_URL = 'https://api.vercel.com';

// 需要删除的错误变量名
const VARS_TO_REMOVE = [
  'NEXT_PUBLIC_digital_heirloomSUPABASE_URL',
  'NEXT_PUBLIC_digital_heirloomSUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_digital_heirloomSUPABASE_ANON_KEY',
];

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

async function deleteEnvVar(projectId: string, envVarId: string, varName: string): Promise<boolean> {
  try {
    const response = await fetch(`${VERCEL_API_URL}/v10/projects/${projectId}/env/${envVarId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`  ❌ 删除失败: ${error.error?.message || response.statusText}`);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error(`  ❌ 删除失败:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🗑️  删除重复的错误命名的环境变量...\n');
  
  const projectId = await getProjectId();
  if (!projectId) {
    console.error('❌ 无法获取项目 ID');
    process.exit(1);
  }
  
  console.log(`✅ 项目 ID: ${projectId}\n`);
  
  const envVars = await getVercelEnvVars(projectId);
  console.log(`📋 找到 ${envVars.length} 个环境变量\n`);
  
  // 找出需要删除的变量
  const varsToDelete = envVars.filter(v => VARS_TO_REMOVE.includes(v.key));
  
  if (varsToDelete.length === 0) {
    console.log('✅ 没有需要删除的重复变量！\n');
    process.exit(0);
  }
  
  console.log(`🔍 发现 ${varsToDelete.length} 个需要删除的错误变量：\n`);
  for (const envVar of varsToDelete) {
    console.log(`  ❌ ${envVar.key}`);
    console.log(`     环境: ${envVar.target?.join(', ') || 'All'}`);
    console.log(`     值: ${envVar.value.substring(0, 30)}...`);
    console.log('');
  }
  
  // 确认正确的变量是否存在
  const correctVars = {
    'NEXT_PUBLIC_SUPABASE_URL': envVars.find(v => v.key === 'NEXT_PUBLIC_SUPABASE_URL'),
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': envVars.find(v => v.key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  };
  
  console.log('✅ 确认正确的变量已存在：\n');
  for (const [key, envVar] of Object.entries(correctVars)) {
    if (envVar) {
      console.log(`  ✅ ${key}`);
      console.log(`     环境: ${envVar.target?.join(', ') || 'All'}`);
      console.log(`     值: ${envVar.value.substring(0, 30)}...`);
    } else {
      console.log(`  ⚠️  ${key} - 未找到！请先创建此变量。`);
    }
    console.log('');
  }
  
  // 执行删除
  console.log('🚀 开始删除错误的变量...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const envVar of varsToDelete) {
    if (!envVar.id) {
      console.log(`⚠️  跳过 ${envVar.key} (缺少 ID)`);
      continue;
    }
    
    console.log(`🗑️  删除 ${envVar.key}...`);
    const deleted = await deleteEnvVar(projectId, envVar.id, envVar.key);
    
    if (deleted) {
      console.log(`  ✅ 成功删除`);
      successCount++;
    } else {
      console.log(`  ❌ 删除失败`);
      failCount++;
    }
  }
  
  console.log('\n📊 删除结果：');
  console.log(`  ✅ 成功: ${successCount}`);
  console.log(`  ❌ 失败: ${failCount}`);
  console.log(`  📦 总计: ${varsToDelete.length}`);
  
  if (successCount > 0) {
    console.log('\n💡 下一步：');
    console.log('  1. 前往 Vercel Dashboard 验证错误的变量已删除');
    console.log('  2. 确认正确的变量（NEXT_PUBLIC_SUPABASE_URL 等）仍然存在');
    console.log('  3. 重新部署项目（Redeploy）');
    console.log('  4. 验证网站是否正常工作');
  }
  
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
