import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client (menggunakan @supabase/supabase-js yang sudah terinstall)
export async function createSupabaseServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
