/**
 * 自动修复 Vercel 环境变量命名
 * 
 * 使用方法：
 * VERCEL_TOKEN=your-token pnpm tsx scripts/fix-vercel-env-names.ts
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'rF4aDNj4aTRotWfhKQAzVNQd';
const PROJECT_NAME = 'shipany-digital-heirloom';
const VERCEL_API_URL = 'https://api.vercel.com';

// 需要重命名的变量映射
const RENAME_MAP: Record<string, string> = {
  'NEXT_PUBLIC_digital_heirloomSUPABASE_URL': 'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_digital_heirloomSUPABASE_PUBLISHABLE_KEY': 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_digital_heirloomSUPABASE_ANON_KEY': 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
};

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
  target: string[] = ['production', 'preview', 'development']
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
      console.error(`❌ 创建环境变量失败:`, error);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error(`❌ 创建环境变量失败:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 开始修复 Vercel 环境变量命名...\n');
  
  const projectId = await getProjectId();
  if (!projectId) {
    console.error('❌ 无法获取项目 ID');
    process.exit(1);
  }
  
  console.log(`✅ 项目 ID: ${projectId}\n`);
  
  const envVars = await getVercelEnvVars(projectId);
  console.log(`📋 找到 ${envVars.length} 个环境变量\n`);
  
  // 找出需要重命名的变量
  const varsToRename: Array<{
    oldVar: VercelEnvVar;
    newKey: string;
  }> = [];
  
  for (const envVar of envVars) {
    if (RENAME_MAP[envVar.key]) {
      varsToRename.push({
        oldVar: envVar,
        newKey: RENAME_MAP[envVar.key],
      });
    }
  }
  
  if (varsToRename.length === 0) {
    console.log('✅ 没有需要修复的变量名！\n');
    process.exit(0);
  }
  
  console.log(`🔍 发现 ${varsToRename.length} 个需要重命名的变量：\n`);
  for (const { oldVar, newKey } of varsToRename) {
    console.log(`  ${oldVar.key} → ${newKey}`);
  }
  console.log('');
  
  // 检查新变量名是否已存在
  const existingKeys = new Set(envVars.map(v => v.key));
  const conflicts: string[] = [];
  
  for (const { newKey } of varsToRename) {
    if (existingKeys.has(newKey)) {
      conflicts.push(newKey);
    }
  }
  
  if (conflicts.length > 0) {
    console.log('⚠️  警告：以下变量名已存在，将跳过：\n');
    for (const key of conflicts) {
      console.log(`  ⚠️  ${key}`);
    }
    console.log('\n💡 建议：请手动检查这些变量，确保值正确。\n');
  }
  
  // 执行重命名
  console.log('🚀 开始修复...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const { oldVar, newKey } of varsToRename) {
    // 跳过已存在的变量
    if (existingKeys.has(newKey)) {
      console.log(`⏭️  跳过 ${oldVar.key} → ${newKey} (目标变量已存在)`);
      continue;
    }
    
    console.log(`🔄 重命名 ${oldVar.key} → ${newKey}...`);
    
    // 1. 创建新变量
    const target = oldVar.target || ['production', 'preview', 'development'];
    const created = await createEnvVar(projectId, newKey, oldVar.value, target);
    
    if (!created) {
      console.log(`  ❌ 创建新变量失败`);
      failCount++;
      continue;
    }
    
    // 2. 删除旧变量
    if (oldVar.id) {
      const deleted = await deleteEnvVar(projectId, oldVar.id);
      if (deleted) {
        console.log(`  ✅ 成功`);
        successCount++;
      } else {
        console.log(`  ⚠️  新变量已创建，但删除旧变量失败（请手动删除）`);
        successCount++;
      }
    } else {
      console.log(`  ✅ 新变量已创建（旧变量需要手动删除，因为缺少 ID）`);
      successCount++;
    }
  }
  
  console.log('\n📊 修复结果：');
  console.log(`  ✅ 成功: ${successCount}`);
  console.log(`  ❌ 失败: ${failCount}`);
  console.log(`  📦 总计: ${varsToRename.length}`);
  
  if (successCount > 0) {
    console.log('\n💡 下一步：');
    console.log('  1. 前往 Vercel Dashboard 验证变量已正确重命名');
    console.log('  2. 确认所有环境（Production, Preview, Development）都已勾选');
    console.log('  3. 重新部署项目（Redeploy）');
    console.log('  4. 如果仍有旧变量残留，请手动删除');
  }
  
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
