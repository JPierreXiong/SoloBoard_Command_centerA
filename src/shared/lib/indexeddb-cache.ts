/**
 * IndexedDB 缓存层
 * 用于临时存储加密后的资产数据，防止因网络或后端问题导致数据丢失
 * 
 * 设计原则：
 * 1. 不改变 ShipAny 结构
 * 2. 数据加密后立即存入 IndexedDB
 * 3. 页面刷新后自动恢复
 * 4. 后台同步到服务器
 */

const DB_NAME = 'digital-heirloom-cache';
const DB_VERSION = 1;
const STORE_NAME = 'pending-assets';

interface PendingAsset {
  id: string;
  vaultId: string;
  encryptedData: Uint8Array;
  salt: string;
  iv: string;
  checksum: string;
  fileName: string;
  displayName: string;
  fileType: string;
  fileSize: number;
  category: 'secure_keys' | 'legal_docs' | 'video_legacy' | 'instructions';
  createdAt: number;
  blobUrl?: string; // 如果已上传到 Blob Storage
  metadataSaved: boolean; // 元数据是否已保存到数据库
}

/**
 * 初始化 IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('vaultId', 'vaultId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

/**
 * 保存待上传资产到 IndexedDB
 */
export async function savePendingAsset(asset: Omit<PendingAsset, 'id' | 'createdAt'>): Promise<string> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const pendingAsset: PendingAsset = {
      ...asset,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.add(pendingAsset);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return pendingAsset.id;
  } catch (error) {
    console.error('Failed to save pending asset to IndexedDB:', error);
    throw error;
  }
}

/**
 * 更新待上传资产状态
 */
export async function updatePendingAsset(
  id: string,
  updates: Partial<Pick<PendingAsset, 'blobUrl' | 'metadataSaved'>>
): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(id);
    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        const asset = request.result;
        if (asset) {
          Object.assign(asset, updates);
          const updateRequest = store.put(asset);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(); // 资产不存在，忽略
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to update pending asset:', error);
    // 不抛出错误，允许继续
  }
}

/**
 * 获取所有待上传资产
 */
export async function getPendingAssets(vaultId?: string): Promise<PendingAsset[]> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = vaultId
        ? store.index('vaultId').getAll(vaultId)
        : store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get pending assets:', error);
    return [];
  }
}

/**
 * 删除已成功上传的资产
 */
export async function removePendingAsset(id: string): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to remove pending asset:', error);
    // 不抛出错误，允许继续
  }
}

/**
 * 清理所有待上传资产（用于测试或重置）
 */
export async function clearPendingAssets(): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to clear pending assets:', error);
    throw error;
  }
}
