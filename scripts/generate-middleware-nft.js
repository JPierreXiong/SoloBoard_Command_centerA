/**
 * 生成 middleware.js.nft.json 文件 (Webpack 适配版)
 * 解决 Vercel 部署时的 ENOENT 错误
 */

const fs = require('fs');
const path = require('path');

const serverDir = path.join(process.cwd(), '.next/server');
const nftPath = path.join(serverDir, 'middleware.js.nft.json');
const manifestPath = path.join(serverDir, 'middleware-manifest.json');

try {
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Webpack 模式下的 middleware 依赖提取
    // 通常位于 manifest.middleware['/'] 下
    const middlewareConfig = manifest.middleware['/'];
    
    if (middlewareConfig) {
      // 合并 files (静态资源/块) 和可能的 scripts
      const dependencies = [
        ...(middlewareConfig.files || []),
        // Webpack 有时会将主入口放在这里
        ...(middlewareConfig.scripts || [])
      ];

      const nftContent = {
        version: 1,
        // 将路径转换为相对于 .next/server 的相对路径
        files: dependencies.map(f => {
          // 移除可能存在的 'server/' 前缀，确保 Vercel 能正确映射
          return f.startsWith('server/') ? f.replace('server/', '') : f;
        })
      };

      // 自动补齐 Webpack 模式下 Vercel 寻找的入口声明
      // 如果清单里没包含入口，手动加上
      if (!nftContent.files.includes('middleware.js') && fs.existsSync(path.join(serverDir, 'middleware.js'))) {
        nftContent.files.push('middleware.js');
      }

      fs.writeFileSync(nftPath, JSON.stringify(nftContent, null, 2));
      console.log('✅ [Vercel Webpack Fix] Successfully generated middleware.js.nft.json');
      console.log(`📁 Files tracked: ${nftContent.files.length} dependencies`);
    } else {
      console.warn('⚠️ [Vercel Webpack Fix] No middleware config found in manifest');
    }
  } else {
    console.warn('⚠️ [Vercel Webpack Fix] middleware-manifest.json not found. Make sure next build finished.');
  }
} catch (error) {
  console.error('❌ [Vercel Webpack Fix] Error:', error.message);
  // 不要让构建失败
  process.exit(0);
}
