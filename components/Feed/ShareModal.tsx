import React, { useState } from 'react';
import { X, Link2, Twitter, Facebook, MessageCircle, Mail, Share2, Check } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { Post } from '../../types';

interface ShareModalProps {
    post: Post;
    isOpen: boolean;
    onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ post, isOpen, onClose }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    // Generate shareable URL (using current origin + post ID)
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    const shareText = post.caption.length > 100
        ? `${post.caption.substring(0, 100)}...`
        : post.caption;
    const shareTitle = `Check out this memory from @${post.username}`;

    // Copy link to clipboard
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Native Web Share API
    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
                onClose();
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        }
    };

    // Social share handlers
    const shareToTwitter = () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank', 'width=550,height=420');
    };

    const shareToFacebook = () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.open(facebookUrl, '_blank', 'width=550,height=420');
    };

    const shareToWhatsApp = () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`;
        window.open(whatsappUrl, '_blank');
    };

    const shareViaEmail = () => {
        const subject = encodeURIComponent(shareTitle);
        const body = encodeURIComponent(`${shareText}\n\nCheck it out: ${shareUrl}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const shareOptions = [
        {
            id: 'copy',
            icon: copied ? Check : Link2,
            label: copied ? 'Copied!' : 'Copy Link',
            onClick: handleCopyLink,
            color: copied ? 'text-emerald-400' : 'text-gray-300',
            bgColor: copied ? 'bg-emerald-500/10' : 'bg-white/5',
        },
        {
            id: 'twitter',
            icon: Twitter,
            label: 'Twitter / X',
            onClick: shareToTwitter,
            color: 'text-sky-400',
            bgColor: 'bg-sky-500/10',
        },
        {
            id: 'facebook',
            icon: Facebook,
            label: 'Facebook',
            onClick: shareToFacebook,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
        },
        {
            id: 'whatsapp',
            icon: MessageCircle,
            label: 'WhatsApp',
            onClick: shareToWhatsApp,
            color: 'text-green-400',
            bgColor: 'bg-green-500/10',
        },
        {
            id: 'email',
            icon: Mail,
            label: 'Email',
            onClick: shareViaEmail,
            color: 'text-orange-400',
            bgColor: 'bg-orange-500/10',
        },
    ];

    return (
        <div
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <GlassCard
                className="w-full max-w-sm sm:rounded-3xl rounded-t-3xl rounded-b-none sm:rounded-b-3xl animate-[fadeIn_0.2s_ease-out]"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                            <Share2 size={18} className="text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Share Memory</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Post Preview */}
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-6">
                    <img
                        src={post.image_url}
                        alt="Post preview"
                        className="w-14 h-14 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">@{post.username}</p>
                        <p className="text-xs text-gray-400 truncate">{shareText}</p>
                    </div>
                </div>

                {/* Share Options Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {shareOptions.map((option) => (
                        <button
                            key={option.id}
                            onClick={option.onClick}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl ${option.bgColor} hover:scale-105 active:scale-95 transition-all duration-200`}
                        >
                            <option.icon size={24} className={option.color} />
                            <span className="text-xs text-gray-300 font-medium">{option.label}</span>
                        </button>
                    ))}
                </div>

                {/* Native Share Button (if supported) */}
                {typeof navigator !== 'undefined' && navigator.share && (
                    <button
                        onClick={handleNativeShare}
                        className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        <Share2 size={18} />
                        More Options
                    </button>
                )}
            </GlassCard>
        </div>
    );
};
