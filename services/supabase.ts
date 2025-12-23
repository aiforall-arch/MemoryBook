import { createClient } from '@supabase/supabase-js';
import { Post, UserProfile } from '../types';
import { ENV } from '../src/env';

// ------------------------------------------------------------------
// SUPABASE CLIENT (PRODUCTION SAFE)
// ------------------------------------------------------------------

export const supabase = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_KEY
);

// ------------------------------------------------------------------
// REAL API SERVICE
// ------------------------------------------------------------------

export const api = {
  // 1. Authentication
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async (): Promise<UserProfile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) return null;

    return {
      id: profile.id,
      username: profile.username || user.email?.split('@')[0] || 'User',
      avatar_url: profile.avatar_url || 'https://via.placeholder.com/150',
      bio: profile.bio || '',
      joined_at: profile.updated_at || new Date().toISOString(),
      stats: { posts: 0, likes: 0, friends: 0 }
    };
  },

  // 2. Database - Posts
  getPosts: async (): Promise<Post[]> => {
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

    return data.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      username: item.profiles?.username || 'Unknown',
      user_avatar: item.profiles?.avatar_url || '',
      image_url: item.image_url,
      caption: item.caption,
      created_at: item.created_at,
      likes_count: 0,
      comments_count: 0,
      is_liked: false,
      comments: []
    }));
  },

  // 3. Storage
  uploadImage: async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('memorial_photos')
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('memorial_photos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  createPost: async (userId: string, imageUrl: string, caption: string) => {
    const { error } = await supabase
      .from('posts')
      .insert({ user_id: userId, image_url: imageUrl, caption });

    if (error) throw error;
  }
};
