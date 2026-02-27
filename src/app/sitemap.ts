import { MetadataRoute } from 'next';
import { envConfigs } from '@/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = envConfigs.app_url || 'https://www.soloboard.app';
  const locales = ['en', 'zh', 'fr'];
  
  // Core marketing pages
  const routes = [
    '',
    '/pricing',
    '/about',
    '/contact',
    '/faq',
    '/soloboard',
    '/blog',
    '/privacy-policy',
    '/terms-of-service',
    '/disclaimer',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Generate entries for each locale and route combination
  locales.forEach((locale) => {
    routes.forEach((route) => {
      const url = locale === 'en' 
        ? `${baseUrl}${route}` 
        : `${baseUrl}/${locale}${route}`;
      
      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: route === '/blog' ? 'daily' : route === '' ? 'weekly' : 'monthly',
        priority: route === '' ? 1.0 : route === '/pricing' ? 0.9 : route === '/soloboard' ? 0.9 : 0.7,
      });
    });
  });

  return sitemapEntries;
}
