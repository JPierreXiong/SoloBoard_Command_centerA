// Next.js automatically loads .env files, so we don't need manual dotenv loading
// This file is safe for Edge Runtime, Node.js, and browser environments
// DO NOT add any Node.js APIs here as this file is imported by middleware

export type ConfigMap = Record<string, string>;

export const envConfigs = {
  app_url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  app_name: process.env.NEXT_PUBLIC_APP_NAME ?? 'Command Center',
  theme: process.env.NEXT_PUBLIC_THEME ?? 'default',
  appearance: process.env.NEXT_PUBLIC_APPEARANCE ?? 'system',
  locale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en',
  database_url: process.env.DATABASE_URL ?? '',
  database_provider: process.env.DATABASE_PROVIDER ?? 'postgresql',
  db_singleton_enabled: process.env.DB_SINGLETON_ENABLED || 'false',
  auth_url: process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '',
  auth_secret: process.env.AUTH_SECRET ?? '', // openssl rand -base64 32
  // Creem Payment Configuration
  creem_api_key: process.env.CREEM_API_KEY ?? '',
  creem_environment: process.env.CREEM_ENVIRONMENT ?? 'sandbox',
  creem_signing_secret: process.env.CREEM_SIGNING_SECRET ?? '',
  creem_webhook_secret: process.env.CREEM_WEBHOOK_SECRET ?? '',
  creem_webhook_url: process.env.CREEM_WEBHOOK_URL ?? '',
  creem_product_id_base: process.env.CREEM_PRODUCT_ID_BASE ?? '',
  creem_product_id_pro: process.env.CREEM_PRODUCT_ID_PRO ?? '',
  creem_enabled: process.env.CREEM_ENABLED ?? 'true',
  default_payment_provider: process.env.DEFAULT_PAYMENT_PROVIDER ?? 'creem',
  creem_product_ids: process.env.CREEM_PRODUCT_IDS ?? '',
};
