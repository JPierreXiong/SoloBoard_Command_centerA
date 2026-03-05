import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';

/**
 * QStash 签名验证中间件
 * 确保请求来自 QStash
 */
export function withQStashVerification(handler: any) {
  return verifySignatureAppRouter(handler, {
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  });
}





