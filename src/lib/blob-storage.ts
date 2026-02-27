/**
 * Vercel Blob 存储工具类
 * 用于存储大文件、历史数据、导出文件等
 */

import { put, del, list } from '@vercel/blob';

/**
 * 上传文件到 Blob
 */
export async function uploadToBlob(
  path: string,
  content: string | Buffer | ReadableStream,
  options?: {
    contentType?: string;
    access?: 'public' | 'private';
  }
): Promise<string> {
  try {
    const { url } = await put(path, content, {
      access: options?.access || 'private',
      contentType: options?.contentType,
    });
    
    return url;
  } catch (error: any) {
    console.error('Upload to Blob failed:', error);
    throw new Error(`Failed to upload to Blob: ${error.message}`);
  }
}

/**
 * 上传 JSON 数据到 Blob
 */
export async function uploadJsonToBlob(
  path: string,
  data: any,
  options?: { access?: 'public' | 'private' }
): Promise<string> {
  const content = JSON.stringify(data, null, 2);
  return uploadToBlob(path, content, {
    contentType: 'application/json',
    access: options?.access,
  });
}

/**
 * 删除 Blob 文件
 */
export async function deleteFromBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch (error: any) {
    console.error('Delete from Blob failed:', error);
    throw new Error(`Failed to delete from Blob: ${error.message}`);
  }
}

/**
 * 列出 Blob 文件
 */
export async function listBlobFiles(prefix: string) {
  try {
    const { blobs } = await list({ prefix });
    return blobs;
  } catch (error: any) {
    console.error('List Blob files failed:', error);
    throw new Error(`Failed to list Blob files: ${error.message}`);
  }
}

/**
 * 归档历史指标数据到 Blob
 * 路径格式: metrics-history/{userId}/{year}/{month}.json
 */
export async function archiveMetricsHistory(
  userId: string,
  year: number,
  month: number,
  data: any[]
): Promise<string> {
  const path = `metrics-history/${userId}/${year}/${month.toString().padStart(2, '0')}.json`;
  
  return uploadJsonToBlob(path, {
    userId,
    year,
    month,
    archivedAt: new Date().toISOString(),
    recordCount: data.length,
    data,
  });
}

/**
 * 读取归档的历史数据
 */
export async function getArchivedMetrics(
  userId: string,
  year: number,
  month: number
): Promise<any> {
  const path = `metrics-history/${userId}/${year}/${month.toString().padStart(2, '0')}.json`;
  
  try {
    const blobs = await listBlobFiles(path);
    if (blobs.length === 0) {
      return null;
    }
    
    const response = await fetch(blobs[0].url);
    return await response.json();
  } catch (error) {
    console.error('Get archived metrics failed:', error);
    return null;
  }
}

/**
 * 上传用户头像
 * 路径格式: avatars/{userId}.{ext}
 */
export async function uploadAvatar(
  userId: string,
  imageBuffer: Buffer,
  contentType: string
): Promise<string> {
  const extension = contentType.split('/')[1] || 'jpg';
  const path = `avatars/${userId}.${extension}`;
  
  return uploadToBlob(path, imageBuffer, {
    contentType,
    access: 'public',
  });
}

/**
 * 上传团队 Logo
 * 路径格式: logos/{teamId}.{ext}
 */
export async function uploadTeamLogo(
  teamId: string,
  imageBuffer: Buffer,
  contentType: string
): Promise<string> {
  const extension = contentType.split('/')[1] || 'png';
  const path = `logos/${teamId}.${extension}`;
  
  return uploadToBlob(path, imageBuffer, {
    contentType,
    access: 'public',
  });
}

/**
 * 生成并上传导出文件
 * 路径格式: exports/{userId}/{timestamp}.{format}
 */
export async function uploadExport(
  userId: string,
  format: 'csv' | 'xlsx' | 'pdf' | 'json',
  content: Buffer | string
): Promise<{ url: string; path: string }> {
  const timestamp = Date.now();
  const path = `exports/${userId}/${timestamp}.${format}`;
  
  const contentTypes: Record<string, string> = {
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf',
    json: 'application/json',
  };
  
  const url = await uploadToBlob(path, content, {
    contentType: contentTypes[format],
    access: 'private',
  });
  
  return { url, path };
}

/**
 * 上传同步日志
 * 路径格式: logs/sync/{date}/{siteId}.log
 */
export async function uploadSyncLog(
  siteId: string,
  logContent: string
): Promise<string> {
  const date = new Date().toISOString().split('T')[0];
  const path = `logs/sync/${date}/${siteId}.log`;
  
  return uploadToBlob(path, logContent, {
    contentType: 'text/plain',
    access: 'private',
  });
}

/**
 * 上传错误日志
 * 路径格式: logs/errors/{date}.log
 */
export async function uploadErrorLog(
  errorContent: string
): Promise<string> {
  const date = new Date().toISOString().split('T')[0];
  const timestamp = Date.now();
  const path = `logs/errors/${date}/${timestamp}.log`;
  
  return uploadToBlob(path, errorContent, {
    contentType: 'text/plain',
    access: 'private',
  });
}

/**
 * 创建数据备份
 * 路径格式: backups/{date}/backup.json
 */
export async function createBackup(
  backupData: any
): Promise<string> {
  const date = new Date().toISOString().split('T')[0];
  const timestamp = Date.now();
  const path = `backups/${date}/${timestamp}.json`;
  
  return uploadJsonToBlob(path, {
    createdAt: new Date().toISOString(),
    ...backupData,
  });
}

/**
 * 清理过期的导出文件
 * 删除超过 7 天的导出文件
 */
export async function cleanupExpiredExports(): Promise<number> {
  try {
    const blobs = await listBlobFiles('exports/');
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    let deletedCount = 0;
    
    for (const blob of blobs) {
      if (blob.uploadedAt && new Date(blob.uploadedAt).getTime() < sevenDaysAgo) {
        await deleteFromBlob(blob.url);
        deletedCount++;
      }
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Cleanup expired exports failed:', error);
    return 0;
  }
}

/**
 * 获取用户的存储使用量
 */
export async function getUserStorageUsage(userId: string): Promise<{
  totalSize: number;
  fileCount: number;
  breakdown: Record<string, { size: number; count: number }>;
}> {
  try {
    const prefixes = [
      `metrics-history/${userId}/`,
      `exports/${userId}/`,
      `avatars/${userId}`,
    ];
    
    let totalSize = 0;
    let fileCount = 0;
    const breakdown: Record<string, { size: number; count: number }> = {};
    
    for (const prefix of prefixes) {
      const blobs = await listBlobFiles(prefix);
      const category = prefix.split('/')[0];
      
      breakdown[category] = {
        size: blobs.reduce((sum, blob) => sum + (blob.size || 0), 0),
        count: blobs.length,
      };
      
      totalSize += breakdown[category].size;
      fileCount += breakdown[category].count;
    }
    
    return { totalSize, fileCount, breakdown };
  } catch (error) {
    console.error('Get user storage usage failed:', error);
    return { totalSize: 0, fileCount: 0, breakdown: {} };
  }
}










