/**
 * Checksum 工具函数
 * 用于生成和验证恢复包的 SHA256 校验和
 */

/**
 * 计算字符串的 SHA256 哈希值
 * @param data 要计算哈希的数据
 * @returns SHA256 哈希值（十六进制字符串）
 */
export async function calculateSHA256(data: string): Promise<string> {
  // 在 Node.js 环境中（服务端）
  if (typeof window === 'undefined') {
    try {
      // 使用 Node.js 的 crypto 模块（同步导入）
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(data).digest('hex');
    } catch {
      // 如果 require 失败，尝试使用动态导入
      const crypto = await import('crypto');
      return crypto.createHash('sha256').update(data).digest('hex');
    }
  }
  
  // 在浏览器环境中（客户端）
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }
  
  // Fallback: 使用 Web Crypto API（Node.js 18+ 或现代浏览器）
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * 计算助记词的 SHA256 校验和
 * @param mnemonic 助记词字符串（空格分隔）
 * @returns SHA256 校验和（格式：SHA256:xxxx...xxxx）
 */
export async function calculateMnemonicChecksum(mnemonic: string): Promise<string> {
  const hash = await calculateSHA256(mnemonic);
  return `SHA256:${hash.substring(0, 4)}...${hash.substring(hash.length - 4)}`;
}

/**
 * 计算完整校验和（包含助记词和恢复令牌）
 * @param mnemonic 助记词
 * @param backupToken 恢复令牌（可选）
 * @returns SHA256 校验和
 */
export async function calculateFullChecksum(
  mnemonic: string,
  backupToken?: string
): Promise<string> {
  const data = backupToken ? `${mnemonic}:${backupToken}` : mnemonic;
  const hash = await calculateSHA256(data);
  return `SHA256:${hash.substring(0, 4)}...${hash.substring(hash.length - 4)}`;
}

