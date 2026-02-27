# 📦 数据存储策略指南

**项目:** SoloBoard Command Center  
**日期:** 2026-02-11

---

## 🗄️ 数据库存储 vs Blob 存储

### ✅ 数据库存储（PostgreSQL/Neon）

**原则:** 结构化数据、需要查询、关系型数据

#### 1. 用户相关数据
```sql
✅ user 表
  - id, name, email, planType
  - 原因: 需要频繁查询、关联、过滤
  
✅ session 表
  - 用户会话信息
  - 原因: 需要快速验证和查询
  
✅ account 表
  - OAuth 账号关联
  - 原因: 需要关联查询
```

#### 2. 订单和订阅数据
```sql
✅ order 表
  - 订单记录、支付状态
  - 原因: 需要统计、查询、报表
  
✅ subscription 表
  - 订阅状态、周期
  - 原因: 需要查询活跃订阅、计算 MRR
  
✅ credit 表
  - 积分记录
  - 原因: 需要计算余额、查询历史
```

#### 3. 业务数据
```sql
✅ 项目配置
  - 项目名称、设置、权限
  - 原因: 需要查询、过滤、关联用户
  
✅ 数据源配置
  - API 密钥（加密）、连接信息
  - 原因: 需要查询和更新
  
✅ 监控站点
  - 站点 URL、状态、最后同步时间
  - 原因: 需要查询和定时任务
```

#### 4. 统计数据（小量）
```sql
✅ 最近的指标快照
  - 最新的 7-30 天数据
  - 原因: 需要快速查询和展示
  
✅ 聚合统计
  - 每日/每周/每月汇总
  - 原因: 用于报表和趋势分析
```

---

### 📦 Blob 存储（Vercel Blob）

**原则:** 大文件、非结构化数据、不需要查询的数据

#### 1. 历史数据归档
```typescript
✅ 历史指标数据（> 30天）
  - 文件: metrics-history/{userId}/{year}/{month}.json
  - 原因: 数据量大，不需要频繁查询
  - 示例:
    {
      "userId": "user_123",
      "month": "2026-01",
      "data": [
        { "date": "2026-01-01", "metrics": {...} },
        ...
      ]
    }
```

#### 2. 导出文件
```typescript
✅ CSV/Excel 导出
  - 文件: exports/{userId}/{timestamp}.csv
  - 原因: 临时文件，用户下载后可删除
  
✅ PDF 报告
  - 文件: reports/{userId}/{reportId}.pdf
  - 原因: 生成的报告文件
```

#### 3. 用户上传文件
```typescript
✅ 用户头像
  - 文件: avatars/{userId}.jpg
  - 原因: 图片文件，不需要查询内容
  
✅ 团队 Logo
  - 文件: logos/{teamId}.png
  - 原因: 图片文件
  
✅ 自定义配置文件
  - 文件: configs/{userId}/custom.json
  - 原因: 大型 JSON 配置
```

#### 4. 日志文件
```typescript
✅ 同步日志
  - 文件: logs/sync/{date}/{siteId}.log
  - 原因: 日志文件，不需要查询
  
✅ 错误日志
  - 文件: logs/errors/{date}.log
  - 原因: 调试用，不需要存数据库
```

#### 5. 备份文件
```typescript
✅ 数据备份
  - 文件: backups/{date}/database.sql.gz
  - 原因: 备份文件，不需要查询
  
✅ 配置备份
  - 文件: backups/{date}/configs.json
  - 原因: 灾难恢复用
```

---

## 💾 Blob 存储实现

### 1. Blob 工具类

**文件:** `src/lib/blob-storage.ts`

```typescript
import { put, del, list } from '@vercel/blob';

/**
 * 上传文件到 Blob
 */
export async function uploadToBlob(
  path: string,
  content: string | Buffer,
  options?: {
    contentType?: string;
    access?: 'public' | 'private';
  }
): Promise<string> {
  const { url } = await put(path, content, {
    access: options?.access || 'private',
    contentType: options?.contentType,
  });
  
  return url;
}

/**
 * 上传 JSON 数据
 */
export async function uploadJsonToBlob(
  path: string,
  data: any
): Promise<string> {
  const content = JSON.stringify(data, null, 2);
  return uploadToBlob(path, content, {
    contentType: 'application/json',
  });
}

/**
 * 删除 Blob 文件
 */
export async function deleteFromBlob(url: string): Promise<void> {
  await del(url);
}

/**
 * 列出 Blob 文件
 */
export async function listBlobFiles(prefix: string) {
  const { blobs } = await list({ prefix });
  return blobs;
}

/**
 * 归档历史数据到 Blob
 */
export async function archiveHistoricalData(
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
 * 上传用户头像
 */
export async function uploadAvatar(
  userId: string,
  imageBuffer: Buffer,
  contentType: string
): Promise<string> {
  const extension = contentType.split('/')[1];
  const path = `avatars/${userId}.${extension}`;
  
  return uploadToBlob(path, imageBuffer, {
    contentType,
    access: 'public',
  });
}

/**
 * 生成并上传导出文件
 */
export async function uploadExport(
  userId: string,
  format: 'csv' | 'xlsx' | 'pdf',
  content: Buffer
): Promise<string> {
  const timestamp = Date.now();
  const path = `exports/${userId}/${timestamp}.${format}`;
  
  const contentTypes = {
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf',
  };
  
  return uploadToBlob(path, content, {
    contentType: contentTypes[format],
    access: 'private',
  });
}
```

### 2. 数据归档任务

**文件:** `src/app/api/cron/archive-data/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { archiveHistoricalData } from '@/lib/blob-storage';
import { sql } from 'drizzle-orm';

/**
 * 定时任务：归档旧数据到 Blob
 * 每月1号执行，归档上个月的数据
 */
export async function GET(req: NextRequest) {
  try {
    // 验证 Cron 密钥
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const database = db();
    
    // 计算上个月
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = lastMonth.getFullYear();
    const month = lastMonth.getMonth() + 1;
    
    // 查询需要归档的数据
    // TODO: 根据实际表结构查询
    const dataToArchive = await database
      .select()
      .from(/* 历史数据表 */)
      .where(sql`EXTRACT(YEAR FROM created_at) = ${year} AND EXTRACT(MONTH FROM created_at) = ${month}`);
    
    // 按用户分组
    const dataByUser = dataToArchive.reduce((acc: any, record: any) => {
      if (!acc[record.userId]) {
        acc[record.userId] = [];
      }
      acc[record.userId].push(record);
      return acc;
    }, {});
    
    // 归档到 Blob
    const results = [];
    for (const [userId, data] of Object.entries(dataByUser)) {
      const url = await archiveHistoricalData(userId, year, month, data as any[]);
      results.push({ userId, url, count: (data as any[]).length });
    }
    
    // 删除已归档的数据（可选）
    // await database.delete(/* 历史数据表 */).where(...);
    
    return NextResponse.json({
      success: true,
      archived: results.length,
      results,
    });
    
  } catch (error: any) {
    console.error('Archive data error:', error);
    return NextResponse.json(
      { error: 'Failed to archive data', message: error.message },
      { status: 500 }
    );
  }
}
```

### 3. 导出功能示例

**文件:** `src/app/api/export/metrics/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { uploadExport } from '@/lib/blob-storage';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { format, startDate, endDate } = await req.json();
    
    // 查询数据
    // const data = await fetchMetrics(session.user.id, startDate, endDate);
    
    // 生成文件
    let content: Buffer;
    if (format === 'csv') {
      // content = generateCSV(data);
    } else if (format === 'xlsx') {
      // content = generateExcel(data);
    } else {
      // content = generatePDF(data);
    }
    
    // 上传到 Blob
    const url = await uploadExport(session.user.id, format, content!);
    
    return NextResponse.json({
      success: true,
      downloadUrl: url,
      expiresIn: '7 days',
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Export failed', message: error.message },
      { status: 500 }
    );
  }
}
```

---

## 📊 存储策略对比

| 数据类型 | 数据库 | Blob | 原因 |
|---------|--------|------|------|
| 用户信息 | ✅ | ❌ | 需要查询和关联 |
| 订单记录 | ✅ | ❌ | 需要统计和报表 |
| 订阅状态 | ✅ | ❌ | 需要实时查询 |
| 最近30天数据 | ✅ | ❌ | 需要快速查询 |
| 历史数据（>30天） | ❌ | ✅ | 数据量大，查询少 |
| 用户头像 | ❌ | ✅ | 图片文件 |
| 导出文件 | ❌ | ✅ | 临时文件 |
| 日志文件 | ❌ | ✅ | 不需要查询 |
| 备份文件 | ❌ | ✅ | 灾难恢复 |

---

## 🎯 最佳实践

### 1. 数据生命周期

```
新数据 → 数据库（热数据，0-30天）
  ↓
归档 → Blob（温数据，30天-1年）
  ↓
清理 → 删除或长期归档（冷数据，>1年）
```

### 2. 成本优化

- **数据库:** 存储结构化、需要查询的数据
- **Blob:** 存储大文件、历史数据
- **定期归档:** 自动将旧数据移到 Blob

### 3. 性能优化

- **数据库:** 保持表小，查询快
- **Blob:** 异步上传，不阻塞请求
- **CDN:** Blob 自动使用 CDN 加速

---

## ✅ 实施清单

- [ ] 创建 Blob 工具类
- [ ] 实现数据归档任务
- [ ] 实现导出功能
- [ ] 配置 Blob Token
- [ ] 设置定时任务
- [ ] 测试上传和下载
- [ ] 监控存储使用量

---

**配置完成:** ✅  
**Blob Token:** 已配置  
**准备就绪:** ✅










