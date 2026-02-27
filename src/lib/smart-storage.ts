/**
 * 智能存储决策系统
 * 根据数据特征自动决定存储在数据库还是 Blob
 */

import { uploadJsonToBlob, uploadToBlob } from './blob-storage';
import { db } from '@/core/db';

/**
 * 数据特征分析
 */
interface DataCharacteristics {
  size: number; // 字节
  type: 'structured' | 'unstructured' | 'binary';
  queryFrequency: 'high' | 'medium' | 'low';
  needsRelations: boolean;
  needsIndexing: boolean;
  retentionDays: number;
}

/**
 * 存储决策结果
 */
interface StorageDecision {
  location: 'database' | 'blob' | 'hybrid';
  reason: string;
  recommendations: string[];
}

/**
 * 存储决策引擎
 */
export class StorageDecisionEngine {
  // 阈值配置
  private static readonly SIZE_THRESHOLD = 1024 * 1024; // 1MB
  private static readonly AGE_THRESHOLD = 30; // 30天
  
  /**
   * 分析数据并决定存储位置
   */
  static decide(characteristics: DataCharacteristics): StorageDecision {
    const reasons: string[] = [];
    let score = { database: 0, blob: 0 };
    
    // 1. 大小因素
    if (characteristics.size > this.SIZE_THRESHOLD) {
      score.blob += 3;
      reasons.push(`数据大小 ${(characteristics.size / 1024 / 1024).toFixed(2)}MB 超过阈值`);
    } else {
      score.database += 2;
      reasons.push('数据大小适合数据库');
    }
    
    // 2. 数据类型
    if (characteristics.type === 'structured') {
      score.database += 3;
      reasons.push('结构化数据适合数据库');
    } else if (characteristics.type === 'binary') {
      score.blob += 3;
      reasons.push('二进制数据适合 Blob');
    } else {
      score.blob += 1;
      reasons.push('非结构化数据倾向 Blob');
    }
    
    // 3. 查询频率
    if (characteristics.queryFrequency === 'high') {
      score.database += 3;
      reasons.push('高频查询需要数据库索引');
    } else if (characteristics.queryFrequency === 'low') {
      score.blob += 2;
      reasons.push('低频查询可以使用 Blob');
    }
    
    // 4. 关系需求
    if (characteristics.needsRelations) {
      score.database += 3;
      reasons.push('需要关联查询');
    }
    
    // 5. 索引需求
    if (characteristics.needsIndexing) {
      score.database += 2;
      reasons.push('需要索引支持');
    }
    
    // 6. 保留时间
    if (characteristics.retentionDays > this.AGE_THRESHOLD) {
      score.blob += 2;
      reasons.push('长期保留数据适合 Blob');
    }
    
    // 决策
    let location: 'database' | 'blob' | 'hybrid';
    let mainReason: string;
    const recommendations: string[] = [];
    
    if (score.database > score.blob + 2) {
      location = 'database';
      mainReason = '数据库存储更适合';
      recommendations.push('使用数据库索引优化查询');
      recommendations.push('定期归档旧数据到 Blob');
    } else if (score.blob > score.database + 2) {
      location = 'blob';
      mainReason = 'Blob 存储更适合';
      recommendations.push('使用 CDN 加速访问');
      recommendations.push('在数据库中保存元数据');
    } else {
      location = 'hybrid';
      mainReason = '混合存储最优';
      recommendations.push('元数据存数据库，内容存 Blob');
      recommendations.push('使用数据库记录 Blob URL');
    }
    
    return {
      location,
      reason: `${mainReason} (数据库: ${score.database}, Blob: ${score.blob})`,
      recommendations,
    };
  }
  
  /**
   * 快速决策：根据数据类型
   */
  static quickDecide(dataType: string, size: number): 'database' | 'blob' {
    // 图片、视频、音频 -> Blob
    if (['image', 'video', 'audio', 'pdf'].some(t => dataType.includes(t))) {
      return 'blob';
    }
    
    // 大文件 -> Blob
    if (size > this.SIZE_THRESHOLD) {
      return 'blob';
    }
    
    // JSON、文本、小文件 -> 数据库
    if (['json', 'text', 'xml'].some(t => dataType.includes(t)) && size < this.SIZE_THRESHOLD) {
      return 'database';
    }
    
    // 默认数据库
    return 'database';
  }
}

/**
 * 智能存储管理器
 */
export class SmartStorageManager {
  /**
   * 自动存储数据
   */
  static async store(
    data: any,
    metadata: {
      userId: string;
      category: string;
      contentType?: string;
    }
  ): Promise<{ location: 'database' | 'blob'; url?: string; id?: string }> {
    // 分析数据特征
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const size = Buffer.byteLength(dataString);
    
    const characteristics: DataCharacteristics = {
      size,
      type: this.detectDataType(data, metadata.contentType),
      queryFrequency: this.estimateQueryFrequency(metadata.category),
      needsRelations: this.needsRelations(metadata.category),
      needsIndexing: this.needsIndexing(metadata.category),
      retentionDays: this.getRetentionDays(metadata.category),
    };
    
    // 决策
    const decision = StorageDecisionEngine.decide(characteristics);
    
    console.log('Storage decision:', decision);
    
    // 执行存储
    if (decision.location === 'blob') {
      // 存储到 Blob
      const path = `${metadata.category}/${metadata.userId}/${Date.now()}.json`;
      const url = await uploadJsonToBlob(path, data);
      
      // 在数据库中保存元数据
      await this.saveMetadata({
        userId: metadata.userId,
        category: metadata.category,
        storageLocation: 'blob',
        blobUrl: url,
        size,
      });
      
      return { location: 'blob', url };
    } else if (decision.location === 'database') {
      // 存储到数据库
      // TODO: 根据 category 存储到相应的表
      return { location: 'database', id: 'db_id' };
    } else {
      // 混合存储
      const path = `${metadata.category}/${metadata.userId}/${Date.now()}.json`;
      const url = await uploadJsonToBlob(path, data);
      
      // 元数据存数据库
      const id = await this.saveMetadata({
        userId: metadata.userId,
        category: metadata.category,
        storageLocation: 'hybrid',
        blobUrl: url,
        size,
      });
      
      return { location: 'blob', url, id };
    }
  }
  
  /**
   * 检测数据类型
   */
  private static detectDataType(
    data: any,
    contentType?: string
  ): 'structured' | 'unstructured' | 'binary' {
    if (contentType) {
      if (contentType.includes('image') || contentType.includes('video')) {
        return 'binary';
      }
      if (contentType.includes('json')) {
        return 'structured';
      }
    }
    
    if (Buffer.isBuffer(data)) {
      return 'binary';
    }
    
    if (typeof data === 'object' && data !== null) {
      return 'structured';
    }
    
    return 'unstructured';
  }
  
  /**
   * 估算查询频率
   */
  private static estimateQueryFrequency(category: string): 'high' | 'medium' | 'low' {
    const highFrequency = ['user-profile', 'settings', 'recent-activity'];
    const lowFrequency = ['archive', 'backup', 'logs'];
    
    if (highFrequency.includes(category)) return 'high';
    if (lowFrequency.includes(category)) return 'low';
    return 'medium';
  }
  
  /**
   * 是否需要关联查询
   */
  private static needsRelations(category: string): boolean {
    const relationalCategories = ['orders', 'subscriptions', 'users', 'projects'];
    return relationalCategories.includes(category);
  }
  
  /**
   * 是否需要索引
   */
  private static needsIndexing(category: string): boolean {
    const indexedCategories = ['orders', 'users', 'metrics'];
    return indexedCategories.includes(category);
  }
  
  /**
   * 获取保留天数
   */
  private static getRetentionDays(category: string): number {
    const retentionPolicies: Record<string, number> = {
      'recent-metrics': 30,
      'historical-metrics': 365,
      'archive': 999,
      'logs': 90,
      'exports': 7,
      'backups': 30,
    };
    
    return retentionPolicies[category] || 30;
  }
  
  /**
   * 保存元数据到数据库
   */
  private static async saveMetadata(metadata: any): Promise<string> {
    // TODO: 实现元数据保存
    console.log('Saving metadata:', metadata);
    return 'metadata_id';
  }
}

/**
 * 使用示例
 */
export async function exampleUsage() {
  // 示例 1: 自动决策
  const decision = StorageDecisionEngine.decide({
    size: 2 * 1024 * 1024, // 2MB
    type: 'structured',
    queryFrequency: 'low',
    needsRelations: false,
    needsIndexing: false,
    retentionDays: 365,
  });
  
  console.log('Decision:', decision);
  // 输出: { location: 'blob', reason: '...', recommendations: [...] }
  
  // 示例 2: 快速决策
  const quickDecision = StorageDecisionEngine.quickDecide('image/jpeg', 5 * 1024 * 1024);
  console.log('Quick decision:', quickDecision); // 'blob'
  
  // 示例 3: 智能存储
  const result = await SmartStorageManager.store(
    { metrics: [/* 大量数据 */] },
    {
      userId: 'user_123',
      category: 'historical-metrics',
      contentType: 'application/json',
    }
  );
  
  console.log('Storage result:', result);
  // 输出: { location: 'blob', url: 'https://...' }
}

/**
 * 数据生命周期管理
 */
export class DataLifecycleManager {
  /**
   * 自动归档旧数据
   */
  static async archiveOldData(
    tableName: string,
    ageThresholdDays: number
  ): Promise<{ archived: number; deleted: number }> {
    const database = db();
    
    // 1. 查询旧数据
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ageThresholdDays);
    
    // TODO: 根据表名查询旧数据
    const oldData: any[] = [];
    
    // 2. 归档到 Blob
    let archived = 0;
    for (const record of oldData) {
      const path = `archive/${tableName}/${record.id}.json`;
      await uploadJsonToBlob(path, record);
      archived++;
    }
    
    // 3. 从数据库删除
    // TODO: 删除已归档的数据
    const deleted = archived;
    
    return { archived, deleted };
  }
  
  /**
   * 根据访问频率自动迁移
   */
  static async migrateByAccessPattern(
    dataId: string,
    accessCount: number,
    lastAccessDays: number
  ): Promise<'keep' | 'archive' | 'delete'> {
    // 决策规则
    if (accessCount > 100 && lastAccessDays < 7) {
      return 'keep'; // 高频访问，保留在数据库
    }
    
    if (lastAccessDays > 90) {
      if (accessCount < 10) {
        return 'delete'; // 低频且长时间未访问，删除
      }
      return 'archive'; // 归档到 Blob
    }
    
    if (lastAccessDays > 30 && accessCount < 50) {
      return 'archive'; // 中等频率，归档
    }
    
    return 'keep';
  }
}










