import { createClient } from '@supabase/supabase-js';
import { Post, UserProfile, PostComment, Story, StoryComment, CreateStoryInput } from '../types';
import { ENV } from '../src/env';

// ------------------------------------------------------------------
// SUPABASE CLIENT (PRODUCTION SAFE)
// ------------------------------------------------------------------

export const supabase = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_KEY
);

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------

const withTimeout = <T>(promise: Promise<T> | { then: any }, timeoutMs: number = 5000): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise) as Promise<T>,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Query timed out after ' + timeoutMs + 'ms')), timeoutMs)
    )
  ]);
};

// ------------------------------------------------------------------
// REAL API SERVICE
// ------------------------------------------------------------------

export const api = {
  // 1. Authentication
  signUp: async (email: string, password: string) => {
    console.log('SUPABASE: signUp attempt for', email);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error('SUPABASE: signUp error', error);
      throw error;
    }
    console.log('SUPABASE: signUp success', data);
    return data;
  },

  signIn: async (email: string, password: string) => {
    console.log('SUPABASE: signIn attempt for', email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('SUPABASE: signIn error', error);
      throw error;
    }
    console.log('SUPABASE: signIn success', data);
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async (existingUser?: any): Promise<UserProfile | null> => {
    console.log('SUPABASE: getCurrentUser start', { hasExistingUser: !!existingUser });
    console.log('SUPABASE: client config', { url: ENV.SUPABASE_URL });

    try {
      let user = existingUser;
      if (!user) {
        console.log('SUPABASE: calling auth.getUser()...');
        const { data: { user: fetchedUser }, error: authError } = await supabase.auth.getUser();
        console.log('SUPABASE: auth.getUser() returned', { user: fetchedUser?.id, error: authError });

        if (authError) {
          console.error('SUPABASE: getUser error', authError);
          return null;
        }
        user = fetchedUser;
      }

      if (!user) {
        console.log('SUPABASE: No active user session');
        return null;
      }
      console.log('SUPABASE: 1/3 - fetching profile (with 15s timeout)...');

      // Run all queries in parallel for faster loading
      const [profileResult, postsResult, userPostsResult] = await Promise.all([
        // Profile query
        withTimeout(supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(), 15000)
          .catch((err) => {
            console.warn('SUPABASE: profile fetch error/timeout', err.message);
            return { data: null, error: err };
          }) as Promise<{ data: any; error: any }>,
        // Posts count query
        withTimeout(supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id), 15000)
          .catch((err) => {
            console.warn('SUPABASE: posts count error/timeout', err.message);
            return { count: 0, error: err };
          }) as Promise<{ count: number | null; error: any }>,
        // User posts IDs query
        withTimeout(supabase.from('posts').select('id').eq('user_id', user.id), 15000)
          .catch((err) => {
            console.warn('SUPABASE: user posts error/timeout', err.message);
            return { data: [], error: err };
          }) as Promise<{ data: any[]; error: any }>
      ]);

      console.log('SUPABASE: All queries completed', {
        hasProfile: !!profileResult.data,
        postsCount: postsResult.count,
        userPostsCount: userPostsResult.data?.length
      });

      const profile = profileResult.data;
      const postsCount = postsResult.count;
      const userPosts = userPostsResult.data;

      // Fetch total likes received on all user's posts
      let totalLikes = 0;
      if (userPosts && userPosts.length > 0) {
        console.log('SUPABASE: fetching total likes for posts...');
        const postIds = userPosts.map(p => p.id);
        const { count: likesCount, error: likesError } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .in('post_id', postIds);
        console.log('SUPABASE: likes result', { count: likesCount, error: likesError });
        totalLikes = likesCount || 0;
      }

      return {
        id: user.id,
        username: profile?.username || user.email?.split('@')[0] || 'User',
        avatar_url: profile?.avatar_url || `https://ui-avatars.com/api/?name=${user.email?.split('@')[0] || 'User'}&background=random`,
        bio: profile?.bio || '',
        joined_at: profile?.updated_at || user.created_at || new Date().toISOString(),
        stats: {
          posts: postsCount || 0,
          likes: totalLikes,
          friends: 0
        }
      };
    } catch (e) {
      console.error('SUPABASE: getCurrentUser unexpected error', e);
      return null;
    }
  },

  // 1.5 Database - Comments
  getComments: async (postId: string): Promise<PostComment[]> => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('SUPABASE: getComments error', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Fetch profiles for commenters
    const userIds = Array.from(new Set(data.map((c: any) => c.user_id)));
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    const profileMap = (profilesData || []).reduce((acc: any, p: any) => {
      acc[p.id] = p;
      return acc;
    }, {});

    return data.map((c: any) => {
      const profile = profileMap[c.user_id];
      return {
        id: c.id,
        user_id: c.user_id,
        username: profile?.username || 'User',
        avatar_url: profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username || 'User'}&background=random`,
        content: c.content,
        created_at: c.created_at
      };
    });
  },

  addComment: async (postId: string, userId: string, content: string) => {
    const { error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: userId, content });
    if (error) throw error;
  },

  // 2. Database - Posts
  getPosts: async (currentUserId?: string): Promise<Post[]> => {
    // 1. Fetch posts and likes count
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        image_url,
        caption,
        created_at,
        user_id,
        likes!left (
          user_id
        )
      `)
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('SUPABASE: getPosts error', postsError);
      throw postsError;
    }

    if (!postsData || postsData.length === 0) return [];

    // 1.5 Fetch comments counts
    const { data: commentsData } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postsData.map(p => p.id));

    const commentsMap = (commentsData || []).reduce((acc: any, c: any) => {
      acc[c.post_id] = (acc[c.post_id] || 0) + 1;
      return acc;
    }, {});

    // 2. Fetch profiles for these posts separately to avoid join errors
    const userIds = Array.from(new Set(postsData.map(p => p.user_id)));
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    const profileMap = (profilesData || []).reduce((acc: any, p: any) => {
      acc[p.id] = p;
      return acc;
    }, {});

    return postsData.map((item: any) => {
      const profile = profileMap[item.user_id];
      return {
        id: item.id,
        user_id: item.user_id,
        username: profile?.username || 'User',
        user_avatar: profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username || 'User'}&background=random`,
        image_url: item.image_url,
        caption: item.caption,
        created_at: item.created_at,
        likes_count: item.likes?.length || 0,
        comments_count: commentsMap[item.id] || 0,
        is_liked: currentUserId ? item.likes?.some((l: any) => l.user_id === currentUserId) : false,
        comments: []
      };
    });
  },

  // 3. Likes
  toggleLike: async (postId: string, userId: string) => {
    // Check if liked - use maybeSingle() to avoid 406 error
    const { data: existingLike, error: checkError } = await supabase
      .from('likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('SUPABASE: toggleLike check error', checkError);
      throw checkError;
    }

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      // Like
      const { error } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: userId });
      if (error) throw error;
    }
  },

  // 4. Storage
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
  },

  // 5. Profile Picture Upload (NEW - separate from existing logic)
  uploadProfilePicture: async (file: File, userId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `avatars/${userId}_${Date.now()}.${fileExt}`;

    // Upload to storage bucket
    const { error: uploadError } = await supabase.storage
      .from('memorial_photos')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabase.storage
      .from('memorial_photos')
      .getPublicUrl(fileName);

    const publicUrl = data.publicUrl;

    // Update profile with new avatar URL - use update to preserve existing fields
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    return publicUrl;
  },

  // 6. Database - Stories (NEW - separate from existing logic)
  getStories: async (language?: 'en' | 'ta'): Promise<Story[]> => {
    let query = supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false });

    if (language) {
      query = query.eq('language', language);
    }

    const { data, error } = await query;

    if (error) {
      console.error('SUPABASE: getStories error', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Fetch profiles separately
    const userIds = Array.from(new Set(data.map((s: any) => s.author_id)));
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    const profileMap = (profilesData || []).reduce((acc: any, p: any) => {
      acc[p.id] = p;
      return acc;
    }, {});

    return data.map((item: any) => {
      const profile = profileMap[item.author_id];
      return {
        id: item.id,
        title: item.title,
        content: item.content,
        language: item.language,
        author_id: item.author_id,
        author_username: profile?.username || 'User',
        author_avatar: profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username || 'User'}&background=random`,
        cover_image_url: item.cover_image_url,
        created_at: item.created_at,
        likes_count: item.likes_count || 0,
        comments_count: item.comments_count || 0,
        read_count: item.read_count || 0,
      };
    });
  },

  getStory: async (storyId: string, userId?: string): Promise<Story | null> => {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .maybeSingle();

    if (error || !data) {
      console.error('SUPABASE: getStory error', error);
      return null;
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', data.author_id)
      .maybeSingle();

    // Check if liked
    let isLiked = false;
    if (userId) {
      const { data: likeData } = await supabase
        .from('story_likes')
        .select('*')
        .eq('story_id', storyId)
        .eq('user_id', userId)
        .maybeSingle();
      isLiked = !!likeData;
    }

    // Increment read count (non-intrusive)
    supabase.rpc('increment_story_read_count', { story_id: storyId }).then(() => { });

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      language: data.language,
      author_id: data.author_id,
      author_username: profile?.username || 'User',
      author_avatar: profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username || 'User'}&background=random`,
      cover_image_url: data.cover_image_url,
      created_at: data.created_at,
      likes_count: data.likes_count || 0,
      comments_count: data.comments_count || 0,
      read_count: data.read_count || 0,
      is_liked: isLiked
    };
  },

  createStory: async (userId: string, input: any, coverImageUrl?: string) => {
    const { error } = await supabase
      .from('stories')
      .insert({
        author_id: userId,
        title: input.title,
        content: input.content,
        language: input.language,
        cover_image_url: coverImageUrl
      });

    if (error) throw error;
  },

  likeStory: async (storyId: string, userId: string) => {
    const { data: existingLike } = await supabase
      .from('story_likes')
      .select('*')
      .eq('story_id', storyId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingLike) {
      const { error } = await supabase
        .from('story_likes')
        .delete()
        .eq('story_id', storyId)
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('story_likes')
        .insert({ story_id: storyId, user_id: userId });
      if (error) throw error;
    }
  },

  getStoryComments: async (storyId: string): Promise<StoryComment[]> => {
    const { data, error } = await supabase
      .from('story_comments')
      .select('*')
      .eq('story_id', storyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('SUPABASE: getStoryComments error', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Fetch profiles separately
    const userIds = Array.from(new Set(data.map((c: any) => c.user_id)));
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    const profileMap = (profilesData || []).reduce((acc: any, p: any) => {
      acc[p.id] = p;
      return acc;
    }, {});

    return data.map((item: any) => {
      const profile = profileMap[item.user_id];
      return {
        id: item.id,
        story_id: item.story_id,
        user_id: item.user_id,
        username: profile?.username || 'User',
        avatar_url: profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username || 'User'}&background=random`,
        content: item.content,
        created_at: item.created_at
      };
    });
  },

  addStoryComment: async (storyId: string, userId: string, content: string) => {
    const { error } = await supabase
      .from('story_comments')
      .insert({ story_id: storyId, user_id: userId, content });
    if (error) throw error;
  }
};
