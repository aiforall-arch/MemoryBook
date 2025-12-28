import React from 'react';
import { Heart, MessageCircle, Clock, Globe } from 'lucide-react';
import { Story } from '../../types';
import { GlassCard } from '../UI/GlassCard';

interface StoryCardProps {
    story: Story;
    onClick: () => void;
    onLike: (e: React.MouseEvent) => void;
    onComment: (e: React.MouseEvent) => void;
}

// Calculate reading time based on content length
const calculateReadingTime = (content: string): number => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
};

// Get language label
const getLanguageLabel = (lang: 'en' | 'ta'): string => {
    return lang === 'en' ? 'EN' : 'TA';
};

export const StoryCard: React.FC<StoryCardProps> = ({ story, onClick, onLike, onComment }) => {
    const readingTime = calculateReadingTime(story.content);
    const excerpt = story.content.length > 120
        ? `${story.content.substring(0, 120)}...`
        : story.content;

    return (
        <GlassCard
            className="overflow-hidden cursor-pointer group hover:border-purple-500/30 transition-all duration-300"
            onClick={onClick}
            hoverEffect
        >
            {/* Cover Image */}
            {story.cover_image_url && (
                <div className="relative h-48 overflow-hidden -mx-6 -mt-6 mb-4">
                    <img
                        src={story.cover_image_url}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-transparent to-transparent" />

                    {/* Language Badge */}
                    <div className="absolute top-3 right-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${story.language === 'ta'
                            ? 'bg-orange-500/80 text-white'
                            : 'bg-cyan-500/80 text-white'
                            }`}>
                            <Globe size={12} className="inline mr-1" />
                            {getLanguageLabel(story.language)}
                        </span>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="space-y-3">
                {/* Title */}
                <h3 className={`text-lg font-bold text-white line-clamp-2 group-hover:text-purple-300 transition-colors ${story.language === 'ta' ? 'font-tamil' : ''
                    }`}>
                    {story.title}
                </h3>

                {/* Excerpt */}
                <p className={`text-gray-400 text-sm line-clamp-3 ${story.language === 'ta' ? 'font-tamil leading-relaxed' : ''
                    }`}>
                    {excerpt}
                </p>

                {/* Author & Meta */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <img
                            src={story.author_avatar}
                            alt={story.author_username}
                            className="w-6 h-6 rounded-full border border-white/10"
                        />
                        <span className="text-xs text-gray-400">@{story.author_username}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {readingTime} min
                        </span>

                        {/* Like Button */}
                        <div className="relative z-20">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onLike(e);
                                }}
                                className={`flex items-center gap-1 transition-colors ${story.is_liked ? 'text-pink-500' : 'hover:text-pink-400'}`}
                                title="Like Story"
                            >
                                <Heart size={14} className={story.is_liked ? "fill-current" : ""} />
                                <span>{story.likes_count}</span>
                            </button>
                        </div>

                        {/* Comment Button */}
                        <div className="relative z-20">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onComment(e);
                                }}
                                className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
                                title="View Comments"
                            >
                                <MessageCircle size={14} />
                                <span>{story.comments_count}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};
