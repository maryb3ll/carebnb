import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables
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

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDatabase() {
  console.log('🔍 Inspecting Supabase Database (Read-Only)\n');
  console.log('=' .repeat(60));

  // Check care_requests table
  console.log('\n📋 CARE_REQUESTS TABLE');
  console.log('-'.repeat(60));

  try {
    const { data: requests, error } = await supabase
      .from('care_requests')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      if (requests && requests.length > 0) {
        console.log('✅ Table accessible');
        console.log('\nColumns found:');
        Object.keys(requests[0]).forEach(col => {
          console.log(`  - ${col}`);
        });

        // Check specifically for pdf_url
        if ('pdf_url' in requests[0]) {
          console.log('\n✅ pdf_url column EXISTS');
        } else {
          console.log('\n⚠️  pdf_url column DOES NOT EXIST');
          console.log('    Migration needed to add this column');
        }
      } else {
        console.log('ℹ️  Table exists but is empty');
      }

      // Get count
      const { count } = await supabase
        .from('care_requests')
        .select('*', { count: 'exact', head: true });
      console.log(`\nTotal records: ${count || 0}`);
    }
  } catch (err) {
    console.log('❌ Error inspecting care_requests:', err.message);
  }

  // Check providers table
  console.log('\n\n👥 PROVIDERS TABLE');
  console.log('-'.repeat(60));

  try {
    const { data: providers, error } = await supabase
      .from('providers')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Table accessible');
      const { count } = await supabase
        .from('providers')
        .select('*', { count: 'exact', head: true });
      console.log(`Total records: ${count || 0}`);
    }
  } catch (err) {
    console.log('❌ Error inspecting providers:', err.message);
  }

  // Check patients table
  console.log('\n\n🏥 PATIENTS TABLE');
  console.log('-'.repeat(60));

  try {
    const { data: patients, error } = await supabase
      .from('patients')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Table accessible');
      const { count } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });
      console.log(`Total records: ${count || 0}`);
    }
  } catch (err) {
    console.log('❌ Error inspecting patients:', err.message);
  }

  // Check bookings table
  console.log('\n\n📅 BOOKINGS TABLE');
  console.log('-'.repeat(60));

  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Table accessible');
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });
      console.log(`Total records: ${count || 0}`);
    }
  } catch (err) {
    console.log('❌ Error inspecting bookings:', err.message);
  }

  // Check storage buckets
  console.log('\n\n📦 STORAGE BUCKETS');
  console.log('-'.repeat(60));

  try {
    const { data: buckets, error } = await supabase
      .storage
      .listBuckets();

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Storage accessible');
      console.log('\nBuckets:');
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });

      // Check if our bucket exists
      const ourBucket = buckets.find(b => b.name === 'carebnbstoragebucket');
      if (ourBucket) {
        console.log('\n✅ carebnbstoragebucket EXISTS');

        // List files in bucket
        const { data: files } = await supabase
          .storage
          .from('carebnbstoragebucket')
          .list();

        console.log(`   Files in bucket: ${files ? files.length : 0}`);
      } else {
        console.log('\n⚠️  carebnbstoragebucket DOES NOT EXIST');
      }
    }
  } catch (err) {
    console.log('❌ Error inspecting storage:', err.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Database inspection complete (no changes made)\n');
}

inspectDatabase().catch(console.error);
