import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
  },
});

// Startup connectivity check
(async () => {
  try {
    const { data, error } = await supabase.from('users').select('id', { count: 'exact', head: true });
    if (error) {
      console.error('⚠️  Supabase connectivity check FAILED:', error.message);
    } else {
      console.log('✅ Supabase connected successfully');
    }
  } catch (e: any) {
    console.error('⚠️  Supabase connectivity check FAILED:', e.message);
  }
})();

