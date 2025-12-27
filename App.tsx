import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { BottomNav } from './components/Layout/BottomNav';
import { RightPanel } from './components/Layout/RightPanel';
import { MasonryGrid } from './components/Feed/MasonryGrid';
import { PostCard } from './components/Feed/PostCard';
import { FullscreenViewer } from './components/Feed/FullscreenViewer';
import { EnhancedCommentsSheet } from './components/Feed/EnhancedCommentsSheet';
import { ShareModal } from './components/Feed/ShareModal';
import { EnhancedUploadModal } from './components/Upload/EnhancedUploadModal';
import { ProfilePictureUploader } from './components/Upload/ProfilePictureUploader';
import { WelcomeScreen } from './components/Auth/WelcomeScreen';
import { NeonButton } from './components/UI/NeonButton';
import { Camera, PenSquare } from 'lucide-react';
import { api, supabase } from './services/supabase';
import { UserProfile, Post, ViewState, Story, StoryComment, CreateStoryInput } from './types';
import { StoriesList } from './components/Stories/StoriesList';
import { StoryReader } from './components/Stories/StoryReader';
import { StoryEditor } from './components/Stories/StoryEditor';
import { SkeletonLoader } from './components/UI/SkeletonLoader';
import { AuthForm } from './components/Auth/AuthForm';
import { useToast } from './components/UI/ToastNotification';

// Simple Hero Component for Home View
const HeroSection = () => (
  <div className="relative rounded-3xl overflow-hidden mb-12 p-8 md:p-16 text-center md:text-left min-h-[300px] flex items-center">
    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/80 via-purple-900/80 to-slate-900/80 z-10"></div>
    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
    <div className="relative z-20 max-w-2xl">
      <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
        Capture the <span className="neon-text">Electric</span> Moments
      </h1>
      <p className="text-lg text-gray-200 mb-8 leading-relaxed">
        A futuristic collaborative space for you and your friends.
        Share memories in high fidelity, preserved in a digital glass vault.
      </p>
      <div className="flex gap-4 justify-center md:justify-start">
        <NeonButton>Start Exploring</NeonButton>
        <NeonButton variant="secondary">Read Manifesto</NeonButton>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('login');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  // Profile Picture Upload State (NEW - separate from existing logic)
  const [isProfilePictureOpen, setIsProfilePictureOpen] = useState(false);

  // Share Modal State (NEW - separate from existing logic)
  const [activeSharePost, setActiveSharePost] = useState<Post | null>(null);

  // Auth State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRecovery, setIsRecovery] = useState(false);
  const { showToast, ToastComponent } = useToast();

  // Stories State (NEW - separate from existing logic)
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [isStoryEditorOpen, setIsStoryEditorOpen] = useState(false);
  const [storyComments, setStoryComments] = useState<StoryComment[]>([]);
  const [isLoadingStories, setIsLoadingStories] = useState(false);
  const [isLoadingStoryComments, setIsLoadingStoryComments] = useState(false);

  // Welcome Screen State (NEW - separate from existing logic)
  const [showWelcome, setShowWelcome] = useState(true);

  // Profile Edit State
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [activeMemory, setActiveMemory] = useState<Post | null>(null);

  // 1. Check Session on Mount & Listen for Changes
  useEffect(() => {
    // If Supabase is not configured (missing keys), do not attempt to listen
    if (!supabase) {
      setAuthError("App not connected to database. Please set SUPABASE_URL and SUPABASE_KEY.");
      return;
    }

    // Check active session
    const checkSession = async () => {
      console.log('APP: checkSession start');

      // Handle Password Recovery URL
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('type') === 'recovery') {
        setIsRecovery(true);
        setView('login');
      }

      const { data: { session } } = await supabase.auth.getSession();
      console.log('APP: getSession result', !!session);

      if (session?.user) {
        console.log('APP: session found, fetching profile');
        const currentUser = await api.getCurrentUser(session.user);
        console.log('APP: currentUser fetched', currentUser);
        if (currentUser) {
          setUser(currentUser);
          setView('home');
          fetchPosts(currentUser.id);
        }
      }
    };
    checkSession();

    // Listen for auth changes (sign in, sign out)
    console.log('APP: Setting up onAuthStateChange');
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('APP: onAuthStateChange event:', event, !!session);
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('APP: SIGNED_IN detected, fetching profile');
        const currentUser = await api.getCurrentUser(session.user);
        setUser(currentUser);
        setView('home');
        if (currentUser) fetchPosts(currentUser.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setView('login');
        setPosts([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 2. Real-Time Memory Pulse
  useEffect(() => {
    if (!supabase || !user) return;

    console.log('APP: Setting up Real-Time Memory Pulse');

    const channel = supabase
      .channel('memory-pulse')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          console.log('Realtime change: posts');
          fetchPosts(user.id);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes' },
        () => {
          console.log('Realtime change: likes');
          fetchPosts(user.id);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => {
          console.log('Realtime change: comments');
          fetchPosts(user.id);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stories' },
        (payload) => {
          console.log('Realtime change: stories');
          fetchStories();

          // Update active story if it was the one changed
          if (activeStory && (payload.new as any)?.id === activeStory.id) {
            setActiveStory(payload.new as Story);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'story_likes' },
        (payload) => {
          console.log('Realtime change: story_likes');
          fetchStories();

          // Re-fetch active story comments/likes to be sure
          if (activeStory && (payload.new as any)?.story_id === activeStory.id) {
            fetchStories().then(newStories => {
              const updated = newStories?.find(s => s.id === activeStory.id);
              if (updated) setActiveStory(updated);
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'story_comments' },
        (payload) => {
          console.log('Realtime change: story_comments');
          // Update active story comments if looking at that story
          if (activeStory && (payload.new as any)?.story_id === activeStory.id) {
            fetchStoryComments(activeStory.id);
          }
          fetchStories(); // Update counts in list
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeStory?.id]);

  // Fetch stories when view changes to 'stories'
  useEffect(() => {
    if (view === 'stories') {
      fetchStories();
    }
  }, [view]);

  // Fetch comments when active story changes
  useEffect(() => {
    if (activeStory) {
      fetchStoryComments(activeStory.id);
    }
  }, [activeStory]);

  const handleAuth = async (email: string, password?: string, mode?: 'login' | 'signup') => {
    if (!email || !password) return;
    setIsLoading(true);
    setAuthError(null);
    try {
      if (mode === 'signup') {
        await api.signUp(email, password);
        showToast('Verification email sent!', 'success');
      } else {
        await api.signIn(email, password);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
      showToast(err.message || 'Auth failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await api.resetPassword(email);
      showToast('Password reset link sent!', 'success');
    } catch (err: any) {
      setAuthError(err.message);
      showToast('Failed to send reset link', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (password: string) => {
    setIsLoading(true);
    try {
      await api.updatePassword(password);
      showToast('Password updated!', 'success');
      setIsRecovery(false);
    } catch (err: any) {
      setAuthError(err.message);
      showToast('Failed to update password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'azure') => {
    try {
      await api.signInWithOAuth(provider);
      // Profile generation is handled by Supabase Triggers or on next load
      // But we can proactively try to fetch/init profile
      setTimeout(async () => {
        const profile = await api.getCurrentUser();
        if (profile) setUser(profile);
      }, 500);
    } catch (err: any) {
      showToast(`Failed to sign in with ${provider}`, 'error');
    }
  };

  const handleLogout = async () => {
    await api.signOut();
  };

  const fetchPosts = async (userIdOverride?: string) => {
    setIsLoading(true);
    try {
      // Use the override if provided, otherwise fallback to current user state
      const effectiveUserId = userIdOverride || user?.id;
      const data = await api.getPosts(effectiveUserId);
      setPosts(data);
    } catch (e) {
      console.error("Error fetching posts:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!user) return;
    try {
      await api.toggleLike(postId, user.id);
      // fetchPosts() is now handled by Real-time Memory Pulse
    } catch (e) {
      console.error("Error toggling like:", e);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this memory?")) return;

    try {
      await api.deletePost(postId);
      // Local removal for speed, Realtime will also sync
      setPosts(prev => prev.filter(p => p.id !== postId));
      showToast('Memory deleted', 'info');
    } catch (e) {
      console.error("Error deleting post:", e);
      showToast('Failed to delete memory', 'error');
    }
  };

  const handleUpload = async (file: File, caption: string) => {
    if (!user) return;

    try {
      // 1. Upload Image to Storage Bucket
      const publicUrl = await api.uploadImage(file);

      // 2. Create Post in Database
      await api.createPost(user.id, publicUrl, caption);

      // 3. Refresh Feed with current user
      await fetchPosts(user.id);

      setView('home');
      setIsUploadOpen(false); // Explicitly close modal
      showToast("Memory captured successfully! 📸✨", 'success');
    } catch (e) {
      console.error("Upload failed:", e);
      showToast("Failed to upload memory. Please try again.", 'error');
    }
  };

  // --- STORIES LOGIC (NEW) ---
  const fetchStories = async () => {
    setIsLoadingStories(true);
    try {
      const data = await api.getStories();
      setStories(data);
      return data;
    } catch (e) {
      console.error("Error fetching stories:", e);
      return [];
    } finally {
      setIsLoadingStories(false);
    }
  };

  const fetchStoryComments = async (storyId: string) => {
    setIsLoadingStoryComments(true);
    try {
      const data = await api.getStoryComments(storyId);
      setStoryComments(data);
    } catch (e) {
      console.error("Error fetching story comments:", e);
    } finally {
      setIsLoadingStoryComments(false);
    }
  };

  const handlePublishStory = async (input: CreateStoryInput, coverFile?: File) => {
    if (!user) return;
    try {
      let coverUrl = '';
      if (coverFile) {
        coverUrl = await api.uploadImage(coverFile); // Reuse uploadImage
      }
      await api.createStory(user.id, input, coverUrl);
      // fetchStories() is now handled by Real-time Memory Pulse
      setIsStoryEditorOpen(false);
      showToast("Story published successfully! 📖✨", 'success');
    } catch (e) {
      console.error("Error publishing story:", e);
      showToast("Failed to publish story.", 'error');
    }
  };

  const handleLikeStory = async () => {
    if (!user || !activeStory) return;
    try {
      await api.likeStory(activeStory.id, user.id);
      // Update local state for immediate feedback
      setStories(prev => prev.map(s =>
        s.id === activeStory.id
          ? { ...s, likes_count: s.is_liked ? s.likes_count - 1 : s.likes_count + 1, is_liked: !s.is_liked }
          : s
      ));
    } catch (e) {
      console.error("Error liking story:", e);
    }
  };

  const handleAddStoryComment = async (content: string) => {
    if (!user || !activeStory) return;
    try {
      await api.addStoryComment(activeStory.id, user.id, content);
      // fetchStoryComments and fetchStories counts are now handled by Real-time Memory Pulse
    } catch (e) {
      console.error("Error adding story comment:", e);
    }
  };

  const handleUpdateBio = async () => {
    if (!user) return;
    try {
      await api.updateProfile(user.id, { bio: editedBio });
      setUser(prev => prev ? { ...prev, bio: editedBio } : null);
      setIsEditingBio(false);
      showToast('Bio updated successfully! ✨', 'success');
    } catch (e) {
      console.error("Failed to update bio:", e);
      showToast('Failed to update bio. Please try again.', 'error');
    }
  };

  const handleUpdateUsername = async () => {
    if (!user || !editedUsername.trim()) return;
    try {
      await api.updateProfile(user.id, { username: editedUsername.trim() });
      setUser(prev => prev ? { ...prev, username: editedUsername.trim() } : null);
      setIsEditingUsername(false);
      showToast('Username updated successfully! ✨', 'success');
    } catch (e) {
      console.error("Failed to update username:", e);
      showToast('Failed to update username. Please try again.', 'error');
    }
  };

  // --- WELCOME SCREEN (NEW - shown before login) ---
  if (view === 'login' && showWelcome) {
    return (
      <WelcomeScreen
        onGetStarted={() => {
          setAuthMode('signup');
          setShowWelcome(false);
        }}
        onLogin={() => {
          setAuthMode('login');
          setShowWelcome(false);
        }}
      />
    );
  }

  // --- LOGIN VIEW ---
  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A] p-4 relative overflow-hidden">
        {ToastComponent}
        {/* Abstract Background Blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[100px]"></div>

        {isRecovery ? (
          <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl relative z-10">
            <h2 className="text-2xl font-bold text-white mb-6">Set New Password</h2>
            <div className="space-y-4">
              <input
                type="password"
                placeholder="New Password"
                className="w-full bg-[#0B0F1A]/50 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdatePassword(e.currentTarget.value);
                }}
              />
              <NeonButton fullWidth onClick={() => {
                const input = document.querySelector('input[type="password"]') as HTMLInputElement;
                handleUpdatePassword(input.value);
              }} isLoading={isLoading}>
                Update Password
              </NeonButton>
            </div>
          </div>
        ) : (
          <AuthForm
            initialMode={authMode}
            onAuth={handleAuth}
            onResetPassword={handleResetPassword}
            onSocialLogin={handleSocialLogin}
            isLoading={isLoading}
            error={authError}
          />
        )}
      </div>
    );
  }

  // --- MAIN APP LAYOUT ---
  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <Sidebar
        currentView={view}
        onChangeView={(v) => {
          if (v === 'upload') setIsUploadOpen(true);
          else setView(v);
        }}
        onLogout={handleLogout}
      />

      <BottomNav
        currentView={view}
        onChangeView={(v) => {
          if (v === 'upload') setIsUploadOpen(true);
          else setView(v);
        }}
      />

      <main className="lg:pl-64 xl:pr-80 min-h-screen relative">
        <div className="max-w-7xl mx-auto p-4 lg:p-8 pb-32 lg:pb-8">

          {/* Header for Mobile */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <h1 className="text-xl font-bold text-white">MemoryBook</h1>
            <img src={user?.avatar_url} className="w-8 h-8 rounded-full border border-white/20" alt="Profile" />
          </div>

          {view === 'home' && (
            <>
              <HeroSection />
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">Latest Memories</h2>
                <div className="flex gap-2">
                  <select title="Filter memories" className="bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 p-2 focus:outline-none">
                    <option>All Friends</option>
                    <option>Close Friends</option>
                  </select>
                </div>
              </div>
              {isLoading ? (
                <SkeletonLoader count={6} />
              ) : (
                <MasonryGrid
                  posts={posts}
                  isLoading={isLoading}
                  onLike={handleToggleLike}
                  onComment={(id) => setActiveCommentPostId(id)}
                  onShare={(post) => setActiveSharePost(post)}
                  onView={(post) => setActiveMemory(post)}
                  onDelete={handleDeletePost}
                  currentUserId={user?.id}
                />
              )}
              {!isLoading && (
                <div className="mt-12 text-center">
                  <NeonButton variant="secondary" onClick={fetchPosts}>Refresh Memories</NeonButton>
                </div>
              )}
            </>
          )}

          {view === 'explore' && (
            <div className="text-center py-20">
              <h2 className="text-3xl font-bold text-white mb-4">Explore the Vault</h2>
              <p className="text-gray-400">Discover public memories from around the world.</p>
              {/* Reusing Masonry for demo */}
              <div className="mt-8">
                {isLoading ? (
                  <SkeletonLoader count={6} />
                ) : (
                  <MasonryGrid
                    posts={posts.slice().reverse()}
                    isLoading={isLoading}
                    onLike={handleToggleLike}
                    onComment={(id) => setActiveCommentPostId(id)}
                    onShare={(post) => setActiveSharePost(post)}
                    onView={(post) => setActiveMemory(post)}
                    onDelete={handleDeletePost}
                    currentUserId={user?.id}
                  />
                )}
              </div>
            </div>
          )}

          {view === 'stories' && (
            <StoriesList
              stories={stories}
              isLoading={isLoadingStories}
              user={user}
              onStoryClick={(story) => {
                // Fetch full story with like status
                api.getStory(story.id, user?.id).then(fullStory => {
                  if (fullStory) setActiveStory(fullStory);
                });
              }}
              onCreateStory={() => setIsStoryEditorOpen(true)}
            />
          )}

          {view === 'profile' && (
            <div className="flex flex-col items-center pt-10">
              {/* Profile Picture - Click to Edit (NEW) */}
              <div
                className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-purple-500 to-cyan-500 mb-6 cursor-pointer relative group profile-picture-ring transition-all duration-300"
                onClick={() => setIsProfilePictureOpen(true)}
                title="Click to change profile picture"
              >
                <img src={user?.avatar_url} className="w-full h-full rounded-full object-cover border-4 border-[#0B0F1A]" alt="Profile" />
                {/* Camera overlay on hover */}
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={24} />
                </div>
              </div>
              {isEditingUsername ? (
                <div className="flex gap-2 mb-4 items-center">
                  <input
                    type="text"
                    value={editedUsername}
                    onChange={(e) => setEditedUsername(e.target.value)}
                    className="bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Enter new username"
                  />
                  <NeonButton variant="primary" onClick={handleUpdateUsername}>Save</NeonButton>
                  <button onClick={() => setIsEditingUsername(false)} className="text-gray-400 hover:text-white px-2">Cancel</button>
                </div>
              ) : (
                <div className="group relative">
                  <h1 className="text-3xl font-bold text-white mb-2">{user?.username}</h1>
                  <button
                    onClick={() => {
                      setEditedUsername(user?.username || '');
                      setIsEditingUsername(true);
                    }}
                    className="absolute -right-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity text-purple-400 hover:text-purple-300"
                    title="Edit Username"
                  >
                    <PenSquare size={16} />
                  </button>
                </div>
              )}

              {isEditingBio ? (
                <div className="w-full max-w-md mb-8">
                  <textarea
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none mb-4"
                    placeholder="Tell us your story..."
                    rows={3}
                  />
                  <div className="flex gap-2 justify-center">
                    <NeonButton variant="primary" onClick={handleUpdateBio}>Save Bio</NeonButton>
                    <NeonButton variant="secondary" onClick={() => setIsEditingBio(false)}>Cancel</NeonButton>
                  </div>
                </div>
              ) : (
                <div className="group relative">
                  <p className="text-gray-400 mb-8 max-w-md text-center">{user?.bio || "No bio yet. Tap to add one."}</p>
                  <button
                    onClick={() => {
                      setEditedBio(user?.bio || '');
                      setIsEditingBio(true);
                    }}
                    className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-purple-400 hover:text-purple-300"
                    title="Edit Bio"
                  >
                    <PenSquare size={16} />
                  </button>
                </div>
              )}

              <div className="flex gap-8 mb-12 border-b border-white/10 pb-8">
                <div className="text-center"><span className="block text-2xl font-bold text-white">{user?.stats.posts}</span><span className="text-xs text-gray-500 uppercase">Posts</span></div>
                <div className="text-center"><span className="block text-2xl font-bold text-white">{user?.stats.likes}</span><span className="text-xs text-gray-500 uppercase">Likes</span></div>
                <div className="text-center"><span className="block text-2xl font-bold text-white">{user?.stats.friends}</span><span className="text-xs text-gray-500 uppercase">Friends</span></div>
              </div>

              <div className="w-full">
                <h3 className="text-xl font-bold text-white mb-6">Your Gallery</h3>
                <MasonryGrid
                  posts={posts.filter(p => p.user_id === user?.id)}
                  isLoading={false}
                  onLike={handleToggleLike}
                  onComment={(id) => setActiveCommentPostId(id)}
                  onView={(post) => setActiveMemory(post)}
                  onDelete={handleDeletePost}
                  currentUserId={user?.id}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      <RightPanel user={user} />

      {isUploadOpen && (
        <EnhancedUploadModal
          onClose={() => setIsUploadOpen(false)}
          onUpload={handleUpload}
        />
      )}

      {/* Profile Picture Uploader (NEW - separate component) */}
      <ProfilePictureUploader
        isOpen={isProfilePictureOpen}
        onClose={() => setIsProfilePictureOpen(false)}
        currentAvatarUrl={user?.avatar_url}
        onSave={async (file) => {
          if (!user) return;
          try {
            const newAvatarUrl = await api.uploadProfilePicture(file, user.id);
            setUser(prev => prev ? { ...prev, avatar_url: newAvatarUrl } : null);
          } catch (error) {
            console.error('Failed to upload profile picture:', error);
          }
        }}
      />

      {activeCommentPostId && (
        <EnhancedCommentsSheet
          postId={activeCommentPostId}
          user={user}
          onClose={() => setActiveCommentPostId(null)}
          onCommentAdded={() => fetchPosts()}
        />
      )}

      {/* Share Modal (NEW - separate component) */}
      <ShareModal
        post={activeSharePost!}
        isOpen={!!activeSharePost}
        onClose={() => setActiveSharePost(null)}
      />

      {/* Fullscreen Viewer (Lightbox) */}
      {activeMemory && (
        <FullscreenViewer
          post={activeMemory}
          onClose={() => setActiveMemory(null)}
          onLike={handleToggleLike}
          onComment={(id) => {
            setActiveMemory(null);
            setActiveCommentPostId(id);
          }}
        />
      )}

      {/* Stories Components (NEW) */}
      {activeStory && (
        <StoryReader
          story={activeStory}
          user={user}
          comments={storyComments}
          isLoadingComments={isLoadingStoryComments}
          onClose={() => setActiveStory(null)}
          onLike={handleLikeStory}
          onAddComment={handleAddStoryComment}
        />
      )}

      {user && isStoryEditorOpen && (
        <StoryEditor
          user={user}
          isOpen={isStoryEditorOpen}
          onClose={() => setIsStoryEditorOpen(false)}
          onPublish={handlePublishStory}
        />
      )}
    </div>
  );
};

export default App;