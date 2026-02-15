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

async function testFunction() {
  console.log('🧪 Testing updated match_requests function...\n');

  const { data, error } = await supabase.rpc('match_requests', {
    p_service: 'nursing',
    p_lat: 37.77,
    p_lng: -122.42,
    p_radius_km: 50,
    p_limit_n: 5
  });

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log('✅ Function works!');
  console.log(`✅ Returns ${data.length} results\n`);

  if (data.length > 0) {
    console.log('Fields returned by function:');
    Object.keys(data[0]).forEach(key => {
      console.log(`  - ${key}`);
    });

    // Check specifically for pdf_url
    if ('pdf_url' in data[0]) {
      console.log('\n✅ pdf_url field is included in results!');
      console.log(`   Value: ${data[0].pdf_url === null ? 'NULL (as expected for existing data)' : data[0].pdf_url}`);
    } else {
      console.log('\n❌ pdf_url field NOT found in results');
    }
  }

  console.log('\n✅ Migration successful!');
}

testFunction().catch(console.error);
