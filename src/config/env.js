// Environment configuration
// In development, these will be loaded from .env file
// In production, set these in your hosting environment

export const ENV = {
  // OpenAI - Meal analysis, nutrition plan generation
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',

  // Supabase - Database, auth, storage
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://zltkngnohnpaiowffpqc.supabase.co',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsdGtuZ25vaG5wYWlvd2ZmcHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDE0MjUsImV4cCI6MjA4NDI3NzQyNX0.pi7bIcokmSYR2Y0MJqvrMie9MHjWzRU2XpspNXfDw8Y',

  // Mixpanel - Analytics
  MIXPANEL_TOKEN: process.env.MIXPANEL_TOKEN || '',

  // Resend - Email service
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',

  // Together AI - Image generation
  TOGETHER_AI_API_KEY: process.env.TOGETHER_AI_API_KEY || '',

  // RevenueCat - Subscriptions
  REVENUECAT_API_KEY: process.env.REVENUECAT_API_KEY || '',

  // Superwall - Paywall UI
  SUPERWALL_API_KEY: process.env.SUPERWALL_API_KEY || '',
};

// Validate required environment variables
export const validateEnv = () => {
  const required = [
    'OPENAI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ];

  const missing = required.filter(key => !ENV[key]);
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
};

export default ENV;

