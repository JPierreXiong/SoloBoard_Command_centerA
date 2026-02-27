/**
 * 扫描代码中实际使用的所有环境变量
 * 用于确保 Vercel 环境变量与代码完全匹配
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// 扫描目录
const SCAN_DIRS = ['src', 'app', 'scripts'];
const EXCLUDE_PATTERNS = ['node_modules', '.next', 'dist', 'out', '*.d.ts'];

// 环境变量模式
const ENV_VAR_PATTERN = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
const NEXT_PUBLIC_PATTERN = /NEXT_PUBLIC_[A-Z_][A-Z0-9_]*/g;

interface EnvVarUsage {
  varName: string;
  files: string[];
  lineNumbers: number[];
  isRequired: boolean;
}

const envVarUsages = new Map<string, EnvVarUsage>();

function scanFile(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // 匹配 process.env.VAR_NAME
      let match;
      while ((match = ENV_VAR_PATTERN.exec(line)) !== null) {
        const varName = match[1];
        
        if (!envVarUsages.has(varName)) {
          envVarUsages.set(varName, {
            varName,
            files: [],
            lineNumbers: [],
            isRequired: false,
          });
        }
        
        const usage = envVarUsages.get(varName)!;
        if (!usage.files.includes(filePath)) {
          usage.files.push(filePath);
        }
        usage.lineNumbers.push(index + 1);
        
        // 检查是否是必需的（通过注释或代码逻辑判断）
        if (
          line.includes('required') ||
          line.includes('必需') ||
          line.includes('!') ||
          line.includes('??') ||
          line.includes('throw')
        ) {
          usage.isRequired = true;
        }
      }
    });
  } catch (error) {
    console.error(`读取文件失败: ${filePath}`, error);
  }
}

async function scanDirectory(dir: string) {
  const files = await glob(`${dir}/**/*.{ts,tsx,js,jsx}`, {
    ignore: EXCLUDE_PATTERNS.map(p => `**/${p}/**`),
  });
  
  for (const file of files) {
    scanFile(file);
  }
}

async function main() {
  console.log('🔍 扫描代码中使用的环境变量...\n');
  
  // 扫描所有目录
  for (const dir of SCAN_DIRS) {
    if (fs.existsSync(dir)) {
      await scanDirectory(dir);
    }
  }
  
  // 分类环境变量
  const requiredVars: EnvVarUsage[] = [];
  const optionalVars: EnvVarUsage[] = [];
  
  for (const usage of envVarUsages.values()) {
    if (usage.isRequired || usage.varName.includes('SECRET') || usage.varName.includes('KEY')) {
      requiredVars.push(usage);
    } else {
      optionalVars.push(usage);
    }
  }
  
  // 排序
  requiredVars.sort((a, b) => a.varName.localeCompare(b.varName));
  optionalVars.sort((a, b) => a.varName.localeCompare(b.varName));
  
  // 输出结果
  console.log('📋 代码中使用的环境变量：\n');
  
  console.log('✅ 必需变量：');
  for (const usage of requiredVars) {
    console.log(`  ${usage.varName}`);
    console.log(`    文件数: ${usage.files.length}`);
    console.log(`    使用位置: ${usage.files.slice(0, 3).join(', ')}${usage.files.length > 3 ? '...' : ''}`);
    console.log('');
  }
  
  console.log('📋 可选变量：');
  for (const usage of optionalVars) {
    console.log(`  ${usage.varName}`);
    console.log(`    文件数: ${usage.files.length}`);
    console.log('');
  }
  
  // 生成 JSON 输出
  const output = {
    required: requiredVars.map(u => u.varName),
    optional: optionalVars.map(u => u.varName),
    all: Array.from(envVarUsages.keys()).sort(),
    details: Object.fromEntries(envVarUsages),
  };
  
  fs.writeFileSync(
    'scripts/code-env-vars.json',
    JSON.stringify(output, null, 2)
  );
  
  console.log(`\n✅ 扫描完成！结果已保存到 scripts/code-env-vars.json`);
  console.log(`\n📊 统计：`);
  console.log(`  必需变量: ${requiredVars.length}`);
  console.log(`  可选变量: ${optionalVars.length}`);
  console.log(`  总计: ${envVarUsages.size}`);
}

main().catch(console.error);
