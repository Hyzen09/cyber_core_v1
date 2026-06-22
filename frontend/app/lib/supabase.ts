import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fail early if environment variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables. Please check your .env.local file.'
    );
}

/**
 * Shared Supabase client instance for interacting with your database.
 * This can be safely used in both Client Components ('use client') 
 * and standard server utilities.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);