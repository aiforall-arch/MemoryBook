import React, { useState, useEffect } from 'react';
import { BookOpen, PenSquare, Filter } from 'lucide-react';
import { Story, UserProfile } from '../../types';
import { StoryCard } from './StoryCard';
import { NeonButton } from '../UI/NeonButton';
import { SkeletonLoader } from '../UI/SkeletonLoader';

interface StoriesListProps {
    stories: Story[];
    isLoading: boolean;
    user: UserProfile | null;
    onStoryClick: (story: Story) => void;
    onCreateStory: () => void;
}

export const StoriesList: React.FC<StoriesListProps> = ({
    stories,
    isLoading,
    user,
    onStoryClick,
    onCreateStory,
    onLike,
    onComment
}) => {
    const [languageFilter, setLanguageFilter] = useState<'all' | 'en' | 'ta'>('all');

    // Filter stories by language
    const filteredStories = languageFilter === 'all'
        ? stories
        : stories.filter(s => s.language === languageFilter);

    if (isLoading) {
        return <SkeletonLoader type="story" count={4} />;
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <BookOpen className="text-purple-400" size={28} />
                        Exclusive Stories
                    </h1>
                    <p className="text-gray-400 mt-1 italic">
                        Some memories need more than an image. They need words that stay.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Language Filter */}
                    <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
                        <button
                            onClick={() => setLanguageFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${languageFilter === 'all'
                                ? 'bg-purple-500 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setLanguageFilter('en')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${languageFilter === 'en'
                                ? 'bg-cyan-500 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            English
                        </button>
                        <button
                            onClick={() => setLanguageFilter('ta')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${languageFilter === 'ta'
                                ? 'bg-orange-500 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            தமிழ்
                        </button>
                    </div>

                    {/* Create Story Button */}
                    {user && (
                        <NeonButton onClick={onCreateStory}>
                            <PenSquare size={18} className="mr-2" />
                            Write Story
                        </NeonButton>
                    )}
                </div>
            </div>

            {/* Stories Grid */}
            {filteredStories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                        <BookOpen size={32} className="text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No Stories Yet</h3>
                    <p className="text-gray-400 max-w-md mb-6">
                        {languageFilter !== 'all'
                            ? `No ${languageFilter === 'en' ? 'English' : 'Tamil'} stories found. Be the first to write one!`
                            : 'Be the first to share a meaningful story with your friends.'}
                    </p>
                    {user && (
                        <NeonButton onClick={onCreateStory}>
                            <PenSquare size={18} className="mr-2" />
                            Write Your First Story
                        </NeonButton>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredStories.map((story) => (
                        <StoryCard
                            key={story.id}
                            story={story}
                            onClick={() => onStoryClick(story)}
                            onLike={() => onLike(story)}
                            onComment={() => onComment(story)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
