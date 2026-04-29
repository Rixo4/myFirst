import { createClient } from '@supabase/supabase-js'

// Add fallback strings to prevent the entire React app from crashing 
// with a white screen if the .env file is empty or missing!
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
