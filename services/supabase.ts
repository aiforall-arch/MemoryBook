import { createClient } from '@supabase/supabase-js';
import { Post, UserProfile } from '../types';

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------

/**
 * HELPER: Tries to find environment variables in various environments
 * (Vite, Next.js, Standard Node, etc.)
 */
const getEnv = (key: string): string => {
  // 1. Check Vite (import.meta.env)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[`VITE_${key}`] || import.meta.env[key] || '';
  }
  
  // 2. Check standard process.env (if available)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[`REACT_APP_${key}`] || process.env[key] || '';
  }

  return '';
};

// --- PASTE KEYS HERE IF YOU CANNOT USE .ENV FILE ---
// (Not recommended for production/git, but useful for quick testing)
const MANUAL_URL = ''; 
const MANUAL_KEY = ''; 

// Determine final keys
const SUPABASE_URL = MANUAL_URL || getEnv('SUPABASE_URL') || '';
const SUPABASE_KEY = MANUAL_KEY || getEnv('SUPABASE_KEY') || '';

// --- VALIDATION & INITIALIZATION ---

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// Initialize client only if keys are present and valid
export const supabase = (isValidUrl(SUPABASE_URL) && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// --- REAL API SERVICE ---

export const api = {
  // 1. Authentication
  signUp: async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase not configured. Please set SUPABASE_URL and SUPABASE_KEY in .env or services/supabase.ts");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase not configured. Please set SUPABASE_URL and SUPABASE_KEY in .env or services/supabase.ts");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async (): Promise<UserProfile | null> => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Fetch profile details
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) return null;

    return {
      id: profile.id,
      username: profile.username || user.email?.split('@')[0] || 'User',
      avatar_url: profile.avatar_url || 'https://via.placeholder.com/150',
      bio: profile.bio || '',
      joined_at: profile.updated_at || new Date().toISOString(),
      stats: { posts: 0, likes: 0, friends: 0 } // Stats would require more complex queries
    };
  },

  // 2. Database - Posts
  getPosts: async (): Promise<Post[]> => {
    if (!supabase) return [];
    
    // Select posts and join with profiles table
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        image_url,
        caption,
        created_at,
        user_id,
        profiles (
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform Supabase response to match our App's Post interface
    return data.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      username: item.profiles?.username || 'Unknown',
      user_avatar: item.profiles?.avatar_url || '',
      image_url: item.image_url,
      caption: item.caption,
      created_at: item.created_at,
      likes_count: 0, // Implement likes table later for real count
      comments_count: 0,
      is_liked: false,
      comments: []
    }));
  },

  // 3. Storage & Creation
  uploadImage: async (file: File): Promise<string> => {
    if (!supabase) throw new Error("Supabase not configured.");
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to 'memorial_photos' bucket
    const { error: uploadError } = await supabase.storage
      .from('memorial_photos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('memorial_photos').getPublicUrl(filePath);
    return data.publicUrl;
  },

  createPost: async (userId: string, imageUrl: string, caption: string) => {
    if (!supabase) throw new Error("Supabase not configured.");
    
    const { error } = await supabase
      .from('posts')
      .insert({ user_id: userId, image_url: imageUrl, caption });

    if (error) throw error;
  }
};
