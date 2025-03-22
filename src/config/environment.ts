/**
 * Central configuration file for environment variables
 * This provides type safety and validation for environment variables
 */

// Define the shape of our environment variables to ensure type safety
interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  app: {
    name: string;
    environment: 'development' | 'production' | 'test';
    baseUrl: string;
    version: string;
  };
}

// Get environment variables with fallbacks
const envConfig: EnvironmentConfig = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  app: {
    name: 'WordWave',
    environment: (import.meta.env.MODE as 'development' | 'production' | 'test') || 'development',
    baseUrl: import.meta.env.VITE_APP_URL || window.location.origin,
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  }
};

// Validate required environment variables
const validateConfig = (config: EnvironmentConfig): void => {
  const { supabase } = config;
  
  if (!supabase.url) {
    console.error('Missing required environment variable: VITE_SUPABASE_URL');
  }
  
  if (!supabase.anonKey) {
    console.error('Missing required environment variable: VITE_SUPABASE_ANON_KEY');
  }
};

// Perform validation in development only
if (envConfig.app.environment === 'development') {
  validateConfig(envConfig);
}

export default envConfig; 