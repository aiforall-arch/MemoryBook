import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { Post } from '../../types';
import { GlassCard } from '../UI/GlassCard';

interface PostCardProps {
  post: Post;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  onShare?: (post: Post) => void;
  onView?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  currentUserId?: string;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onView,
  onDelete,
  currentUserId
}) => {
  const [liked, setLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleLike = () => {
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
    onLike(post.id);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/memory/${post.id}`);
    setShowMenu(false);
  };

  return (
    <div
      className="mb-6 relative group break-inside-avoid"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <GlassCard className="!p-0 overflow-hidden border-0 bg-[#1E203C]/40" hoverEffect>
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={post.user_avatar}
              alt={post.username}
              className="w-10 h-10 rounded-full border-2 border-purple-500/30 object-cover"
            />
            <div>
              <h3 className="text-sm font-semibold text-white">{post.username}</h3>
              <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="relative">
            <button
              aria-label="More options"
              className="text-gray-400 hover:text-white p-2 transition-colors"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreHorizontal size={20} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 glass-panel border border-white/10 rounded-xl py-2 shadow-2xl z-20 animate-[fadeIn_0.2s_ease-out]">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                  onClick={handleCopyLink}
                >
                  Copy Memory Link
                </button>
                {currentUserId === post.user_id && (
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                    onClick={() => {
                      onDelete?.(post.id);
                      setShowMenu(false);
                    }}
                  >
                    Delete Memory
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Image Area */}
        <div
          className="relative overflow-hidden w-full bg-gray-900 aspect-auto cursor-pointer"
          onClick={() => onView?.(post)}
        >
          <img
            src={post.image_url}
            alt={post.caption}
            loading="lazy"
            className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
          />
          <div className={`absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-transparent to-transparent opacity-0 group-hover:opacity-80 transition-opacity duration-300 flex items-end justify-center pb-8`}>
            <span className="text-white/80 text-sm font-medium tracking-widest uppercase">View Memory</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            {post.caption.length > 100 ? `${post.caption.substring(0, 100)}...` : post.caption}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 transition-colors ${liked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400'}`}
              >
                <Heart size={20} fill={liked ? "currentColor" : "none"} className={liked ? "animate-[bounce_0.2s_ease-in-out]" : ""} />
                <span className="text-xs font-medium">{likesCount}</span>
              </button>

              <button
                onClick={() => onComment(post.id)}
                className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors"
              >
                <MessageCircle size={20} />
                <span className="text-xs font-medium">{post.comments_count}</span>
              </button>
            </div>

            <button
              onClick={() => onShare?.(post)}
              aria-label="Share memory"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
