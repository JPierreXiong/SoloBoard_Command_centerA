/**
 * ShipAny - 添加监控站点页面
 * 融合版：3步流程 (域名 → 收入源 → 流量)
 * 
 * 使用 ShipAny 标准布局（Header + Hero + Footer）
 */

import { getTranslations } from 'next-intl/server';
import { envConfigs } from '@/config';
import { defaultLocale } from '@/config/locale';
import { AddSiteFlow } from './_components/add-site-flow';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('shipany.page');

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical:
        locale !== defaultLocale
          ? `${envConfigs.app_url}/${locale}/shipany`
          : `${envConfigs.app_url}/shipany`,
    },
  };
}

export default async function ShipAnyPage() {
  const t = await getTranslations('shipany.page');
  
  return (
    <div className="container mx-auto px-4 py-16 mt-8">
      {/* Hero Section */}
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold">
          {t('title')}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('description')}
        </p>
      </div>

      {/* 3-Step Flow */}
      <AddSiteFlow />
    </div>
  );
}

