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

console.log('Checking care_requests table...\n');

const { data, error } = await supabase
  .from('care_requests')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(5);

if (error) {
  console.error('Error:', error);
} else {
  console.log(`Found ${data.length} care_requests:`);
  data.forEach((req, i) => {
    console.log(`\n${i + 1}. ID: ${req.id}`);
    console.log(`   Status: ${req.status}`);
    console.log(`   Service: ${req.service}`);
    console.log(`   PDF URL: ${req.pdf_url || '(none)'}`);
    console.log(`   Created: ${req.created_at}`);
  });
}
