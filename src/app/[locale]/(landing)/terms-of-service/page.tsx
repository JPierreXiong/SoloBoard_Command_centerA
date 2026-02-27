import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FileText, Shield, CreditCard, AlertTriangle } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'terms.metadata' });

  return {
    title: t('title'),
    description: t('description'),
    robots: {
      index: false, // NOINDEX: 防止稀释核心关键词权重
      follow: true, // 允许爬取链接
    },
  };
}

export default async function TermsOfServicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('terms');

  const icons = [FileText, FileText, Shield, CreditCard, AlertTriangle];

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <FileText className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {t('metadata.title').replace(' - SoloBoard', '')}
        </h1>
        <p className="text-muted-foreground">{t('last_updated')}</p>
      </div>

      {/* Sections */}
      <div className="space-y-12">
        {[0, 1, 2, 3, 4].map((index) => {
          const Icon = icons[index];
          const section = t.raw(`sections.${index}`);
          
          return (
            <section key={index}>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Icon className="w-6 h-6" />
                {section.number}. {section.title}
              </h2>
              
              {section.content && (
                <p className="text-lg leading-relaxed mb-4">{section.content}</p>
              )}
              
              {section.items && (
                <div className="space-y-4 ml-4">
                  {section.items.map((item: any, itemIndex: number) => (
                    <div key={itemIndex} className="border-l-4 border-primary pl-4">
                      <h3 className="font-semibold mb-2">{item.subtitle}</h3>
                      <p className="text-muted-foreground">{item.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

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









