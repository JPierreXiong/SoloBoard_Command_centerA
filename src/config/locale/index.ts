import { envConfigs } from '..';

export const localeNames: any = {
  en: 'English',
  zh: '中文',
  fr: 'Français',
};

export const locales = ['en', 'zh', 'fr'];

export const defaultLocale = envConfigs.locale;

export const localePrefix = 'always';

export const localeDetection = false;

export const localeMessagesRootPath = '@/config/locale/messages';

export const localeMessagesPaths = [
  'common',
  'landing',
  'showcases',
  'blog',
  'pricing',
  'digital-heirloom',
  'dashboard',
  'settings/sidebar',
  'settings/profile',
  'settings/security',
  'settings/billing',
  'settings/payments',
  'settings/credits',
  'settings/apikeys',
  'admin/sidebar',
  'admin/users',
  'admin/roles',
  'admin/permissions',
  'admin/categories',
  'admin/posts',
  'admin/payments',
  'admin/subscriptions',
  'admin/credits',
  'admin/settings',
  'admin/apikeys',
  // 'admin/ai-tasks', // 已删除 - Digital Heirloom 项目不需要
  // 'admin/chats', // 已删除 - Digital Heirloom 项目不需要
  // 'ai/music', // 已删除 - Digital Heirloom 项目不需要
  // 'ai/chat', // 已删除 - Digital Heirloom 项目不需要
  // 'ai/image', // 已删除 - Digital Heirloom 项目不需要
  // 'ai/media', // 已删除 - Digital Heirloom 项目不需要
  'activity/sidebar',
  // 'activity/ai-tasks', // 已删除 - Digital Heirloom 项目不需要
  // 'activity/chats', // 已删除 - Digital Heirloom 项目不需要
];
