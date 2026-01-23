
import { createClient } from '@supabase/supabase-js';

//accessing environment variables via Vite's import.meta.env
//the "!" tells TypeScript taht these values exist
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
