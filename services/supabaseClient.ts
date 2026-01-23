
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual keys from Supabase Settings -> API
// In a production environment, these should be in a .env file
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
