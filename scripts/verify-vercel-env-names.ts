/**
 * 验证 Vercel 环境变量名是否与代码匹配
 * 
 * 使用方法：
 * VERCEL_TOKEN=your-token pnpm tsx scripts/verify-vercel-env-names.ts
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'rF4aDNj4aTRotWfhKQAzVNQd';
const PROJECT_NAME = 'shipany-digital-heirloom';
const VERCEL_API_URL = 'https://api.vercel.com';

// 代码中实际使用的环境变量名（从代码扫描得出）
const EXPECTED_ENV_VARS = {
  // Supabase 配置（必需）
  'NEXT_PUBLIC_SUPABASE_URL': {
    required: true,
    description: 'Supabase 项目 URL',
    pattern: /^https:\/\/.*\.supabase\.co$/,
  },
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
    required: true,
    description: 'Supabase 匿名密钥',
    pattern: /^eyJ/,
  },
  'SUPABASE_SERVICE_ROLE_KEY': {
    required: true,
    description: 'Supabase Service Role Key',
    pattern: /^eyJ/,
  },
  'SUPABASE_URL': {
    required: false,
    description: 'Supabase URL (备用)',
    pattern: /^https:\/\/.*\.supabase\.co$/,
  },
  
  // 数据库配置
  'DATABASE_URL': {
    required: true,
    description: 'PostgreSQL 数据库连接 URL',
    pattern: /^postgres:\/\//,
  },
  'POSTGRES_URL_NON_POOLING': {
    required: false,
    description: 'PostgreSQL 非连接池 URL',
    pattern: /^postgres:\/\//,
  },
  
  // 认证配置
  'AUTH_SECRET': {
    required: true,
    description: '认证密钥',
    pattern: /^.{32,}/,
  },
  'AUTH_URL': {
    required: true,
    description: '认证 URL',
    pattern: /^https:\/\//,
  },
  
  // 应用配置
  'NEXT_PUBLIC_APP_URL': {
    required: true,
    description: '应用 URL',
    pattern: /^https:\/\//,
  },
  'NEXT_PUBLIC_APP_NAME': {
    required: false,
    description: '应用名称',
  },
  
  // Vercel Blob
  'BLOB_READ_WRITE_TOKEN': {
    required: false,
    description: 'Vercel Blob 读写令牌',
    pattern: /^vercel_blob_/,
  },
  
  // ShipAny
  'SHIPANY_API_KEY': {
    required: false,
    description: 'ShipAny API Key',
  },
  'SHIPANY_MERCHANDISE_ID': {
    required: false,
    description: 'ShipAny Merchandise ID',
  },
  'SHIPANY_API_URL': {
    required: false,
    description: 'ShipAny API URL',
  },
  
  // Resend
  'RESEND_API_KEY': {
    required: false,
    description: 'Resend API Key',
    pattern: /^re_/,
  },
  'RESEND_DEFAULT_FROM': {
    required: false,
    description: 'Resend 默认发件人',
  },
  
  // Creem
  'CREEM_PRODUCT_IDS': {
    required: false,
    description: 'Creem Product IDs (JSON)',
  },
};

// 错误的变量名模式（需要修复）
const WRONG_PATTERNS = [
  /^NEXT_PUBLIC_digital_heirloom/i,
  /^STORAGE_/i,
  /^digital_heirloom/i,
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

function checkEnvVarName(varName: string): {
  isValid: boolean;
  expectedName?: string;
  reason?: string;
} {
  // 检查是否是错误的命名模式
  for (const pattern of WRONG_PATTERNS) {
    if (pattern.test(varName)) {
      // 尝试推断正确的变量名
      let expectedName = varName;
      
      // 修复 NEXT_PUBLIC_digital_heirloomSUPABA... 模式
      if (/^NEXT_PUBLIC_digital_heirloomSUPABA/i.test(varName)) {
        if (varName.includes('URL')) {
          expectedName = 'NEXT_PUBLIC_SUPABASE_URL';
        } else if (varName.includes('ANON') || varName.includes('KEY')) {
          expectedName = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';
        }
      }
      
      // 修复 STORAGE_ 前缀
      if (/^STORAGE_/i.test(varName)) {
        expectedName = varName.replace(/^STORAGE_/i, '');
      }
      
      return {
        isValid: false,
        expectedName,
        reason: `变量名包含错误的前缀或格式`,
      };
    }
  }
  
  // 检查是否是预期的变量名
  if (EXPECTED_ENV_VARS[varName as keyof typeof EXPECTED_ENV_VARS]) {
    return { isValid: true };
  }
  
  // 检查是否是类似的变量名（可能是拼写错误）
  const similarVars = Object.keys(EXPECTED_ENV_VARS).filter(expected => {
    const similarity = calculateSimilarity(varName, expected);
    return similarity > 0.7;
  });
  
  if (similarVars.length > 0) {
    return {
      isValid: false,
      expectedName: similarVars[0],
      reason: `可能是拼写错误，建议使用: ${similarVars[0]}`,
    };
  }
  
  return {
    isValid: true, // 未知变量，可能是自定义的
  };
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

async function main() {
  console.log('🔍 检查 Vercel 环境变量命名...\n');
  
  const projectId = await getProjectId();
  if (!projectId) {
    console.error('❌ 无法获取项目 ID');
    process.exit(1);
  }
  
  console.log(`✅ 项目 ID: ${projectId}\n`);
  
  const envVars = await getVercelEnvVars(projectId);
  console.log(`📋 找到 ${envVars.length} 个环境变量\n`);
  
  const issues: Array<{
    varName: string;
    issue: string;
    expectedName?: string;
    fix?: string;
  }> = [];
  
  const missing: string[] = [];
  const correct: string[] = [];
  
  // 检查每个环境变量
  for (const envVar of envVars) {
    const check = checkEnvVarName(envVar.key);
    
    if (!check.isValid) {
      issues.push({
        varName: envVar.key,
        issue: check.reason || '变量名不正确',
        expectedName: check.expectedName,
        fix: check.expectedName ? `重命名为: ${check.expectedName}` : undefined,
      });
    } else {
      correct.push(envVar.key);
    }
  }
  
  // 检查缺失的必需变量
  for (const [varName, config] of Object.entries(EXPECTED_ENV_VARS)) {
    if (config.required) {
      const exists = envVars.some(v => v.key === varName);
      if (!exists) {
        // 检查是否有错误的命名
        const wrongVar = envVars.find(v => {
          const check = checkEnvVarName(v.key);
          return check.expectedName === varName;
        });
        
        if (wrongVar) {
          issues.push({
            varName: wrongVar.key,
            issue: `变量名错误，应该是: ${varName}`,
            expectedName: varName,
            fix: `重命名为: ${varName}`,
          });
        } else {
          missing.push(varName);
        }
      }
    }
  }
  
  // 输出结果
  console.log('📊 检查结果：\n');
  
  if (issues.length > 0) {
    console.log('❌ 发现命名问题：\n');
    for (const issue of issues) {
      console.log(`  🔴 ${issue.varName}`);
      console.log(`     问题: ${issue.issue}`);
      if (issue.expectedName) {
        console.log(`     建议: ${issue.fix || `重命名为: ${issue.expectedName}`}`);
      }
      console.log('');
    }
  }
  
  if (missing.length > 0) {
    console.log('⚠️  缺失的必需变量：\n');
    for (const varName of missing) {
      const config = EXPECTED_ENV_VARS[varName as keyof typeof EXPECTED_ENV_VARS];
      console.log(`  ⚠️  ${varName} - ${config.description}`);
    }
    console.log('');
  }
  
  if (correct.length > 0 && issues.length === 0 && missing.length === 0) {
    console.log('✅ 所有环境变量命名正确！\n');
  }
  
  // 生成修复建议
  if (issues.length > 0) {
    console.log('💡 修复建议：\n');
    console.log('1. 前往 Vercel Dashboard -> Settings -> Environment Variables');
    console.log('2. 对于每个错误的变量名：');
    console.log('   a. 点击变量右侧的 ⋯ 菜单');
    console.log('   b. 选择 "Edit"');
    console.log('   c. 复制变量值');
    console.log('   d. 删除旧变量');
    console.log('   e. 创建新变量（使用正确的名称）');
    console.log('   f. 粘贴变量值');
    console.log('   g. 确保勾选所有环境（Production, Preview, Development）');
    console.log('3. 重新部署项目（Redeploy）\n');
    
    console.log('📝 需要修复的变量：\n');
    for (const issue of issues) {
      if (issue.expectedName) {
        console.log(`   ${issue.varName} → ${issue.expectedName}`);
      }
    }
  }
  
  process.exit(issues.length > 0 || missing.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
