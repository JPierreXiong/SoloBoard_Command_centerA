/**
 * SoloBoard - 九宫格布局组件
 * 
 * 使用 @dnd-kit 实现拖拽排序
 */

'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SiteCard } from './site-card';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface Site {
  id: string;
  name: string;
  url: string;
  platform: 'GA4' | 'STRIPE' | 'UPTIME' | 'LEMON_SQUEEZY' | 'SHOPIFY';
  status: 'active' | 'error' | 'paused';
  healthStatus: 'online' | 'offline' | 'unknown';
  lastSnapshot: {
    metrics: Record<string, any>;
    updatedAt: string;
  } | null;
  lastSyncAt: string | null;
  displayOrder: number;
}

interface SiteGridProps {
  sites: Site[];
  onRefresh: () => void;
}

export function SiteGrid({ sites: initialSites, onRefresh }: SiteGridProps) {
  const t = useTranslations('dashboard');
  const [sites, setSites] = useState(initialSites);

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 移动 8px 后才开始拖拽
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 处理拖拽结束
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sites.findIndex((site) => site.id === active.id);
    const newIndex = sites.findIndex((site) => site.id === over.id);

    // 更新本地状态
    const newSites = arrayMove(sites, oldIndex, newIndex);
    setSites(newSites);

    // TODO: 保存新的排序到后端
    try {
      // await fetch('/api/soloboard/sites/reorder', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     siteIds: newSites.map((s) => s.id),
      //   }),
      // });
      toast.success(t('reorder_success'));
    } catch (error) {
      toast.error(t('reorder_failed'));
      // 恢复原来的顺序
      setSites(initialSites);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sites.map((s) => s.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} onRefresh={onRefresh} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}











