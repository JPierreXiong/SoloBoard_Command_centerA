import Script from 'next/script';

import { envConfigs } from '@/config';
import { Landing } from '@/shared/types/blocks/landing';
import {
  CTA,
  FAQ,
  Features,
  Hero,
  ZeroKnowledgeSecurity,
} from '@/themes/default/blocks';

export default async function LandingPage({
  locale,
  page,
}: {
  locale?: string;
  page: Landing;
}) {
  // JSON-LD structured data for SEO
  const appUrl = envConfigs.app_url || 'https://soloboard.app';
  
  // SoftwareApplication JSON-LD
  const jsonLdSoftware = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SoloBoard',
    description:
      'All-in-one dashboard for solopreneurs. Monitor traffic, revenue, and site health for all your SaaS products in one unified dashboard. Connect Google Analytics, Stripe, Shopify, and more.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Multi-site monitoring',
      'Real-time analytics',
      'Revenue tracking',
      'Site health monitoring',
      'Google Analytics integration',
      'Stripe integration',
    ],
    url: appUrl,
  };

  // FAQPage JSON-LD (if FAQ exists)
  const jsonLdFAQ = page.faq?.items
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: page.faq.items.map((item) => ({
          '@type': 'Question',
          name: item.question || '',
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer || '',
          },
        })),
      }
    : null;

  return (
    <>
      {/* JSON-LD structured data for SEO */}
      <Script
        id="json-ld-software-application"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftware) }}
      />
      
      {/* FAQPage JSON-LD structured data */}
      {jsonLdFAQ && (
        <Script
          id="json-ld-faq-page"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFAQ) }}
        />
      )}

      {page.hero && <Hero hero={page.hero} />}
      
      {/* Digital Heirloom: How It Works Section */}
      {page['how-it-works'] && <Features features={page['how-it-works']} className="bg-muted" />}
      
      {/* Digital Heirloom: Zero-Knowledge Security Section */}
      {page['zero-knowledge-security'] && (
        <ZeroKnowledgeSecurity features={page['zero-knowledge-security']} />
      )}
      
      {/* Digital Heirloom: Technical Architecture Section */}
      {page['technical-architecture'] && (
        <Features features={page['technical-architecture']} className="bg-muted" />
      )}
      
      {page.faq && <FAQ faq={page.faq} />}
      {page.cta && <CTA cta={page.cta} className="bg-muted" />}
    </>
  );
}
