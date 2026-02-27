/**
 * SoloBoard - Website Monitoring Dashboard
 * 
 * Uses ShipAny standard layout (Header + Hero + Footer)
 * Core principle: Don't change ShipAny structure
 */

import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/core/auth';
import { envConfigs } from '@/config';
import { defaultLocale } from '@/config/locale';
import { SoloBoardDashboard } from './_components/soloboard-dashboard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('common.soloboard.page');

  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: {
      canonical:
        locale !== defaultLocale
          ? `${envConfigs.app_url}/${locale}/soloboard`
          : `${envConfigs.app_url}/soloboard`,
    },
  };
}

export default async function SoloBoardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // 🔒 检查用户登录状态
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  // 未登录用户重定向到登录页
  if (!session?.user) {
    redirect(`/${locale}/sign-in?callbackUrl=/${locale}/soloboard`);
  }
  
  return <SoloBoardDashboard />;
}
