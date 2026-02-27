/**
 * 功能访问权限检查
 * 根据用户套餐限制功能访问
 */

export type UserPlan = 'free' | 'pro' | 'on_demand';
export type Feature = 'video_legacy' | 'large_files' | 'physical_kit' | '2gb_storage';

interface FeatureLimits {
  video_legacy: { free: boolean; pro: boolean; on_demand: boolean };
  large_files: { free: number; pro: number; on_demand: number }; // 字节数
  physical_kit: { free: boolean; pro: boolean; on_demand: boolean };
  '2gb_storage': { free: boolean; pro: boolean; on_demand: boolean };
}

const FEATURE_LIMITS: FeatureLimits = {
  video_legacy: {
    free: false,
    pro: true,
    on_demand: true,
  },
  large_files: {
    free: 10 * 1024, // 10KB
    pro: 2 * 1024 * 1024 * 1024, // 2GB
    on_demand: 2 * 1024 * 1024 * 1024, // 2GB
  },
  physical_kit: {
    free: false,
    pro: true,
    on_demand: true,
  },
  '2gb_storage': {
    free: false,
    pro: true,
    on_demand: true,
  },
};

/**
 * 检查功能访问权限
 */
export function checkFeatureAccess(feature: Feature, userPlan: UserPlan): boolean {
  const limit = FEATURE_LIMITS[feature];
  if (typeof limit[userPlan] === 'boolean') {
    return limit[userPlan] as boolean;
  }
  return true; // 数字类型的功能（如文件大小）总是允许，但需要单独检查大小
}

/**
 * 获取文件大小限制
 */
export function getFileSizeLimit(userPlan: UserPlan): number {
  return FEATURE_LIMITS.large_files[userPlan];
}

/**
 * 检查文件大小是否超过限制
 */
export function checkFileSize(fileSize: number, userPlan: UserPlan): boolean {
  const limit = getFileSizeLimit(userPlan);
  return fileSize <= limit;
}

/**
 * 获取功能限制描述
 */
export function getFeatureLimitDescription(feature: Feature, userPlan: UserPlan): string {
  switch (feature) {
    case 'video_legacy':
      return userPlan === 'free'
        ? '视频遗嘱功能需要 Pro 版'
        : '视频遗嘱功能已启用';
    case 'large_files':
      const limit = getFileSizeLimit(userPlan);
      return `文件大小限制：${formatFileSize(limit)}`;
    case 'physical_kit':
      return userPlan === 'free'
        ? '物理恢复包功能需要 Pro 版'
        : '物理恢复包功能已启用';
    case '2gb_storage':
      return userPlan === 'free'
        ? '2GB 存储功能需要 Pro 版'
        : '2GB 存储功能已启用';
    default:
      return '';
  }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}



