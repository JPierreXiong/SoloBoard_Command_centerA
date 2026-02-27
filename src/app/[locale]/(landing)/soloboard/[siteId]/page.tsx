/**
 * Site Details Page
 * 显示单个网站的详细信息和历史数据
 */

import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { SiteDetailsView } from './_components/site-details-view';

interface PageProps {
  params: Promise<{
    locale: string;
    siteId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations('common.soloboard');

  return {
    title: `${t('site_details.title')} - SoloBoard`,
    description: t('site_details.description'),
  };
}

export default async function SiteDetailsPage({ params }: PageProps) {
  const { siteId } = await params;

  // TODO: Fetch site data from API
  // const site = await fetchSiteData(siteId);
  // if (!site) notFound();

  return <SiteDetailsView siteId={siteId} />;
}







