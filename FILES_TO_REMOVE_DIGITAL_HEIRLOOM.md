# Digital Heirloom - 待删除文件清单

本文档列出所有与 Digital Heirloom 项目不相关的文件和函数，已标注待删除。

**标注日期**: 2025-01-09  
**删除策略**: 先标注，确认后再删除

---

## 📋 分类清单

### 1. RapidAPI 相关（媒体提取功能）

#### 扩展层 (Extensions)
- ⚠️ `src/extensions/media/rapidapi.ts` - RapidAPI Provider 核心实现（1700+ 行）
  - 包含 YouTube/TikTok 视频下载和字幕提取
  - 与 Digital Heirloom 无关
  
- ⚠️ `src/extensions/media/index.ts` - Media 扩展导出文件
  - 导出 RapidAPI 相关功能

#### 服务层 (Services)
- ⚠️ `src/shared/services/media/rapidapi.ts` - RapidAPI 服务管理器
  - `getRapidAPIServiceWithConfigs()`
  - `getRapidAPIService()`
  - `fetchMediaFromRapidAPI()`

- ⚠️ `src/shared/services/media/video-storage.ts` - 视频存储服务
  - `uploadVideoToStorage()`
  - `uploadVideoToR2()`
  - 用于存储从 RapidAPI 下载的视频

- ⚠️ `src/shared/services/media/processor.ts` - 媒体处理服务
  - 处理媒体任务相关逻辑

- ⚠️ `src/shared/services/media/plan-limits.ts` - 计划限制检查
  - `checkAllPlanLimits()`
  - `getEstimatedCreditsCost()`
  - `getUserPlanLimits()`
  - 用于媒体提取任务的积分和限制检查

- ⚠️ `src/shared/services/media/gemini-translator.ts` - Gemini 翻译服务
  - 用于字幕翻译功能

- ⚠️ `src/shared/services/media/checkin.ts` - 签到相关（可能保留，需确认）
  - 如果只用于积分奖励，可保留

#### 模型层 (Models)
- ⚠️ `src/shared/models/media_task.ts` - 媒体任务模型
  - `createMediaTask()`
  - `findMediaTaskById()`
  - `updateMediaTaskById()`
  - `getUserMediaTasks()`
  - 所有媒体任务相关的 CRUD 操作

- ⚠️ `src/shared/models/video_cache.ts` - 视频缓存模型
  - `findValidVideoCache()`
  - `setVideoCache()`
  - 用于缓存 RapidAPI 下载的视频 URL

#### 工具函数
- ⚠️ `src/shared/lib/media-url.ts` - 媒体 URL 处理工具
  - `generateVideoFingerprint()`
  - `normalizeMediaUrl()`
  - 用于处理 YouTube/TikTok URL

#### Hooks
- ⚠️ `src/shared/hooks/use-media.ts` - Media Hook
  - 用于前端媒体提取功能

- ⚠️ `src/shared/hooks/use-media-task.ts` - Media Task Hook
  - 用于前端媒体任务管理

---

### 2. Testimonials 相关（用户评价功能）

#### 模型层
- ⚠️ `src/shared/models/testimonial.ts` - Testimonial 模型
  - `createTestimonial()`
  - `getApprovedTestimonials()`
  - `updateTestimonialById()`
  - `deleteTestimonialById()`
  - 所有 Testimonial 相关的 CRUD 操作

#### 工具函数
- ⚠️ `src/shared/lib/testimonial-helpers.ts` - Testimonial 辅助函数
  - `convertTestimonialToTestimonialsItem()`
  - `convertTestimonialsToTestimonialsType()`

#### API 路由
- ⚠️ `src/app/api/admin/testimonials/route.ts` - 管理员 Testimonials API
- ⚠️ `src/app/api/admin/testimonials/[id]/route.ts` - 单个 Testimonial 操作
- ⚠️ `src/app/api/admin/testimonials/[id]/approve/route.ts` - 批准 Testimonial
- ⚠️ `src/app/api/admin/testimonials/[id]/reject/route.ts` - 拒绝 Testimonial

#### 前端页面
- ⚠️ `src/app/[locale]/(admin)/admin/testimonials/page.tsx` - Testimonials 管理页面
- ⚠️ `src/app/[locale]/(admin)/admin/testimonials/add/page.tsx` - 添加 Testimonial 页面
- ⚠️ `src/app/[locale]/(admin)/admin/testimonials/[id]/edit/page.tsx` - 编辑 Testimonial 页面

#### 组件
- ⚠️ `src/themes/default/blocks/testimonials.tsx` - Testimonials 展示组件
  - 已在 landing.tsx 中注释，但文件仍存在

---

### 3. Media 相关前端组件

#### 生成器组件
- ⚠️ `src/shared/blocks/generator/media.tsx` - Media 提取器组件
- ⚠️ `src/shared/blocks/generator/media-task-result.tsx` - Media 任务结果组件
- ⚠️ `src/shared/blocks/generator/media-history.tsx` - Media 历史记录组件

#### 页面
- ⚠️ `src/app/[locale]/(landing)/(ai)/ai-media-extractor/page.tsx` - AI Media Extractor 页面
- ⚠️ `src/app/[locale]/(landing)/activity/media-tasks/page.tsx` - Media Tasks 活动页面

---

### 4. 数据库 Schema

#### 表定义（在 `src/config/db/schema.ts` 中）
- ⚠️ `mediaTask` 表 - 媒体任务表
  - 包含所有媒体提取任务的数据结构

- ⚠️ `videoCache` 表 - 视频缓存表
  - 用于缓存视频下载 URL

- ⚠️ `testimonial` 表 - 用户评价表
  - 包含所有 Testimonial 的数据结构

**注意**: 这些表定义在 `schema.ts` 中，删除时需要：
1. 注释掉表定义
2. 检查是否有其他表的外键引用
3. 确认迁移脚本中也需要注释

---

### 5. 配置文件

#### 环境变量（在 `.env.local` 中）
- ⚠️ `NEXT_PUBLIC_RAPIDAPI_KEY` - RapidAPI API Key
- ⚠️ `NEXT_PUBLIC_RAPIDAPI_HOST_TIKTOK_DOWNLOAD` - TikTok 下载 Host
- ⚠️ `NEXT_PUBLIC_RAPIDAPI_HOST_TIKTOK_TRANSCRIPT` - TikTok 字幕 Host
- ⚠️ `NEXT_PUBLIC_RAPIDAPI_HOST_YOUTUBE_TRANSCRIPT` - YouTube 字幕 Host
- ⚠️ `NEXT_PUBLIC_RAPIDAPI_HOST_YOUTUBE_DOWNLOAD` - YouTube 下载 Host

#### 设置配置（在 `src/shared/services/settings.ts` 中）
- ⚠️ `rapidapi_media_key` - RapidAPI Media Key 配置项

---

### 6. 国际化文件

#### Landing 页面相关（可能包含 Media/Testimonials 引用）
- ⚠️ `src/config/locale/messages/en/landing.json` - 已更新为 Afterglow，但可能仍有旧引用
- ⚠️ `src/config/locale/messages/zh/landing.json` - 需要检查
- ⚠️ `src/config/locale/messages/fr/landing.json` - 需要检查

#### Media 相关
- ⚠️ `src/config/locale/messages/en/ai/media.json` - Media 提取器国际化
- ⚠️ `src/config/locale/messages/zh/ai/media.json` - 需要检查
- ⚠️ `src/config/locale/messages/fr/ai/media.json` - 需要检查

---

## 🔍 依赖关系检查

### 需要检查的文件（可能引用上述代码）

1. **Credit 系统**
   - `src/shared/models/credit.ts` - 检查是否有 Media Task 相关的积分消费逻辑
   - 可能需要保留，但移除 Media 相关的场景

2. **Activity 页面**
   - `src/app/[locale]/(landing)/activity/page.tsx` - 可能显示 Media Tasks
   - 需要检查并移除相关引用

3. **Settings 页面**
   - 可能包含 RapidAPI 配置项
   - 需要移除相关配置

4. **Header/Navigation**
   - `src/themes/default/blocks/header.tsx` - 可能包含 Media Extractor 链接
   - 需要移除相关导航项

5. **Plans 配置**
   - `src/shared/config/plans.ts` - 可能包含 Media 相关的计划限制
   - 需要检查并清理

---

## 📝 删除步骤建议

### Phase 1: 标注和确认
1. ✅ 创建此文档（已完成）
2. ⏳ 检查依赖关系
3. ⏳ 确认哪些可以安全删除

### Phase 2: 删除代码
1. ⏳ 删除 RapidAPI 相关文件
2. ⏳ 删除 Media Task 相关文件
3. ⏳ 删除 Testimonials 相关文件
4. ⏳ 删除前端组件和页面

### Phase 3: 清理配置
1. ⏳ 清理环境变量
2. ⏳ 清理数据库 Schema
3. ⏳ 清理国际化文件
4. ⏳ 清理 Settings 配置

### Phase 4: 验证
1. ⏳ 运行 lint 检查
2. ⏳ 运行构建测试
3. ⏳ 确认无引用错误

---

## ⚠️ 注意事项

1. **数据库迁移**: 删除表定义前，需要确认是否要保留数据或执行迁移
2. **外键约束**: 检查是否有其他表引用这些表
3. **环境变量**: 删除前确认没有其他地方使用
4. **构建错误**: 删除后需要确保项目能正常构建
5. **Git 历史**: 建议在删除前创建分支，以便需要时恢复

---

## 📊 统计

- **RapidAPI 相关文件**: ~15 个文件
- **Testimonials 相关文件**: ~10 个文件
- **Media 前端组件**: ~5 个文件
- **数据库表**: 3 个表
- **总计**: ~33 个文件/组件需要处理

---

**最后更新**: 2025-01-09




