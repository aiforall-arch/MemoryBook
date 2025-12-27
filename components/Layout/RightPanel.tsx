import React, { useState, useEffect } from 'react';
import { GlassCard } from '../UI/GlassCard';
import { UserProfile } from '../../types';
import { TrendingUp, Activity, Users, Plus, Check } from 'lucide-react';
import { api } from '../../services/supabase';
import { useToast } from '../UI/ToastNotification';

interface RightPanelProps {
  user: UserProfile | null;
}

interface ActivityItem {
  id: string;
  username: string;
  avatar_url?: string;
  type: 'like' | 'comment';
  target_post_caption: string;
  created_at: string;
}

interface SuggestedUser {
  id: string;
  username: string;
  avatar_url: string;
}

export const RightPanel: React.FC<RightPanelProps> = ({ user }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const { showToast } = useToast();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [activityData, suggestionData] = await Promise.all([
          api.getRecentActivity(user.id),
          api.getSuggestedUsers(user.id)
        ]);
        setActivities(activityData);
        setSuggestions(suggestionData);
      } catch (error) {
        console.error('Failed to fetch sidebar data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleFollow = async (targetUserId: string, targetUsername: string) => {
    if (!user) return;

    try {
      const isFollowing = await api.toggleFollow(user.id, targetUserId);
      setFollowingIds(prev => {
        const next = new Set(prev);
        if (isFollowing) next.add(targetUserId);
        else next.delete(targetUserId);
        return next;
      });
      showToast(isFollowing ? `You followed ${targetUsername}` : `Unfollowed ${targetUsername}`, 'success');
    } catch (error) {
      console.error('Follow failed:', error);
      showToast('Action failed. Make sure you ran the SQL setup!', 'error');
    }
  };

  if (!user) return null;

  return (
    <div className="hidden xl:block fixed right-0 top-0 h-full w-80 p-8 z-30 overflow-y-auto">
      {/* Profile Summary */}
      <GlassCard className="mb-8 flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full blur opacity-50"></div>
          <img
            src={user.avatar_url}
            alt={user.username}
            className="relative w-20 h-20 rounded-full border-2 border-white/20 object-cover"
          />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">@{user.username}</h2>
        <p className="text-sm text-gray-400 mb-6 line-clamp-2">{user.bio || 'Capturing memories in the vault.'}</p>

        <div className="grid grid-cols-3 gap-4 w-full border-t border-white/10 pt-4">
          <div>
            <div className="text-xl font-bold text-white">{user.stats.posts}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Posts</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white">{user.stats.likes}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Likes</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white">{user.stats.friends}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Friends</div>
          </div>
        </div>
      </GlassCard>

      {/* Recent Activity */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Activity size={14} className="text-purple-500" /> Recent Activity
        </h3>
        <div className="space-y-4">
          {isLoading ? (
            [1, 2].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 bg-white/5 rounded" />
                  <div className="h-2 w-1/4 bg-white/5 rounded" />
                </div>
              </div>
            ))
          ) : activities.length === 0 ? (
            <p className="text-xs text-gray-500 italic pl-6 capitalize">No recent activity yet.</p>
          ) : (
            activities.map((act) => (
              <div key={act.id} className="flex gap-3 group">
                <img
                  src={act.avatar_url || `https://ui-avatars.com/api/?name=${act.username}&background=random`}
                  className="w-8 h-8 rounded-full border border-white/10"
                  alt={act.username}
                />
                <div>
                  <p className="text-[13px] text-gray-300 leading-tight">
                    <span className="text-white font-medium">@{act.username}</span> {act.type === 'like' ? 'liked' : 'commented on'} your photo "{act.target_post_caption.substring(0, 15)}..."
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">
                    {new Date(act.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Suggested Friends */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Users size={14} className="text-cyan-500" /> Discover People
        </h3>
        <div className="space-y-4">
          {isLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5" />
                  <div className="h-3 w-20 bg-white/5 rounded" />
                </div>
                <div className="w-12 h-6 bg-white/5 rounded-full" />
              </div>
            ))
          ) : suggestions.length === 0 ? (
            <p className="text-xs text-gray-500 italic pl-6 capitalize">No new suggestions.</p>
          ) : (
            suggestions.map((person) => {
              const isFollowing = followingIds.has(person.id);
              return (
                <div key={person.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <img src={person.avatar_url || `https://ui-avatars.com/api/?name=${person.username}&background=random`} className="w-8 h-8 rounded-full border border-white/10" alt={person.username} />
                    <span className="text-[13px] text-gray-300 font-medium group-hover:text-white transition-colors">@{person.username}</span>
                  </div>
                  <button
                    onClick={() => handleFollow(person.id, person.username)}
                    className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full transition-all ${isFollowing
                        ? 'bg-white/5 text-gray-400 border border-white/10'
                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500 hover:text-white'
                      }`}
                  >
                    {isFollowing ? <><Check size={12} /> Added</> : <><Plus size={12} /> Add</>}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
