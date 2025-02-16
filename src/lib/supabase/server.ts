import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

export const createClient = () => {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );
  return supabase;
}; 