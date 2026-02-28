import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local file
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL || '';
const DATABASE_PROVIDER = process.env.DATABASE_PROVIDER || 'postgresql';

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env.local');
  process.exit(1);
}

export default defineConfig({
  out: './src/config/db/migrations',
  schema: './src/config/db/schema.ts',
  dialect: DATABASE_PROVIDER as
    | 'sqlite'
    | 'postgresql'
    | 'mysql'
    | 'turso'
    | 'singlestore'
    | 'gel',
  dbCredentials: {
    url: DATABASE_URL,
  },
});
