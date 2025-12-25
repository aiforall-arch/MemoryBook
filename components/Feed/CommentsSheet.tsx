import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { api } from '../../services/supabase';
import { PostComment, UserProfile } from '../../types';

interface CommentsSheetProps {
    postId: string;
    user: UserProfile | null;
    onClose: () => void;
    onCommentAdded: () => void;
}

export const CommentsSheet: React.FC<CommentsSheetProps> = ({ postId, user, onClose, onCommentAdded }) => {
    const [comments, setComments] = useState<PostComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchComments = async () => {
            const data = await api.getComments(postId);
            setComments(data);
        };
        fetchComments();
    }, [postId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await api.addComment(postId, user.id, newComment.trim());
            setNewComment('');
            // Refresh local comments
            const updated = await api.getComments(postId);
            setComments(updated);
            onCommentAdded(); // Notify parent to refresh count
        } catch (error) {
            console.error('Failed to add comment', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-lg bg-[#0B0F1A] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl flex flex-col h-[80vh] sm:h-auto sm:max-h-[600px] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Comments</h3>
                    <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-white/5 rounded-full text-gray-400">
                        <X size={24} />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {comments.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <p className="text-gray-400">No comments yet. Be the first!</p>
                        </div>
                    ) : (
                        comments.map((c) => (
                            <div key={c.id} className="flex gap-3">
                                <img src={c.avatar_url} className="w-8 h-8 rounded-full border border-white/10" alt={c.username} />
                                <div className="flex-1">
                                    <div className="bg-white/5 rounded-2xl rounded-tl-none p-3">
                                        <p className="text-xs font-bold text-purple-400 mb-1">@{c.username}</p>
                                        <p className="text-sm text-gray-200">{c.content}</p>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1 ml-1">
                                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-2 bg-[#0B0F1A]/50 border border-white/10 rounded-2xl p-2 px-4 focus-within:border-purple-500/50 transition-colors">
                        <input
                            type="text"
                            placeholder={user ? "Write a comment..." : "Login to comment"}
                            disabled={!user || isSubmitting}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="flex-1 bg-transparent py-2 text-sm text-white focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!user || !newComment.trim() || isSubmitting}
                            aria-label="Send comment"
                            className="p-2 text-purple-400 disabled:opacity-30 disabled:grayscale transition-all hover:scale-110 active:scale-90"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
