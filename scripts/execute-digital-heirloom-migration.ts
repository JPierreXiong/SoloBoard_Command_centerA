/**
 * Execute Digital Heirloom Database Migration
 * 
 * This script executes the SQL migration for Digital Heirloom tables
 * 
 * Usage:
 *   npx tsx scripts/execute-digital-heirloom-migration.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import postgres from 'postgres';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env.development') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { envConfigs } from '@/config';

async function executeMigration() {
  console.log('🚀 Starting Digital Heirloom Database Migration...\n');

  try {
    // 1. Check database connection
    console.log('1️⃣ Checking database connection...');
    const databaseUrl = process.env.DATABASE_URL || envConfigs.database_url;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set in environment variables');
    }

    console.log(`   ✓ Database URL: ${databaseUrl.substring(0, 50)}...`);
    console.log('   ✅ Database connection configured\n');

    // 2. Read migration SQL file
    console.log('2️⃣ Reading migration SQL file...');
    const sqlPath = resolve(process.cwd(), 'scripts/migrate-digital-heirloom.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');
    console.log('   ✅ Migration SQL file loaded\n');

    // 3. Execute migration
    console.log('3️⃣ Executing migration...');
    const sql = postgres(databaseUrl, { max: 1 });

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await sql.unsafe(statement);
          console.log(`   ✓ Executed: ${statement.substring(0, 50)}...`);
        } catch (error: any) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`   ⚠️  Skipped (already exists): ${statement.substring(0, 50)}...`);
          } else {
            throw error;
          }
        }
      }
    }

    await sql.end();
    console.log('   ✅ Migration executed successfully\n');

    // 4. Verify tables
    console.log('4️⃣ Verifying tables...');
    const verifySql = postgres(databaseUrl, { max: 1 });
    
    const tables = ['digital_vaults', 'beneficiaries', 'heartbeat_logs', 'dead_man_switch_events'];
    for (const table of tables) {
      const result = await verifySql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        );
      `;
      if (result[0].exists) {
        console.log(`   ✅ Table '${table}' exists`);
      } else {
        console.log(`   ❌ Table '${table}' not found`);
      }
    }

    await verifySql.end();
    console.log('   ✅ Table verification completed\n');

    console.log('✅ Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run test script: npx tsx scripts/test-digital-heirloom.ts');
    console.log('   2. Start development server: pnpm dev');
  } catch (error: any) {
    console.error('\n❌ Migration failed!');
    console.error(`Error: ${error.message}`);
    if (error.cause) {
      console.error(`Cause: ${error.cause.message || error.cause}`);
    }
    process.exit(1);
  }
}

// Run the migration
executeMigration()
  .then(() => {
    console.log('\n✨ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed with error:', error);
    process.exit(1);
  });




