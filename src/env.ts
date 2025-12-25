export const ENV = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_KEY: import.meta.env.VITE_SUPABASE_KEY,
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
};

if (!ENV.SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL');
} else {
  console.log('ENV: VITE_SUPABASE_URL is defined (starts with ' + ENV.SUPABASE_URL.substring(0, 8) + '...)');
}

if (!ENV.SUPABASE_KEY) {
  throw new Error('Missing VITE_SUPABASE_KEY');
} else {
  console.log('ENV: VITE_SUPABASE_KEY is defined');
}

if (!ENV.GEMINI_API_KEY) {
  throw new Error('Missing VITE_GEMINI_API_KEY');
} else {
  console.log('ENV: VITE_GEMINI_API_KEY is defined');
}