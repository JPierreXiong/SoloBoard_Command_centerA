/**
 * SoloBoard 管理员仪表板
 * 路径: /admin/soloboard
 * 
 * 功能:
 * - 统计卡片（总站点、活跃用户、同步次数、异常站点）
 * - 站点列表（搜索、筛选、查看详情）
 * - 使用量统计图表
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { SoloBoardAdminContent } from '@/shared/components/admin/soloboard/dashboard-content';

export const metadata: Metadata = {
  title: 'SoloBoard Admin - Dashboard',
  description: 'Manage SoloBoard sites and monitor system health',
};

export default function SoloBoardAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">SoloBoard Management</h1>
        <p className="text-muted-foreground">
          Monitor all sites, users, and system health
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <SoloBoardAdminContent />
      </Suspense>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="h-96 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}

