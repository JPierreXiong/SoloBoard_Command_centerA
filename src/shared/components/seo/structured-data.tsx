/**
 * SEO Structured Data (JSON-LD)
 * 为搜索引擎提供结构化数据，增强 SEO 效果
 */

import { envConfigs } from '@/config';

interface StructuredDataProps {
  type: 'website' | 'organization' | 'product' | 'article' | 'breadcrumb';
  data?: any;
}

function StructuredData({ type, data }: StructuredDataProps) {
  const baseUrl = envConfigs.app_url || 'https://www.soloboard.app';
  const appName = envConfigs.app_name || 'SoloBoard';

  let structuredData: Record<string, any> = {};

  switch (type) {
    case 'website':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: appName,
        url: baseUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      };
      break;

    case 'organization':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: appName,
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
        sameAs: [
          // Add your social media links here
          // 'https://twitter.com/yourhandle',
          // 'https://facebook.com/yourpage',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Service',
          url: `${baseUrl}/contact`,
        },
      };
      break;

    case 'product':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: data?.name || appName,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: data?.price || '0',
          priceCurrency: 'USD',
        },
        aggregateRating: data?.rating
          ? {
              '@type': 'AggregateRating',
              ratingValue: data.rating.value,
              reviewCount: data.rating.count,
            }
          : undefined,
      };
      break;

    case 'article':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data?.title,
        description: data?.description,
        image: data?.image || `${baseUrl}/logo.png`,
        datePublished: data?.publishedAt,
        dateModified: data?.updatedAt || data?.publishedAt,
        author: {
          '@type': 'Organization',
          name: appName,
        },
        publisher: {
          '@type': 'Organization',
          name: appName,
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/logo.png`,
          },
        },
      };
      break;

    case 'breadcrumb':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: data?.items?.map((item: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: `${baseUrl}${item.url}`,
        })),
      };
      break;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * 预设的结构化数据组件
 */
export function WebsiteStructuredData() {
  const baseUrl = envConfigs.app_url || 'https://www.soloboard.app';
  const appName = envConfigs.app_name || 'SoloBoard';
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: appName,
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function OrganizationStructuredData() {
  const baseUrl = envConfigs.app_url || 'https://www.soloboard.app';
  const appName = envConfigs.app_name || 'SoloBoard';
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: appName,
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      url: `${baseUrl}/contact`,
    },
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function ProductStructuredData(props: {
  name?: string;
  price?: string;
  rating?: { value: number; count: number };
}) {
  return <StructuredData type="product" data={props} />;
}

export function ArticleStructuredData(props: {
  title: string;
  description: string;
  image?: string;
  publishedAt: string;
  updatedAt?: string;
}) {
  return <StructuredData type="article" data={props} />;
}

export function BreadcrumbStructuredData(props: {
  items: Array<{ name: string; url: string }>;
}) {
  return <StructuredData type="breadcrumb" data={props} />;
}

