import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IS_DEMO } from './config';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!IS_DEMO && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables');
}

// Demo mode never touches Supabase, so it can run without credentials.
export const supabase: SupabaseClient = IS_DEMO
  ? (null as unknown as SupabaseClient)
  : createClient(supabaseUrl, supabaseAnonKey);
