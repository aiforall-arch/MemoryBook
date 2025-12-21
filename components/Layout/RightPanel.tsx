import React from 'react';
import { GlassCard } from '../UI/GlassCard';
import { UserProfile } from '../../types';
import { TrendingUp, Activity, Users } from 'lucide-react';

interface RightPanelProps {
  user: UserProfile | null;
}

export const RightPanel: React.FC<RightPanelProps> = ({ user }) => {
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
        <p className="text-sm text-gray-400 mb-6 line-clamp-2">{user.bio}</p>
        
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

      {/* Trending / Activity */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity size={16} /> Recent Activity
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 items-start p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
              <div className="w-2 h-2 mt-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
              <div>
                <p className="text-sm text-gray-300">
                  <span className="text-white font-medium">Sarah</span> liked your photo from <span className="text-purple-400">Tokyo</span>.
                </p>
                <p className="text-xs text-gray-500 mt-1">2 mins ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Friends */}
      <div>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Users size={16} /> Suggested
        </h3>
        <div className="space-y-4">
          {['alex_cyber', 'pixel_queen', 'retro_dave'].map((name, i) => (
            <div key={name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={`https://picsum.photos/id/${50+i}/50/50`} className="w-8 h-8 rounded-full" alt={name}/>
                <span className="text-sm text-gray-300 font-medium">{name}</span>
              </div>
              <button className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">Add +</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
