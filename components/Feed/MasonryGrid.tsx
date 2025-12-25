import React from 'react';
import { Post } from '../../types';
import { PostCard } from './PostCard';

interface MasonryGridProps {
  posts: Post[];
  isLoading: boolean;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({ posts, isLoading, onLike, onComment }) => {
  if (isLoading) {
    return (
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="mb-6 break-inside-avoid glass-panel rounded-2xl h-80 animate-pulse bg-white/5" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <span className="text-4xl">📸</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">No Memories Yet</h3>
        <p className="text-gray-400 max-w-md">Be the first to capture a moment in time. Click the upload button to get started.</p>
      </div>
    );
  }

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={onLike}
          onComment={onComment}
        />
      ))}
    </div>
  );
};
