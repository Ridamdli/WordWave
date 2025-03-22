import { createClient } from '@supabase/supabase-js';
import envConfig from '../config/environment';
import { logger } from './logger';

// Extract Supabase configuration from central config
const { url: supabaseUrl, anonKey: supabaseAnonKey } = envConfig.supabase;

// Validate configuration before creating client
if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Supabase', 'initialization', 'Missing required Supabase configuration', null, {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    // Add correct headers for fetch requests
    headers: {
      'Accept': '*/*', // Accept any content type
    },
  },
});

// Allow getting the Supabase client for usage in other files
export const getSupabase = () => supabase;

// Configure storage fetch options with the proper parameters that Supabase expects
export const getStorageOptions = () => ({
  download: true, // This indicates we want a download URL
  // The transform parameter could be added if needed for image resizing
});