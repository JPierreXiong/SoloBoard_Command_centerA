# ShipAny 监控站点页面

## 概述

ShipAny 页面是一个多语言的监控站点选择界面，允许用户选择不同的平台来监控他们的业务指标。

## 文件结构

```
src/app/[locale]/(landing)/shipany/
├── page.tsx                              # 主页面组件
└── _components/
    └── platform-selector.tsx             # 平台选择器组件
```

## 国际化支持

翻译文件位于：
- `src/config/locale/messages/en/shipany.json` (英文)
- `src/config/locale/messages/zh/shipany.json` (中文)
- `src/config/locale/messages/fr/shipany.json` (法语)

## 支持的平台

1. **Uptime 监控** - 网站在线状态监控
2. **Google Analytics** - 网站流量分析
3. **Stripe** - 支付和收入追踪
4. **Lemon Squeezy** - 数字产品销售
5. **Shopify** - 电商平台

## 功能特性

- ✅ 多语言支持（英文、中文、法语）
- ✅ 响应式设计
- ✅ 使用 ShipAny 标准布局（Header + Hero + Footer）
- ✅ 步骤指示器
- ✅ 平台卡片展示
- ✅ 动画效果（使用 Framer Motion）
- ✅ 难度标签和设置时间显示

## 访问路径

- 英文: `/en/shipany`
- 中文: `/zh/shipany`
- 法语: `/fr/shipany`

## 页面布局

页面使用 `(landing)` 布局组，自动包含：
- Header（导航栏）
- Hero（英雄区域）
- Footer（页脚）

## 下一步开发

- [ ] 添加配置步骤页面
- [ ] 实现表单验证
- [ ] 连接后端 API
- [ ] 添加成功/错误提示
- [ ] 实现平台配置保存功能

## 技术栈

- Next.js 15
- TypeScript
- Tailwind CSS
- Framer Motion
- next-intl (国际化)
- shadcn/ui (UI 组件)







