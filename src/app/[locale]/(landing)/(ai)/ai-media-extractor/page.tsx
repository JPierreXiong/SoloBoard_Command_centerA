import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

/**
 * AI Media Extractor Page - Redirected to Digital Heirloom Dashboard
 * 
 * This page has been redirected to align with Digital Heirloom's core business logic.
 * The old AI media extraction functionality is no longer available.
 * 
 * Note: This redirect does not affect ShipAny structure.
 */
export default async function AiMediaExtractorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Redirect to Digital Heirloom Dashboard
  redirect(`/${locale}/digital-heirloom/dashboard`);
}







