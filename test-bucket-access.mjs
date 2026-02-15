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

async function testBucketAccess() {
  console.log('🧪 Testing direct access to carebnbstoragebucket...\n');

  // Try to list files in the bucket directly
  const { data: files, error } = await supabase
    .storage
    .from('carebnbstoragebucket')
    .list();

  if (error) {
    console.log('❌ Cannot access bucket');
    console.log('Error:', error.message);
    console.log('\nThis might mean:');
    console.log('  - Bucket doesn\'t exist with this exact name');
    console.log('  - Storage policies need to be configured');
    console.log('  - Anon key needs permission');
  } else {
    console.log('✅ Bucket is accessible!');
    console.log(`✅ Found ${files.length} file(s) in bucket`);

    if (files.length > 0) {
      console.log('\nFiles in bucket:');
      files.forEach(file => {
        console.log(`  - ${file.name}`);
      });
    }

    console.log('\n🎉 Storage is ready for AI Intake!');
  }
}

testBucketAccess().catch(console.error);
