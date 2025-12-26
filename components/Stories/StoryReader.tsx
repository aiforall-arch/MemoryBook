import React, { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, Clock, ChevronLeft, Send, Globe } from 'lucide-react';
import { Story, StoryComment, UserProfile } from '../../types';
import { GlassCard } from '../UI/GlassCard';

interface StoryReaderProps {
    story: Story;
    user: UserProfile | null;
    comments: StoryComment[];
    isLoadingComments: boolean;
    onClose: () => void;
    onLike: () => void;
    onAddComment: (content: string) => Promise<void>;
}

// Calculate reading time
const calculateReadingTime = (content: string): number => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
};

// Format relative time
const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
};

export const StoryReader: React.FC<StoryReaderProps> = ({
    story,
    user,
    comments,
    isLoadingComments,
    onClose,
    onLike,
    onAddComment
}) => {
    const [liked, setLiked] = useState(story.is_liked || false);
    const [likesCount, setLikesCount] = useState(story.likes_count);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showComments, setShowComments] = useState(false);

    const readingTime = calculateReadingTime(story.content);
    const isTamil = story.language === 'ta';

    const handleLike = () => {
        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);
        onLike();
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAddComment(newComment.trim());
            setNewComment('');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-[#0B0F1A] overflow-y-auto">
            {/* Header */}
            <header className="sticky top-0 z-10 glass-panel border-b border-white/10 px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span className="text-sm font-medium">Back</span>
                    </button>

                    <div className="flex items-center gap-4">
                        {/* Language Badge */}
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${isTamil ? 'bg-orange-500/80 text-white' : 'bg-cyan-500/80 text-white'
                            }`}>
                            <Globe size={12} className="inline mr-1" />
                            {isTamil ? 'TA' : 'EN'}
                        </span>

                        {/* Reading Time */}
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={14} />
                            {readingTime} min read
                        </span>
                    </div>
                </div>
            </header>

            {/* Cover Image */}
            {story.cover_image_url && (
                <div className="relative h-64 md:h-80 overflow-hidden">
                    <img
                        src={story.cover_image_url}
                        alt={story.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A]/50 to-transparent" />
                </div>
            )}

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 py-8">
                {/* Title */}
                <h1 className={`text-3xl md:text-4xl font-bold text-white mb-6 leading-tight ${isTamil ? 'font-tamil' : ''
                    }`}>
                    {story.title}
                </h1>

                {/* Author Info */}
                <div className="flex items-center gap-3 mb-8 pb-8 border-b border-white/10">
                    <img
                        src={story.author_avatar}
                        alt={story.author_username}
                        className="w-12 h-12 rounded-full border-2 border-purple-500/30"
                    />
                    <div>
                        <p className="text-white font-medium">@{story.author_username}</p>
                        <p className="text-sm text-gray-400">{getRelativeTime(story.created_at)}</p>
                    </div>
                </div>

                {/* Story Body */}
                <article className={`prose prose-invert max-w-none ${isTamil ? 'font-tamil text-lg leading-loose' : 'text-lg leading-relaxed'
                    }`}>
                    {story.content.split('\n').map((paragraph, idx) => (
                        paragraph.trim() && (
                            <p key={idx} className="text-gray-200 mb-6">
                                {paragraph}
                            </p>
                        )
                    ))}
                </article>

                {/* Actions */}
                <div className="mt-12 pt-8 border-t border-white/10">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${liked
                                    ? 'bg-pink-500/20 text-pink-400'
                                    : 'bg-white/5 text-gray-400 hover:text-pink-400'
                                }`}
                        >
                            <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
                            <span className="font-medium">{likesCount}</span>
                        </button>

                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-cyan-400 transition-colors"
                        >
                            <MessageCircle size={20} />
                            <span className="font-medium">{comments.length}</span>
                        </button>
                    </div>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="mt-8 space-y-6">
                        <h3 className="text-xl font-bold text-white">Comments</h3>

                        {/* Comment Form */}
                        {user && (
                            <form onSubmit={handleSubmitComment} className="flex gap-3">
                                <img
                                    src={user.avatar_url}
                                    alt={user.username}
                                    className="w-10 h-10 rounded-full border border-white/10"
                                />
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Share your thoughts..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || isSubmitting}
                                    className="p-3 bg-purple-500 rounded-xl text-white disabled:opacity-50 disabled:grayscale hover:bg-purple-600 transition-colors"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        )}

                        {/* Comments List */}
                        {isLoadingComments ? (
                            <div className="animate-pulse space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-20 bg-white/5 rounded-xl" />
                                ))}
                            </div>
                        ) : comments.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">No comments yet. Be the first!</p>
                        ) : (
                            <div className="space-y-4">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-3">
                                        <img
                                            src={comment.avatar_url}
                                            alt={comment.username}
                                            className="w-9 h-9 rounded-full border border-white/10"
                                        />
                                        <div className="flex-1">
                                            <div className="bg-white/5 rounded-2xl rounded-tl-sm p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-purple-400">@{comment.username}</span>
                                                    <span className="text-[10px] text-gray-500">{getRelativeTime(comment.created_at)}</span>
                                                </div>
                                                <p className="text-sm text-gray-200">{comment.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};
