/**
 * 将 Creem 配置写入 Vercel 环境变量
 * 
 * 使用方法：
 * npx tsx scripts/setup-creem-to-vercel.ts <vercel-token> <project-id> [team-id]
 * 
 * 或者设置环境变量后运行：
 * VERCEL_TOKEN=your-token VERCEL_PROJECT_ID=your-project npx tsx scripts/setup-creem-to-vercel.ts
 */

import * as readline from 'readline';

// Creem 配置
const CREEM_CONFIG = {
  CREEM_ENABLED: 'true',
  CREEM_ENVIRONMENT: 'production',
  CREEM_API_KEY: 'creem_2HGGaY2qzPVRkCP0kESZXU',
  CREEM_SIGNING_SECRET: 'whsec_567Ldwvldo5m33S87geqWy',
  CREEM_PRODUCT_IDS: JSON.stringify({
    'digital-heirloom-base-annual': 'prod_4oN2BFtSPSpAnYcvUN0uoi',
    'digital-heirloom-pro-annual': 'prod_4epepOcgUjSjPoWmAnBaFt',
  }),
  DEFAULT_PAYMENT_PROVIDER: 'creem',
};

async function setupCreemToVercel() {
  console.log('🚀 开始将 Creem 配置写入 Vercel 环境变量\n');

  // 从命令行参数获取配置
  const args = process.argv.slice(2);
  let vercelToken = process.env.VERCEL_TOKEN || (args[0] && args[0] !== 'undefined' ? args[0] : undefined);
  let projectId = process.env.VERCEL_PROJECT_ID || (args[1] && args[1] !== 'undefined' ? args[1] : undefined);
  let teamId = process.env.VERCEL_TEAM_ID || (args[2] && args[2] !== 'undefined' ? args[2] : undefined);

  // 如果命令行参数不足，使用交互式输入
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  if (!vercelToken || vercelToken.trim() === '') {
    console.log('📝 请提供 Vercel Access Token');
    console.log('   获取地址: https://vercel.com/account/tokens\n');
    vercelToken = await question('Vercel Token: ');
  }

  if (!projectId || projectId.trim() === '') {
    console.log('\n📝 请提供项目名称或项目ID');
    console.log('   可以在 Vercel Dashboard 项目设置中找到\n');
    const projectInput = await question('项目名称或ID: ');
    projectId = projectInput;
  }

  rl.close();
  
  // 清理输入
  vercelToken = vercelToken?.trim();
  projectId = projectId?.trim();
  teamId = teamId?.trim() || undefined;

  if (!vercelToken || !projectId) {
    console.error('❌ 缺少必要配置');
    process.exit(1);
  }

  console.log('\n📦 开始配置 Creem 环境变量到 Vercel...\n');
  console.log('配置项:');
  for (const [key, value] of Object.entries(CREEM_CONFIG)) {
    if (key.includes('KEY') || key.includes('SECRET')) {
      console.log(`  ${key}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`  ${key}: ${value}`);
    }
  }
  console.log('');

  // 配置环境变量到所有环境
  const environments: ('production' | 'preview' | 'development')[] = ['production', 'preview', 'development'];
  let successCount = 0;
  let failCount = 0;
  const results: Array<{ env: string; key: string; success: boolean; message: string }> = [];

  for (const environment of environments) {
    console.log(`\n配置 ${environment} 环境...`);
    for (const [key, value] of Object.entries(CREEM_CONFIG)) {
      try {
        const result = await setVercelEnvVariable(
          vercelToken!,
          projectId!,
          teamId,
          {
            key,
            value,
            type: key.includes('SECRET') || key.includes('KEY') ? 'encrypted' : 'plain',
            target: [environment],
          }
        );

        results.push({
          env: environment,
          key,
          success: result.success,
          message: result.message,
        });

        if (result.success) {
          console.log(`  ✅ ${key}: 成功`);
          successCount++;
        } else {
          console.log(`  ⚠️  ${key}: ${result.message}`);
          failCount++;
        }
      } catch (error: any) {
        console.log(`  ❌ ${key}: ${error.message}`);
        failCount++;
        results.push({
          env: environment,
          key,
          success: false,
          message: error.message,
        });
      }
    }
  }

  console.log('\n📊 配置完成统计:');
  console.log(`   ✅ 成功: ${successCount}`);
  console.log(`   ❌ 失败: ${failCount}`);
  console.log(`   📦 总计: ${Object.keys(CREEM_CONFIG).length * environments.length} 个配置项\n`);

  // 显示详细结果
  console.log('📋 详细结果:');
  for (const env of environments) {
    console.log(`\n${env} 环境:`);
    const envResults = results.filter(r => r.env === env);
    for (const result of envResults) {
      const icon = result.success ? '✅' : '❌';
      console.log(`  ${icon} ${result.key}: ${result.message}`);
    }
  }

  if (failCount === 0) {
    console.log('\n🎉 Creem 配置成功写入 Vercel！');
    console.log('   请前往 Vercel Dashboard 验证配置');
    console.log('   然后重新部署应用以应用新配置\n');
  } else {
    console.log('\n⚠️  部分配置失败，请检查错误信息');
    console.log('   可以手动在 Vercel Dashboard 中配置剩余变量\n');
  }
}

async function setVercelEnvVariable(
  token: string,
  projectId: string,
  teamId: string | undefined,
  envVar: {
    key: string;
    value: string;
    type: 'system' | 'secret' | 'encrypted' | 'plain';
    target: ('production' | 'preview' | 'development')[];
  }
): Promise<{ success: boolean; message: string }> {
  const baseUrl = 'https://api.vercel.com';
  const url = teamId
    ? `${baseUrl}/v10/projects/${projectId}/env?teamId=${teamId}`
    : `${baseUrl}/v10/projects/${projectId}/env`;

  try {
    // 先检查是否已存在
    const checkResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!checkResponse.ok) {
      return {
        success: false,
        message: `检查失败: ${checkResponse.status} ${checkResponse.statusText}`,
      };
    }

    const existing = await checkResponse.json();
    const existingVar = existing.envs?.find(
      (e: any) => e.key === envVar.key && e.target?.includes(envVar.target[0])
    );

    // 如果已存在，先删除
    if (existingVar) {
      const deleteUrl = teamId
        ? `${baseUrl}/v10/projects/${projectId}/env/${existingVar.id}?teamId=${teamId}`
        : `${baseUrl}/v10/projects/${projectId}/env/${existingVar.id}`;

      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        console.log(`  ⚠️  删除旧变量失败，继续创建新变量...`);
      }
    }

    // 创建新的环境变量
    const createResponse = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: envVar.key,
        value: envVar.value,
        type: envVar.type,
        target: envVar.target,
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      return {
        success: false,
        message: `创建失败: ${createResponse.status} ${error.error?.message || createResponse.statusText}`,
      };
    }

    return {
      success: true,
      message: '配置成功',
    };
  } catch (error: any) {
    return {
      success: false,
      message: `请求失败: ${error.message}`,
    };
  }
}

// 运行脚本
setupCreemToVercel().catch((error) => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
