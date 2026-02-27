/**
 * 一键修复国际化 JSON 文件中的语法错误
 * 
 * 功能：
 * - 移除所有 JavaScript 风格的注释 (// 和 /* */)
 * - 验证 JSON 格式
 * - 重新格式化文件
 * 
 * 使用方法：
 * node scripts/fix-locales.js
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/config/locale/messages');

/**
 * 移除 JSON 字符串中的所有注释并验证格式
 */
function fixJsonContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 移除单行注释 // 和多行注释 /* */
    // 注意：这个正则表达式可能不完美，但对于我们的用例应该足够
    let cleanedContent = content
      // 移除多行注释 /* ... */
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // 移除单行注释 // (但保留 URL 中的 //)
      .replace(/([^:])\/\/.*$/gm, '$1')
      .trim();
    
    // 尝试解析以验证有效性
    const jsonObject = JSON.parse(cleanedContent);
    
    // 重新写回文件，保持美化格式（2 空格缩进）
    fs.writeFileSync(filePath, JSON.stringify(jsonObject, null, 2) + '\n', 'utf8');
    console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Error in ${path.relative(process.cwd(), filePath)}:`, error.message);
    return false;
  }
}

/**
 * 递归遍历目录
 */
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;
  let errorCount = 0;
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const result = walkDir(fullPath);
      fixedCount += result.fixed;
      errorCount += result.errors;
    } else if (file.endsWith('.json')) {
      const success = fixJsonContent(fullPath);
      if (success) {
        fixedCount++;
      } else {
        errorCount++;
      }
    }
  });
  
  return { fixed: fixedCount, errors: errorCount };
}

console.log('🚀 Starting to fix JSON syntax errors in locale files...');
console.log(`📁 Scanning directory: ${localesDir}`);
console.log('');

const result = walkDir(localesDir);

console.log('');
console.log('========================================');
console.log(`✅ Fixed: ${result.fixed} files`);
if (result.errors > 0) {
  console.log(`❌ Errors: ${result.errors} files`);
}
console.log('========================================');
console.log('');
console.log('✨ All locale files processed.');
console.log('');
console.log('💡 Next steps:');
console.log('  1. Review the changes with: git diff');
console.log('  2. Restart the dev server: npm run dev');
console.log('  3. Verify pages load correctly');
console.log('');


