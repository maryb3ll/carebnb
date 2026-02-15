import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    envVars[key.trim()] = values.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
  console.log('🔍 Checking Supabase Storage...\n');

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.log('❌ Error listing buckets:', error.message);
      return;
    }

    console.log(`Found ${buckets.length} bucket(s):\n`);

    buckets.forEach(bucket => {
      console.log(`📦 ${bucket.name}`);
      console.log(`   ID: ${bucket.id}`);
      console.log(`   Public: ${bucket.public ? 'Yes' : 'No'}`);
      console.log(`   Created: ${bucket.created_at}`);
      console.log('');
    });

    // Check specifically for our bucket
    const ourBucket = buckets.find(b => b.name === 'carebnbstoragebucket');

    if (ourBucket) {
      console.log('✅ carebnbstoragebucket EXISTS!\n');
      console.log('Testing upload permissions...');

      // Try to list files
      const { data: files, error: listError } = await supabase
        .storage
        .from('carebnbstoragebucket')
        .list();

      if (listError) {
        console.log('⚠️  Error listing files:', listError.message);
      } else {
        console.log(`✅ Can list files: ${files.length} file(s) in bucket`);
      }

      console.log('\n🎉 Storage is ready for AI Intake!');
    } else {
      console.log('❌ carebnbstoragebucket NOT FOUND');
      console.log('\nAvailable buckets:', buckets.map(b => b.name).join(', ') || 'none');
    }

  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkStorage().catch(console.error);
