# 已注释的文件清单

本文档记录所有为 Digital Heirloom 项目而注释的不相关文件。

## 注释原则

1. **不删除代码**：所有代码都保留，只是用注释包裹
2. **添加说明**：每个文件开头都有注释说明为什么被注释
3. **临时占位**：添加简单的占位导出，避免构建错误

---

## 已注释的文件

### Media API 路由（媒体提取功能）

- ✅ `src/app/api/media/submit/route.ts` - 提交媒体提取任务
- ⏳ `src/app/api/media/status/route.ts` - 查询任务状态
- ⏳ `src/app/api/media/translate/route.ts` - 翻译字幕
- ⏳ `src/app/api/media/video-download/route.ts` - 视频下载
- ⏳ `src/app/api/media/history/route.ts` - 历史记录
- ⏳ `src/app/api/media/download-proxy/route.ts` - 下载代理

### Testimonials API 路由（推荐功能）

- ⏳ `src/app/api/testimonials/route.ts`
- ⏳ `src/app/api/testimonials/submit/route.ts`
- ⏳ `src/app/api/admin/testimonials/route.ts`

### 其他不相关功能

- ⏳ AI Chat 相关（可能保留，待确认）
- ⏳ Media 相关的前端组件
- ⏳ Testimonials 相关的前端组件

---

## 注释模板

每个被注释的文件都遵循以下模板：

```typescript
/**
 * ============================================
 * ⚠️ 此文件已注释 - Digital Heirloom 项目不需要
 * ============================================
 * [文件功能说明]
 * 与 Digital Heirloom（数字遗产管理）项目不相关
 * 
 * 注释日期: 2025-01-09
 * 原因: 项目转向 Digital Heirloom，不再需要此功能
 * 
 * 如需恢复，请删除此注释块
 * ============================================
 */

// ============================================
// 以下代码已注释，但保留以备将来需要
// ============================================

/*
[原代码]
*/

// ============================================
// 注释结束
// ============================================

// 临时占位导出，避免构建错误
export async function POST() {
  return Response.json({ message: 'This endpoint is disabled for Digital Heirloom project' }, { status: 410 });
}
```

---

## 恢复方法

如需恢复某个文件：

1. 删除文件开头的注释说明
2. 删除 `/*` 和 `*/` 注释标记
3. 删除文件末尾的占位导出
4. 恢复原始代码

---

## 注意事项

⚠️ **不要删除代码**：所有代码都保留，只是注释掉
⚠️ **构建检查**：确保注释后项目仍能正常构建
⚠️ **依赖关系**：注释文件时注意检查是否有其他文件依赖




