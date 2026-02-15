/**
 * Run database migration
 * Usage: node scripts/run-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  console.log('Running migration: Add audio_url and transcript to care_requests...\n');

  try {
    // Check if columns already exist by trying to select them
    const { error: testError } = await supabase
      .from('care_requests')
      .select('audio_url, transcript, intake_type')
      .limit(1);

    if (!testError) {
      console.log('✓ Columns already exist - migration already applied');
      return;
    }

    console.log('Columns do not exist yet. You need to run this SQL in Supabase SQL Editor:');
    console.log('\n--- SQL Migration ---');
    console.log(`
ALTER TABLE care_requests
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS transcript TEXT,
ADD COLUMN IF NOT EXISTS intake_type TEXT;

COMMENT ON COLUMN care_requests.audio_url IS 'URL to audio file in Supabase storage if patient submitted audio intake';
COMMENT ON COLUMN care_requests.transcript IS 'Whisper transcript if audio was submitted, or original text if text was submitted';
COMMENT ON COLUMN care_requests.intake_type IS 'Type of intake submission: audio or text';
    `);
    console.log('--- End SQL ---\n');
    console.log('Go to: https://opuqxddmnhbgjplaflzp.supabase.co/project/_/sql');
    console.log('Paste the SQL above and click "Run"');

  } catch (error) {
    console.error('Error:', error);
  }
}

runMigration();
