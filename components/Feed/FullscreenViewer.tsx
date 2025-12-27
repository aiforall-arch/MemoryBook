import React from 'react';
import { X, Heart, MessageCircle, User } from 'lucide-react';
import { Post } from '../../types';
import { GlassCard } from '../UI/GlassCard';

interface FullscreenViewerProps {
    post: Post;
    onClose: () => void;
    onLike: (id: string) => void;
    onComment: (id: string) => void;
}

export const FullscreenViewer: React.FC<FullscreenViewerProps> = ({ post, onClose, onLike, onComment }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 lg:p-8 animate-[fadeIn_0.3s_ease-out]">
            <button
                onClick={onClose}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-10"
                aria-label="Close viewer"
            >
                <X size={32} />
            </button>

            <div className="flex flex-col lg:flex-row w-full max-w-7xl h-full lg:h-[85vh] bg-[#0B0F1A]/80 rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
                {/* Image Section */}
                <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden group">
                    <img
                        src={post.image_url}
                        alt={post.caption}
                        className="w-full h-full object-contain"
                    />
                </div>

                {/* Sidebar Section */}
                <div className="w-full lg:w-[400px] flex flex-col bg-[#0B0F1A] border-l border-white/10">
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex items-center gap-4">
                        <img
                            src={post.user_avatar}
                            alt={post.username}
                            className="w-12 h-12 rounded-full border-2 border-purple-500/50 object-cover"
                        />
                        <div>
                            <h3 className="text-white font-bold">{post.username}</h3>
                            <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <p className="text-gray-300 leading-relaxed italic">
                            "{post.caption}"
                        </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-white/10 bg-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => onLike(post.id)}
                                    className={`flex items-center gap-2 transition-colors ${post.is_liked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400'}`}
                                >
                                    <Heart size={24} fill={post.is_liked ? "currentColor" : "none"} />
                                    <span className="font-bold">{post.likes_count}</span>
                                </button>
                                <button
                                    onClick={() => onComment(post.id)}
                                    className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors"
                                >
                                    <MessageCircle size={24} />
                                    <span className="font-bold">{post.comments_count}</span>
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500">Captured in the Memory Vault</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
