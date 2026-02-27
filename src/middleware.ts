// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './core/i18n/config';

export default createMiddleware(routing);

export const config = {
  // 匹配所有路径，但排除内部资源和静态文件
  matcher: [
    // 1. 显式匹配根路径以进行重定向
    '/',
    // 2. 匹配所有国际化路由
    '/(zh|en|fr)/:path*',
    // 3. 排除特定路径
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
