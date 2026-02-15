const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration(filePath) {
  console.log(`\nRunning migration: ${path.basename(filePath)}`);

  const sql = fs.readFileSync(filePath, 'utf-8');

  // Split by semicolon to handle multiple statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        // Try direct query if RPC doesn't exist
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ sql_query: statement })
        });

        if (!response.ok) {
          console.error(`Error executing statement: ${error?.message || response.statusText}`);
          console.log('Note: You may need to run these migrations manually in Supabase SQL Editor');
          console.log('Statement:', statement.substring(0, 100) + '...');
        } else {
          console.log('✓ Statement executed');
        }
      } else {
        console.log('✓ Statement executed');
      }
    } catch (err) {
      console.error('Error:', err.message);
    }
  }
}

async function runAllMigrations() {
  console.log('Starting Supabase migrations...\n');

  const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
  const migrations = [
    '004_add_pdf_url_to_care_requests.sql',
    '005_update_match_requests_include_pdf_url.sql'
  ];

  for (const migration of migrations) {
    const filePath = path.join(migrationsDir, migration);
    if (fs.existsSync(filePath)) {
      await runMigration(filePath);
    } else {
      console.log(`Migration file not found: ${migration}`);
    }
  }

  console.log('\n✓ Migrations complete!');
  console.log('\nIf you see errors above, please run the SQL files manually in Supabase Dashboard > SQL Editor:');
  console.log('  1. supabase/migrations/004_add_pdf_url_to_care_requests.sql');
  console.log('  2. supabase/migrations/005_update_match_requests_include_pdf_url.sql');
}

runAllMigrations().catch(console.error);
