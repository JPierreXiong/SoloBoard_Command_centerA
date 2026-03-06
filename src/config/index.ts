// Next.js automatically loads .env files, so we don't need manual dotenv loading
// This file is safe for Edge Runtime, Node.js, and browser environments
// DO NOT add any Node.js APIs here as this file is imported by middleware

export type ConfigMap = Record<string, string>;

// Use getter functions to ensure environment variables are read at runtime
// This fixes issues with dotenv loading order in scripts
export const envConfigs = {
  get app_url() { return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'; },
  get app_name() { return process.env.NEXT_PUBLIC_APP_NAME ?? 'Command Center'; },
  get theme() { return process.env.NEXT_PUBLIC_THEME ?? 'default'; },
  get appearance() { return process.env.NEXT_PUBLIC_APPEARANCE ?? 'system'; },
  get locale() { return process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en'; },
  get database_url() { return process.env.DATABASE_URL ?? ''; },
  get database_provider() { return process.env.DATABASE_PROVIDER ?? 'postgresql'; },
  get db_singleton_enabled() { return process.env.DB_SINGLETON_ENABLED || 'false'; },
  get auth_url() { return process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || ''; },
  get auth_secret() { return process.env.AUTH_SECRET ?? ''; },
  // Creem Payment Configuration
  get creem_api_key() { return process.env.CREEM_API_KEY ?? ''; },
  get creem_environment() { return process.env.CREEM_ENVIRONMENT ?? 'sandbox'; },
  get creem_signing_secret() { return process.env.CREEM_SIGNING_SECRET ?? ''; },
  get creem_webhook_secret() { return process.env.CREEM_WEBHOOK_SECRET ?? ''; },
  get creem_webhook_url() { return process.env.CREEM_WEBHOOK_URL ?? ''; },
  get creem_product_id_base() { return process.env.CREEM_PRODUCT_ID_BASE ?? ''; },
  get creem_product_id_pro() { return process.env.CREEM_PRODUCT_ID_PRO ?? ''; },
  get creem_enabled() { return process.env.CREEM_ENABLED ?? 'true'; },
  get default_payment_provider() { return process.env.DEFAULT_PAYMENT_PROVIDER ?? 'creem'; },
  get creem_product_ids() { return process.env.CREEM_PRODUCT_IDS ?? ''; },
};
