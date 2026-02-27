/**
 * 孤立文件清理工具
 * 功能：
 * - 检测并清理 Blob Storage 中的孤立文件（数据库记录已删除但文件仍在）
 * - 校验和二次验证（确保文件完整性）
 * - 存储路径混淆验证
 * 
 * 核心原则：不改变 ShipAny 结构，仅处理文件存储清理
 */

import { createClient } from '@supabase/supabase-js';
import { calculateSHA256 } from './checksum';

const BUCKET_NAME = 'digital_heirloom_assets';

/**
 * 清理孤立文件（Edge Function 调用）
 * 
 * 流程：
 * 1. 查询所有数据库中的 storage_path
 * 2. 列出 Blob Storage 中的所有文件
 * 3. 找出不在数据库中的文件（孤立文件）
 * 4. 删除孤立文件
 */
export async function cleanupOrphanedFiles(
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ deleted: number; errors: string[] }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. 获取所有数据库中的 storage_path
  const { data: assets, error: dbError } = await supabase
    .from('vault_assets')
    .select('storage_path')
    .eq('status', 'active');

  if (dbError) {
    throw new Error(`查询数据库失败: ${dbError.message}`);
  }

  const validPaths = new Set(assets?.map(a => a.storage_path) || []);

  // 2. 列出 Blob Storage 中的所有文件
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list('', {
      limit: 1000,
      offset: 0,
      sortBy: { column: 'created_at', order: 'asc' },
    });

  if (listError) {
    throw new Error(`列出 Storage 文件失败: ${listError.message}`);
  }

  // 3. 找出孤立文件
  const orphanedFiles: string[] = [];
  for (const file of files || []) {
    // 递归检查子目录
    if (file.id === null) {
      // 这是一个文件夹，需要递归检查
      const subFiles = await listFilesRecursive(supabase, file.name);
      for (const subFile of subFiles) {
        if (!validPaths.has(subFile)) {
          orphanedFiles.push(subFile);
        }
      }
    } else {
      // 这是一个文件
      const fullPath = file.name;
      if (!validPaths.has(fullPath)) {
        orphanedFiles.push(fullPath);
      }
    }
  }

  // 4. 删除孤立文件
  const errors: string[] = [];
  let deleted = 0;

  for (const filePath of orphanedFiles) {
    try {
      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (deleteError) {
        errors.push(`${filePath}: ${deleteError.message}`);
      } else {
        deleted++;
      }
    } catch (error) {
      errors.push(`${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { deleted, errors };
}

/**
 * 递归列出所有文件
 */
async function listFilesRecursive(
  supabase: any,
  folderPath: string,
  allFiles: string[] = []
): Promise<string[]> {
  const { data: files, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folderPath);

  if (error) {
    return allFiles;
  }

  for (const file of files || []) {
    const fullPath = folderPath ? `${folderPath}/${file.name}` : file.name;
    
    if (file.id === null) {
      // 文件夹，递归
      await listFilesRecursive(supabase, fullPath, allFiles);
    } else {
      // 文件
      allFiles.push(fullPath);
    }
  }

  return allFiles;
}

/**
 * 校验和二次验证
 * 在受益人解密前，重新计算下载流的哈希值并与数据库比对
 */
export async function verifyFileIntegrity(
  storagePath: string,
  expectedChecksum: string,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<{ valid: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 1. 从 Blob Storage 下载文件
    const { data: file, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(storagePath);

    if (downloadError) {
      return { valid: false, error: `下载失败: ${downloadError.message}` };
    }

    // 2. 计算校验和
    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);
    const actualChecksum = await calculateSHA256(
      Array.from(fileData)
        .map(b => String.fromCharCode(b))
        .join('')
    );

    // 3. 比对校验和
    if (actualChecksum !== expectedChecksum) {
      return {
        valid: false,
        error: `文件完整性验证失败：期望 ${expectedChecksum.substring(0, 8)}...，实际 ${actualChecksum.substring(0, 8)}...`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 验证存储路径混淆
 * 确保路径使用 UUID，不泄露用户信息
 */
export function validateStoragePath(path: string): { valid: boolean; error?: string } {
  // 路径格式：vault_id/file_id_filename.enc
  // vault_id 和 file_id 都应该是 UUID
  
  const parts = path.split('/');
  if (parts.length !== 2) {
    return { valid: false, error: '路径格式不正确，应为 vault_id/file_id_filename.enc' };
  }

  const [vaultId, fileName] = parts;

  // 验证 vault_id 是 UUID 格式
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(vaultId)) {
    return { valid: false, error: 'vault_id 必须是 UUID 格式' };
  }

  // 验证文件名包含 file_id（UUID）
  const fileIdMatch = fileName.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_/i);
  if (!fileIdMatch) {
    return { valid: false, error: '文件名必须包含 UUID 格式的 file_id' };
  }

  // 验证文件扩展名是 .enc
  if (!fileName.endsWith('.enc')) {
    return { valid: false, error: '文件扩展名必须是 .enc' };
  }

  return { valid: true };
}



