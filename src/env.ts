export const ENV = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_KEY: import.meta.env.VITE_SUPABASE_KEY,
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
};

if (!ENV.SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL');
}

if (!ENV.SUPABASE_KEY) {
  throw new Error('Missing VITE_SUPABASE_KEY');
}

if (!ENV.GEMINI_API_KEY) {
  throw new Error('Missing VITE_GEMINI_API_KEY');
}