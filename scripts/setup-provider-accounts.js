/**
 * Setup script to create Supabase auth accounts for providers
 * Run with: node scripts/setup-provider-accounts.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Same password for all providers
const DEFAULT_PASSWORD = 'Provider123!';

// Generate email from provider name - just first.last format
function generateEmail(name) {
  // Remove all titles and credentials
  let cleanName = name
    .replace(/\s+(MD|RN|LVN|CNA|NP|PA|DPT|OT|PT|DO|PhD|MPH|MS|MSc|FACOG|FAAFP|MSCP|DipABLM|FAAEM|FACEP)(\s+|$)/gi, '')
    .trim();

  // Split into parts
  const parts = cleanName.split(/\s+/);

  if (parts.length === 0) return 'provider@carebnb.demo';

  // Get first name (first part)
  const firstName = parts[0].toLowerCase();

  // Get last name (last part, or first part if only one name)
  const lastName = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : firstName;

  // Clean up any special characters but keep hyphens
  const cleanFirst = firstName.replace(/[^a-z-]/g, '');
  const cleanLast = lastName.replace(/[^a-z-]/g, '');

  return `${cleanFirst}.${cleanLast}@carebnb.demo`;
}

// Sleep function to avoid rate limits
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setupProviderAccounts() {
  console.log('Setting up provider accounts for ALL providers...\n');

  // Get ALL providers from the database
  const { data: providers, error: fetchError } = await supabase
    .from('providers')
    .select('id, name, user_id')
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error('Error fetching providers:', fetchError);
    return;
  }

  if (!providers || providers.length === 0) {
    console.error('No providers found in database');
    return;
  }

  console.log(`Found ${providers.length} providers to set up\n`);

  const createdAccounts = [];

  // Create auth accounts and link them
  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];

    // Skip if already has user_id
    if (provider.user_id) {
      console.log(`\n[${i + 1}/${providers.length}] ${provider.name} - Already has account, skipping`);
      continue;
    }

    const email = generateEmail(provider.name);

    console.log(`\n[${i + 1}/${providers.length}] Setting up ${provider.name}`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${DEFAULT_PASSWORD}`);

    // Add delay to avoid rate limits (1 second between each request)
    if (i > 0) {
      await sleep(1000);
    }

    // Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: DEFAULT_PASSWORD,
      options: {
        data: {
          name: provider.name,
          role: 'provider',
        },
      },
    });

    if (signUpError) {
      console.error(`  ❌ Error creating auth account: ${signUpError.message}`);
      continue;
    }

    if (!authData.user) {
      console.error('  ❌ No user returned from signup');
      continue;
    }

    console.log(`  ✓ Auth account created (user_id: ${authData.user.id})`);

    // Update the provider record with the user_id
    const { error: updateError } = await supabase
      .from('providers')
      .update({ user_id: authData.user.id })
      .eq('id', provider.id);

    if (updateError) {
      console.error(`  ❌ Error linking provider: ${updateError.message}`);
    } else {
      console.log(`  ✓ Provider linked to auth account`);
      createdAccounts.push({ name: provider.name, email });
    }
  }

  console.log('\n✅ Setup complete!\n');
  console.log(`Created ${createdAccounts.length} provider accounts.`);
  console.log(`All accounts use password: ${DEFAULT_PASSWORD}\n`);
  console.log('Provider logins:');
  createdAccounts.forEach(account => {
    console.log(`  ${account.name}: ${account.email}`);
  });
  console.log('');
}

setupProviderAccounts().catch(console.error);
