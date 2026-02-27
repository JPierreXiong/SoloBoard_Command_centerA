'use client';

import { useTranslations } from 'next-intl';
import { LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export function SoloBoardHero() {
  const t = useTranslations('common.soloboard');

  return (
    <div className="py-20">
      <div className="text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6">
          <LayoutDashboard className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {t('title')}
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8">
          {t('description')}
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            {t('enter_dashboard')}
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            {t('view_pricing')}
          </Link>
        </div>

        {/* 功能预览 */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold mb-2">{t('features.ga4.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('features.ga4.description')}
            </p>
          </div>
          
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="font-semibold mb-2">{t('features.revenue.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('features.revenue.description')}
            </p>
          </div>
          
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold mb-2">{t('features.uptime.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('features.uptime.description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
