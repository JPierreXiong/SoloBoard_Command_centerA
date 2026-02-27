/**
 * Storage 工具函数
 * 用于处理 Supabase Storage (Blob Storage) 的文件操作
 * 
 * 核心原则：
 * - 文件内容存储在 Blob Storage
 * - 数据库只存储元数据（路径引用）
 */

import { createClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'digital_heirloom_assets';

/**
 * 安全获取 Supabase 客户端配置
 */
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    const error = new Error('Supabase configuration is missing. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    console.error('❌ Supabase 环境变量未配置:', {
      url: supabaseUrl ? '✅' : '❌',
      key: supabaseKey ? '✅' : '❌',
      env: typeof window !== 'undefined' ? 'client' : 'server',
    });
    throw error;
  }

  return { supabaseUrl, supabaseKey };
}

/**
 * 上传文件到 Blob Storage
 * 
 * @param vaultId 保险箱 ID
 * @param fileId 文件 ID
 * @param fileName 原始文件名
 * @param encryptedData 加密后的文件数据（Uint8Array）
 * @param onProgress 进度回调（可选）
 * @returns Storage 路径
 */
export async function uploadToBlobStorage(
  vaultId: string,
  fileId: string,
  fileName: string,
  encryptedData: Uint8Array,
  onProgress?: (progress: number) => void
): Promise<string> {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 构建存储路径：vault_id/file_id_original_name.enc
  const storagePath = `${vaultId}/${fileId}_${fileName}.enc`;

  // 将 Uint8Array 转换为 Blob（添加类型断言以兼容 TypeScript）
  const encryptedBlob = new Blob([encryptedData as BlobPart], {
    type: 'application/octet-stream',
  });

  // 对于大文件（> 50MB），使用分块上传
  if (encryptedData.length > 50 * 1024 * 1024) {
    return await uploadLargeFile(
      supabase,
      storagePath,
      encryptedBlob,
      onProgress
    );
  }

  // 小文件直接上传
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, encryptedBlob, {
      contentType: 'application/octet-stream',
      upsert: false,
      cacheControl: '3600',
    });

  if (error) {
    throw new Error(`上传到 Blob Storage 失败: ${error.message}`);
  }

  onProgress?.(100);
  return storagePath;
}

/**
 * 大文件分块上传（支持断点续传）
 */
async function uploadLargeFile(
  supabase: any,
  storagePath: string,
  blob: Blob,
  onProgress?: (progress: number) => void
): Promise<string> {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB 每块
  const totalSize = blob.size;
  let uploaded = 0;

  // TODO: 实现分块上传逻辑
  // 注意：Supabase Storage 目前不支持分块上传 API
  // 如果需要，可以考虑：
  // 1. 使用 Supabase Storage 的 resumable upload（如果支持）
  // 2. 或者在前端分块加密后分别上传，后端合并

  // 临时方案：直接上传（Supabase Storage 支持最大 2GB）
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, blob, {
      contentType: 'application/octet-stream',
      upsert: false,
    });

  if (error) {
    throw new Error(`大文件上传失败: ${error.message}`);
  }

  onProgress?.(100);
  return storagePath;
}

/**
 * 从 Blob Storage 下载文件
 * 
 * @param storagePath Storage 路径
 * @returns 加密文件数据（Uint8Array）
 */
export async function downloadFromBlobStorage(
  storagePath: string
): Promise<Uint8Array> {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(storagePath);

  if (error) {
    throw new Error(`从 Blob Storage 下载失败: ${error.message}`);
  }

  // 转换为 Uint8Array
  const arrayBuffer = await data.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * 生成临时签名 URL（用于受益人访问）
 * 
 * @param storagePath Storage 路径
 * @param expiresIn 过期时间（秒，默认 3600）
 * @returns 签名 URL
 */
export async function createSignedUrl(
  storagePath: string,
  expiresIn: number = 3600
): Promise<string> {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    throw new Error(`创建签名 URL 失败: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * 删除 Blob Storage 中的文件
 * 
 * @param storagePath Storage 路径
 */
export async function deleteFromBlobStorage(
  storagePath: string
): Promise<void> {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (error) {
    throw new Error(`删除 Blob Storage 文件失败: ${error.message}`);
  }
}

/**
 * 检查文件是否存在
 * 
 * @param storagePath Storage 路径
 * @returns 是否存在
 */
export async function fileExistsInBlobStorage(
  storagePath: string
): Promise<boolean> {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(storagePath.split('/')[0], {
      search: storagePath.split('/').pop(),
    });

  return !error && data && data.length > 0;
}



