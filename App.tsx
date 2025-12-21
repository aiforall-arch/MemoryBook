import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { RightPanel } from './components/Layout/RightPanel';
import { MasonryGrid } from './components/Feed/MasonryGrid';
import { UploadModal } from './components/Upload/UploadModal';
import { NeonButton } from './components/UI/NeonButton';
import { api, supabase } from './services/supabase'; // Import real API
import { UserProfile, Post, ViewState } from './types';

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

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // 1. Check Session on Mount & Listen for Changes
  useEffect(() => {
    // If Supabase is not configured (missing keys), do not attempt to listen
    if (!supabase) {
      setAuthError("App not connected to database. Please set SUPABASE_URL and SUPABASE_KEY.");
      return;
    }

    // Check active session
    const checkSession = async () => {
      const currentUser = await api.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setView('home');
        fetchPosts();
      }
    };
    checkSession();

    // Listen for auth changes (sign in, sign out)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
         const currentUser = await api.getCurrentUser();
         setUser(currentUser);
         setView('home');
         fetchPosts();
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

  const handleLogin = async () => {
    setIsLoading(true);
    setAuthError('');
    try {
      // Try to sign in
      await api.signIn(email, password);
    } catch (e: any) {
      console.error("Login failed", e);
      // Optional: Auto-attempt signup if login fails for demo purposes
      // In production, handle this explicitly
      try {
        await api.signUp(email, password);
        alert("Account created! Check your email to confirm, or if auto-confirm is on, sign in again.");
      } catch (signupError: any) {
        setAuthError(e.message || "Authentication failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.signOut();
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPosts();
      setPosts(data);
    } catch (e) {
      console.error("Error fetching posts:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (file: File, caption: string) => {
    if (!user) return;
    
    try {
      // 1. Upload Image to Storage Bucket
      const publicUrl = await api.uploadImage(file);
      
      // 2. Create Post in Database
      await api.createPost(user.id, publicUrl, caption);
      
      // 3. Refresh Feed
      await fetchPosts();
      
      setView('home');
    } catch (e) {
      console.error("Upload failed:", e);
      alert("Failed to upload memory. Please try again.");
    }
  };

  // --- LOGIN VIEW ---
  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A] p-4 relative overflow-hidden">
        {/* Abstract Background Blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[100px]"></div>

        <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl relative z-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] mb-6">
              <span className="text-white text-3xl font-bold">M</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400">Enter the digital vault of memories.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com" 
                className="w-full bg-[#0B0F1A]/50 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 focus:outline-none transition-colors" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-[#0B0F1A]/50 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 focus:outline-none transition-colors" 
              />
            </div>
            
            {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}

            <NeonButton fullWidth onClick={handleLogin} isLoading={isLoading}>
              Enter MemoryBook
            </NeonButton>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              New here? <span className="text-cyan-400">We'll create an account for you automatically upon login.</span>
            </p>
          </div>
        </div>
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
      
      <main className="lg:pl-64 xl:pr-80 min-h-screen relative">
        <div className="max-w-7xl mx-auto p-4 lg:p-8 pb-20">
          
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
                   <select className="bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 p-2 focus:outline-none">
                     <option>All Friends</option>
                     <option>Close Friends</option>
                   </select>
                 </div>
               </div>
               <MasonryGrid posts={posts} isLoading={isLoading} />
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
                  <MasonryGrid posts={posts.slice().reverse()} isLoading={isLoading} />
                </div>
             </div>
          )}

           {view === 'community' && (
             <div className="text-center py-20">
                <h2 className="text-3xl font-bold text-white mb-4">Community</h2>
                <p className="text-gray-400">Find friends and groups.</p>
             </div>
          )}

          {view === 'profile' && (
            <div className="flex flex-col items-center pt-10">
              <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-purple-500 to-cyan-500 mb-6">
                <img src={user?.avatar_url} className="w-full h-full rounded-full object-cover border-4 border-[#0B0F1A]" alt="Profile" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">{user?.username}</h1>
              <p className="text-gray-400 mb-8 max-w-md text-center">{user?.bio}</p>
              
              <div className="flex gap-8 mb-12 border-b border-white/10 pb-8">
                <div className="text-center"><span className="block text-2xl font-bold text-white">{user?.stats.posts}</span><span className="text-xs text-gray-500 uppercase">Posts</span></div>
                <div className="text-center"><span className="block text-2xl font-bold text-white">{user?.stats.likes}</span><span className="text-xs text-gray-500 uppercase">Likes</span></div>
                <div className="text-center"><span className="block text-2xl font-bold text-white">{user?.stats.friends}</span><span className="text-xs text-gray-500 uppercase">Friends</span></div>
              </div>
              
              <div className="w-full">
                <h3 className="text-xl font-bold text-white mb-6">Your Gallery</h3>
                <MasonryGrid posts={posts.filter(p => p.user_id === user?.id)} isLoading={false} />
              </div>
            </div>
          )}
        </div>
      </main>

      <RightPanel user={user} />

      {isUploadOpen && (
        <UploadModal 
          onClose={() => setIsUploadOpen(false)} 
          onUpload={handleUpload} 
        />
      )}
    </div>
  );
};

export default App;