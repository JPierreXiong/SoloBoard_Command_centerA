# 🎨 SoloBoard UI 设计文档

## 设计理念

基于市场调研专家的建议，SoloBoard 的 UI 设计核心目标是：
1. **降低认知负担** - 一秒看懂现状
2. **消除管理焦虑** - 实时状态可视化
3. **提升操作效率** - 一键跳转后台

---

## 一、设计语言

### 1.1 色彩系统

**主色调：深邃蓝/石墨灰**
```css
/* 主色 */
--primary: 217 91% 60%;        /* 深邃蓝 */
--background: 222 47% 11%;     /* 石墨灰背景 */
--card: 222 47% 14%;           /* 卡片背景 */

/* 信号灯色（状态提示）*/
--green: 142 76% 36%;          /* 在线/正常 */
--red: 0 84% 60%;              /* 离线/错误 */
--yellow: 48 96% 53%;          /* 警告/异常 */
--blue: 217 91% 60%;           /* 流量指标 */
--purple: 262 83% 58%;         /* 用户指标 */
```

### 1.2 字体系统

```css
/* 大字报（核心数据）*/
.stat-value {
  font-size: 2rem;           /* 32px */
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

/* 标题 */
.card-title {
  font-size: 0.875rem;       /* 14px */
  font-weight: 600;
}

/* 辅助文本 */
.muted-text {
  font-size: 0.75rem;        /* 12px */
  color: hsl(var(--muted-foreground));
}
```

### 1.3 间距系统

```css
/* 卡片内边距 */
--card-padding: 1.5rem;      /* 24px */

/* 网格间距 */
--grid-gap: 1.5rem;          /* 24px */

/* 组件间距 */
--component-gap: 1rem;       /* 16px */
```

---

## 二、核心组件

### 2.1 顶部统计卡片 (StatCard)

**设计目标**: 全局概览，一眼看懂所有站点的汇总数据

**视觉特征**:
- 大字报核心数值（32px 粗体）
- 彩色图标（蓝/绿/紫/黄）
- 趋势百分比（绿涨红跌）
- 悬浮发光效果

**使用场景**:
```tsx
<StatCard
  title="总访客数 (24h)"
  value="12,400"
  icon={Users}
  color="blue"
  trend={{ value: 12.5, label: 'vs 昨日' }}
/>
```

**响应式布局**:
- 移动端: 1 列
- 平板: 2 列
- 桌面: 4 列

---

### 2.2 站点卡片 (SiteCard)

**设计目标**: 一秒看现状，一键跳后台

**视觉层次**:
1. **顶部**: Favicon + 网站名 + 状态呼吸灯
2. **中部**: 核心指标大字报（2 个）
3. **趋势**: 百分比变化（绿涨红跌）
4. **波形图**: 24 小时 Sparkline
5. **底部**: 平台标识 + 快捷操作

**状态呼吸灯**:
```tsx
{/* 在线状态 */}
<span className="animate-ping bg-green-400" />
<span className="bg-green-500" />

{/* 离线状态 */}
<span className="animate-ping bg-red-400" />
<span className="bg-red-500" />
```

**悬浮效果**:
- 边框高亮（primary/50）
- 阴影增强（shadow-xl）
- 操作按钮显示（opacity 0 → 100）

---

### 2.3 迷你波形图 (Sparkline)

**设计目标**: 快速识别趋势，无需复杂图表

**实现方式**:
```tsx
<div className="flex items-end gap-[2px] h-12">
  {sparkline.map((value, index) => (
    <div
      className="bg-primary/60 rounded-t-sm flex-1"
      style={{ height: `${value}%` }}
    />
  ))}
</div>
```

**数据格式**:
```typescript
sparkline: [20, 40, 30, 80, 50, 90, 40, 60, 70, 55, 85, 75]
// 12 个数据点，代表过去 24 小时（每 2 小时一个点）
```

---

## 三、页面布局

### 3.1 顶部导航栏

**固定定位** (sticky top-0)
- 左侧: Logo + 标题 + 实时状态
- 右侧: 搜索框 + 隐私模式 + 自动刷新 + 添加按钮

**实时状态指示器**:
```tsx
<div className="flex items-center gap-2 bg-green-500/10">
  <span className="animate-ping bg-green-400" />
  <span>Live</span>
  <span>{new Date().toLocaleTimeString()}</span>
</div>
```

### 3.2 全局统计区

**4 列网格布局**:
- 总访客数（蓝色）
- 平均在线用户（紫色）
- 交易数（黄色）
- 总收入（绿色）

### 3.3 站点网格区

**响应式网格**:
```css
grid-cols-1           /* 移动端: 1 列 */
md:grid-cols-2        /* 平板: 2 列 */
lg:grid-cols-3        /* 桌面: 3 列 */
xl:grid-cols-4        /* 大屏: 4 列 */
```

---

## 四、交互设计

### 4.1 全局搜索 (Cmd+K)

**快捷键**: `⌘K` (Mac) / `Ctrl+K` (Windows)

**功能**: 快速搜索站点名称

**实现**:
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('global-search')?.focus();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
}, []);
```

### 4.2 老板键（隐私模式）

**功能**: 一键模糊所有金额数据

**场景**: 在咖啡厅等公共场所查看监控

**实现**:
```tsx
{privacyMode ? '***' : actualValue}
```

### 4.3 自动刷新

**默认**: 开启，每 30 秒刷新

**实现**:
```tsx
useSWR('/api/soloboard/sites', fetcher, {
  refreshInterval: autoRefresh ? 30000 : 0
});
```

### 4.4 悬浮操作

**触发**: 鼠标悬浮在卡片上

**显示**: 
- 操作菜单（右上角）
- 快捷按钮（底部）

**实现**:
```css
.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}
```

---

## 五、响应式设计

### 5.1 断点系统

```css
/* Tailwind 默认断点 */
sm: 640px    /* 小屏手机 */
md: 768px    /* 平板 */
lg: 1024px   /* 桌面 */
xl: 1280px   /* 大屏 */
2xl: 1536px  /* 超大屏 */
```

### 5.2 移动端优化

**顶部导航**:
- 隐藏部分按钮
- 搜索框变为图标
- 汉堡菜单

**统计卡片**:
- 1 列布局
- 减小字体大小

**站点卡片**:
- 1 列布局
- 简化波形图

---

## 六、暗黑模式

### 6.1 自动切换

**跟随系统**: 默认跟随操作系统设置

**手动切换**: 右上角切换按钮

### 6.2 颜色适配

```css
/* 亮色模式 */
.light {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
}

/* 暗色模式 */
.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
}
```

---

## 七、性能优化

### 7.1 图片优化

**Favicon 缓存**:
```tsx
<img 
  src={favicon} 
  alt={name} 
  loading="lazy"
  className="w-6 h-6"
/>
```

### 7.2 数据缓存

**SWR 配置**:
```tsx
useSWR('/api/soloboard/sites', fetcher, {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 30000,
});
```

### 7.3 懒加载

**组件懒加载**:
```tsx
const SiteCard = lazy(() => import('./site-card'));
```

---

## 八、可访问性

### 8.1 键盘导航

- `Tab`: 焦点切换
- `Enter`: 激活按钮
- `⌘K`: 全局搜索
- `Esc`: 关闭对话框

### 8.2 屏幕阅读器

**ARIA 标签**:
```tsx
<button aria-label="刷新数据">
  <RefreshCw />
</button>
```

### 8.3 对比度

**WCAG AA 标准**: 对比度 ≥ 4.5:1

---

## 九、组件使用示例

### 9.1 完整页面

```tsx
import { StatCard } from '@/components/soloboard/stat-card';
import { SiteCard } from '@/components/soloboard/modern-site-card';

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      {/* 全局统计 */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          title="总访客数"
          value="12,400"
          icon={Users}
          color="blue"
        />
      </div>

      {/* 站点网格 */}
      <div className="grid grid-cols-3 gap-6">
        <SiteCard
          name="AI Copywriter"
          url="aicopy.com"
          platform="GA4 + Stripe"
          status="online"
          metrics={{
            primaryValue: 42,
            primaryLabel: '实时在线',
            secondaryValue: 128,
            secondaryLabel: '今日收入',
            secondaryUnit: '$',
            sparkline: [20, 40, 30, 80, 50, 90, 40],
          }}
        />
      </div>
    </div>
  );
}
```

---

## 十、设计检查清单

### 10.1 视觉设计
- [x] 使用深邃蓝/石墨灰主色调
- [x] 信号灯色状态提示（红/黄/绿）
- [x] 大字报核心数据
- [x] 迷你波形图
- [x] 状态呼吸灯

### 10.2 交互设计
- [x] 全局搜索 (⌘K)
- [x] 老板键（隐私模式）
- [x] 自动刷新（30 秒）
- [x] 悬浮操作
- [x] 一键跳转后台

### 10.3 响应式设计
- [x] 移动端 1 列
- [x] 平板 2 列
- [x] 桌面 3-4 列
- [x] 暗黑模式

### 10.4 性能优化
- [x] SWR 缓存
- [x] 图片懒加载
- [x] 组件懒加载
- [x] lastSnapshot 秒开

---

## 十一、下一步优化

### 11.1 短期（1-2 周）
- [ ] 添加站点对话框
- [ ] 站点详情页
- [ ] 报警设置面板
- [ ] AI 报告查看器

### 11.2 中期（1-2 月）
- [ ] 自定义仪表板布局
- [ ] 拖拽排序优化
- [ ] 实时 WebSocket 推送
- [ ] 移动端 App

---

## 十二、参考资源

### 12.1 设计灵感
- Vercel Dashboard
- Linear App
- Stripe Dashboard
- Plausible Analytics

### 12.2 组件库
- shadcn/ui: https://ui.shadcn.com/
- Tailwind CSS: https://tailwindcss.com/
- Lucide Icons: https://lucide.dev/

### 12.3 图表库
- Recharts: https://recharts.org/
- Chart.js: https://www.chartjs.org/

---

**设计完成日期**: 2026-02-06  
**版本**: v1.0.0  
**设计师**: Based on Market Research Expert Recommendations

---

💡 **核心理念**: "一秒看现状，一键跳后台" - 让独立开发者和 SaaS 老板能够快速掌握所有业务动态，无需在多个后台之间切换。
























