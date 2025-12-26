export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string;
  bio: string;
  joined_at: string;
  stats: {
    posts: number;
    likes: number;
    friends: number;
  };
}

export interface PostComment {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  content: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  username: string;
  user_avatar: string;
  image_url: string;
  caption: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  comments?: PostComment[];
}

export type ViewState = 'home' | 'explore' | 'profile' | 'login' | 'upload' | 'stories';

// ============================================
// STORIES FEATURE (NEW - Bilingual Long-Form)
// ============================================

export interface Story {
  id: string;
  title: string;
  content: string;
  language: 'en' | 'ta';
  author_id: string;
  author_username: string;
  author_avatar: string;
  cover_image_url: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  read_count: number;
  is_liked?: boolean;
}

export interface StoryComment {
  id: string;
  story_id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  content: string;
  created_at: string;
}

export interface CreateStoryInput {
  title: string;
  content: string;
  language: 'en' | 'ta';
  cover_image_url?: string;
}
