import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
console.log(`URL: ${supabaseUrl}\n`);

// Note: We'll use the REST API approach for these migrations
async function runMigrations() {
  // For the first migration, we'll try to add the column using a direct approach
  console.log('📋 Migration 1: Adding pdf_url column to care_requests table...');

  try {
    // Try to select from the table to check if column exists
    const response = await fetch(`${supabaseUrl}/rest/v1/care_requests?limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }
    });

    if (response.ok) {
      console.log('✅ care_requests table accessible');

      // Check if pdf_url column exists by looking at the response
      const data = await response.json();
      if (data.length > 0 && !('pdf_url' in data[0])) {
        console.log('⚠️  pdf_url column does not exist yet');
      } else {
        console.log('ℹ️  Column may already exist or table is empty');
      }
    }
  } catch (error) {
    console.error('❌ Error checking table:', error.message);
  }

  console.log('\n📋 Since we cannot execute DDL statements directly, here are your options:\n');

  console.log('OPTION 1: Use Supabase Studio (Recommended)');
  console.log('──────────────────────────────────────────');
  console.log('Visit: https://supabase.com/dashboard/project/_/editor');
  console.log('(Replace _ with your project ref from the URL)\n');

  console.log('OPTION 2: Use Direct Database Connection');
  console.log('──────────────────────────────────────────');
  console.log('If you have your database password, run:');
  console.log('psql "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"\n');

  console.log('OPTION 3: Use Supabase CLI');
  console.log('──────────────────────────────────────────');
  console.log('Install: npm install -g supabase');
  console.log('Then run: supabase db push\n');

  console.log('📄 SQL TO RUN:');
  console.log('══════════════════════════════════════════\n');

  // Read and display the migration files
  const migration1 = readFileSync(join(__dirname, 'supabase/migrations/004_add_pdf_url_to_care_requests.sql'), 'utf-8');
  const migration2 = readFileSync(join(__dirname, 'supabase/migrations/005_update_match_requests_include_pdf_url.sql'), 'utf-8');

  console.log('-- Migration 1: Add pdf_url column');
  console.log(migration1);
  console.log('\n-- Migration 2: Update match_requests function');
  console.log(migration2);

  console.log('\n══════════════════════════════════════════\n');

  console.log('💡 Quick Access Links:');
  console.log(`   Dashboard: ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}`);
  console.log(`   SQL Editor: ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/editor\n`);
}

runMigrations().catch(console.error);
