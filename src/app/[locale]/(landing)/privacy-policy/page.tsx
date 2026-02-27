import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Shield, Lock, Database, Eye } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacy.metadata' });

  return {
    title: t('title'),
    description: t('description'),
    robots: {
      index: false, // NOINDEX: 防止稀释核心关键词权重
      follow: true, // 允许爬取链接
    },
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('privacy');

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Shield className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {t('metadata.title').replace(' - SoloBoard', '')}
        </h1>
        <p className="text-muted-foreground">{t('last_updated')}</p>
      </div>

      {/* Introduction */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">{t('introduction.title')}</h2>
        <p className="text-lg leading-relaxed">{t('introduction.content')}</p>
      </section>

      {/* Data Collection */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Database className="w-6 h-6" />
          {t('data_collection.title')}
        </h2>
        <div className="space-y-6">
          {[0, 1, 2].map((index) => (
            <div key={index} className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold text-lg mb-2">
                {t(`data_collection.items.${index}.subtitle`)}
              </h3>
              <p className="text-muted-foreground">
                {t(`data_collection.items.${index}.content`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Data Usage */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Lock className="w-6 h-6" />
          {t('data_usage.title')}
        </h2>
        <div className="space-y-6">
          {[0, 1, 2].map((index) => (
            <div key={index} className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold text-lg mb-2">
                {t(`data_usage.items.${index}.subtitle`)}
              </h3>
              <p className="text-muted-foreground">
                {t(`data_usage.items.${index}.content`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Data Retention */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">{t('data_retention.title')}</h2>
        <p className="text-lg leading-relaxed">{t('data_retention.content')}</p>
      </section>

      {/* Compliance */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Eye className="w-6 h-6" />
          {t('compliance.title')}
        </h2>
        <p className="text-lg leading-relaxed">{t('compliance.content')}</p>
      </section>

      {/* Transparency Note */}
      <div className="mt-16 p-6 bg-muted/50 rounded-lg text-center">
        <p className="text-lg">
          {t('transparency_note.content')}{' '}
          <a
            href="https://twitter.com/SoloBoardApp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
          >
            {t('transparency_note.link_text')}
          </a>
        </p>
      </div>
    </div>
  );
}









