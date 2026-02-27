import { redirect } from 'next/navigation';

/**
 * Media Tasks Page - Redirected to Digital Heirloom Dashboard
 * 
 * This page has been redirected to align with Digital Heirloom's core business logic.
 * The old AI media extraction history functionality is no longer available.
 * 
 * Note: This redirect does not affect ShipAny structure.
 */
export default async function MediaTasksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Redirect to Digital Heirloom Dashboard
  redirect(`/${locale}/digital-heirloom/dashboard`);
}


