import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Heart, Trash2, Reply, ChevronDown } from 'lucide-react';
import { api } from '../../services/supabase';
import { PostComment, UserProfile } from '../../types';

interface EnhancedCommentsSheetProps {
    postId: string;
    user: UserProfile | null;
    onClose: () => void;
    onCommentAdded: () => void;
}

// Helper function for relative time
const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    return date.toLocaleDateString();
};

export const EnhancedCommentsSheet: React.FC<EnhancedCommentsSheetProps> = ({
    postId,
    user,
    onClose,
    onCommentAdded
}) => {
    const [comments, setComments] = useState<PostComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<PostComment | null>(null);
    const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
    const [showAllComments, setShowAllComments] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    // Fetch comments on mount
    useEffect(() => {
        const fetchComments = async () => {
            setIsLoading(true);
            try {
                const data = await api.getComments(postId);
                setComments(data);
            } catch (error) {
                console.error('Failed to fetch comments:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchComments();
    }, [postId]);

    // Focus input when replying
    useEffect(() => {
        if (replyingTo && inputRef.current) {
            inputRef.current.focus();
        }
    }, [replyingTo]);

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('COMMENT: handleSubmit called', { user: !!user, newComment, isSubmitting });

        if (!user || !newComment.trim() || isSubmitting) {
            console.log('COMMENT: Submit blocked', { hasUser: !!user, hasComment: !!newComment.trim(), isSubmitting });
            return;
        }

        setIsSubmitting(true);
        try {
            // Add @mention if replying
            const commentContent = replyingTo
                ? `@${replyingTo.username} ${newComment.trim()}`
                : newComment.trim();

            console.log('COMMENT: Calling api.addComment', { postId, userId: user.id, commentContent });
            await api.addComment(postId, user.id, commentContent);
            console.log('COMMENT: addComment succeeded');

            setNewComment('');
            setReplyingTo(null);

            // Refresh comments
            const updated = await api.getComments(postId);
            console.log('COMMENT: Refreshed comments', updated.length);
            setComments(updated);
            onCommentAdded();

            // Scroll to new comment
            setTimeout(() => {
                commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (error) {
            console.error('COMMENT: Failed to add comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle reply
    const handleReply = (comment: PostComment) => {
        setReplyingTo(comment);
        setNewComment('');
    };

    // Cancel reply
    const cancelReply = () => {
        setReplyingTo(null);
        setNewComment('');
    };

    // Toggle like on comment (local only - no backend for comment likes)
    const handleLikeComment = (commentId: string) => {
        setLikedComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    // Delete comment (only own comments)
    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Delete this comment?')) return;

        // For now, just remove from local state
        // Real implementation would call api.deleteComment
        setComments(prev => prev.filter(c => c.id !== commentId));
    };

    // Determine which comments to show
    const displayedComments = showAllComments ? comments : comments.slice(0, 5);
    const hasMoreComments = comments.length > 5 && !showAllComments;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-md"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg bg-[#0B0F1A]/60 backdrop-blur-2xl border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl flex flex-col h-[85vh] sm:h-auto sm:max-h-[600px] overflow-hidden animate-[slideUp_0.3s_ease-out] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-white">Comments</h3>
                        <p className="text-xs text-gray-500">{comments.length} comments</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                        title="Close"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                <Send size={24} className="text-gray-500" />
                            </div>
                            <p className="text-gray-400 font-medium">No comments yet</p>
                            <p className="text-gray-500 text-sm mt-1">Be the first to share your thoughts!</p>
                        </div>
                    ) : (
                        <>
                            {displayedComments.map((comment) => {
                                const isOwn = user?.id === comment.user_id;
                                const isLiked = likedComments.has(comment.id);
                                const isMention = comment.content.startsWith('@');

                                return (
                                    <div key={comment.id} className="flex gap-3 group">
                                        <img
                                            src={comment.avatar_url}
                                            className="w-9 h-9 rounded-full border border-white/10 flex-shrink-0"
                                            alt={comment.username}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="bg-white/5 rounded-2xl rounded-tl-sm p-3 relative">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-xs font-bold text-purple-400">@{comment.username}</p>
                                                    <span className="text-[10px] text-gray-500">{getRelativeTime(comment.created_at)}</span>
                                                </div>
                                                <p className="text-sm text-gray-200 break-words">
                                                    {isMention ? (
                                                        <>
                                                            <span className="text-cyan-400">{comment.content.split(' ')[0]}</span>
                                                            {' '}{comment.content.split(' ').slice(1).join(' ')}
                                                        </>
                                                    ) : (
                                                        comment.content
                                                    )}
                                                </p>
                                            </div>

                                            {/* Comment Actions */}
                                            <div className="flex items-center gap-4 mt-1.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleLikeComment(comment.id)}
                                                    className={`flex items-center gap-1 text-xs transition-colors ${isLiked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-400'
                                                        }`}
                                                >
                                                    <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                                                    <span>Like</span>
                                                </button>

                                                <button
                                                    onClick={() => handleReply(comment)}
                                                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-cyan-400 transition-colors"
                                                >
                                                    <Reply size={14} />
                                                    <span>Reply</span>
                                                </button>

                                                {isOwn && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                        <span>Delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Load More Button */}
                            {hasMoreComments && (
                                <button
                                    onClick={() => setShowAllComments(true)}
                                    className="w-full py-2 text-sm text-purple-400 hover:text-purple-300 flex items-center justify-center gap-1 transition-colors"
                                >
                                    <ChevronDown size={16} />
                                    View {comments.length - 5} more comments
                                </button>
                            )}

                            <div ref={commentsEndRef} />
                        </>
                    )}
                </div>

                {/* Reply Indicator */}
                {replyingTo && (
                    <div className="px-4 py-2 bg-cyan-500/10 border-t border-cyan-500/20 flex items-center justify-between">
                        <p className="text-xs text-cyan-400">
                            Replying to <span className="font-bold">@{replyingTo.username}</span>
                        </p>
                        <button
                            onClick={cancelReply}
                            className="text-xs text-gray-400 hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-white/[0.02] flex-shrink-0">
                    <div className="flex items-center gap-2 bg-[#0B0F1A]/50 border border-white/10 rounded-2xl p-2 px-4 focus-within:border-purple-500/50 transition-colors">
                        {user && (
                            <img
                                src={user.avatar_url}
                                alt={user.username}
                                className="w-7 h-7 rounded-full border border-white/10"
                            />
                        )}
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={user ? "Write a comment..." : "Login to comment"}
                            disabled={!user || isSubmitting}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="flex-1 bg-transparent py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!user || !newComment.trim() || isSubmitting}
                            className="p-2 text-purple-400 disabled:opacity-30 disabled:grayscale transition-all hover:scale-110 active:scale-90"
                            title="Send"
                        >
                            {isSubmitting ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400" />
                            ) : (
                                <Send size={20} />
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
