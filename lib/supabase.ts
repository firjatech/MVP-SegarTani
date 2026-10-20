import { createClient } from '@supabase/supabase-js';

// Ganti nilai ini jika tidak menggunakan file .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom lock function untuk mencegah error Web Lock API di browser
const dummyLock = async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
  return await fn();
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    lock: dummyLock,
  },
});
