import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

let supabase: ReturnType<typeof createClient<Database>>;

if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
  supabase = createClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
}

export { supabase };