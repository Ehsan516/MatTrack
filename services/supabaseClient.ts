
import { createClient } from '@supabase/supabase-js';

/**
 * MatTrack Supabase Configuration
 * 
 * We attempt to pull these from process.env (Standard for this environment).
 * If the .env file is not being automatically parsed into the process.env object
 * by the host, we fall back to the project's default credentials to ensure 
 * the app remains operational.
 */
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rchxjwovfjdzadeyvztj.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_qa-ahwY6bCf4ZjmUfw7qsw_fZOzJzou';

// Validate that we have a URL to prevent the 'supabaseUrl is required' error
if (!SUPABASE_URL || SUPABASE_URL === 'undefined') {
  throw new Error("MatTrack Error: SUPABASE_URL is required but was not found in environment variables or fallback.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
