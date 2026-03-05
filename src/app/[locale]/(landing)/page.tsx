import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/core/auth';
import { getThemePage } from '@/core/theme';
import { Landing } from '@/shared/types/blocks/landing';

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // 🎯 P1: 已登录用户直接进入 Dashboard
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (session?.user) {
    redirect(`/${locale}/soloboard`);
  }

  // load page data
  const t = await getTranslations('landing');

  // build page params
  const heroData = t.raw('hero');
  const howItWorksData = t.raw('how-it-works');
  const featuresData = t.raw('features');
  const subscribeData = t.raw('subscribe');
  const faqData = t.raw('faq');
  const ctaData = t.raw('cta');

  const page: Landing = {
    hero: heroData ? {
      ...heroData,
      // 关闭可能导致误会的"后台截图"图片，符合 Creem 合规要求
      image: undefined,
      image_invert: undefined,
      // 确保不显示虚假用户头像
      show_avatars: false,
    } : undefined,
    // 明确设为 undefined 阻止 UI 渲染
    logos: undefined,
    introduce: undefined,
    benefits: undefined,
    usage: undefined,
    stats: undefined,
    
    // SoloBoard: 显示功能区块
    'how-it-works': howItWorksData || undefined,
    features: featuresData || undefined,
    
    // 隐藏用户评价
    testimonials: undefined,
    
    // 可选保留的区块
    subscribe: subscribeData || undefined,
    faq: faqData || undefined,
    cta: ctaData || undefined,
  };

  // load page component
  const Page = await getThemePage('landing');

  return <Page locale={locale} page={page} />;
}
