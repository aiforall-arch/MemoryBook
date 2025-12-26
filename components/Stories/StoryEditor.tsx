import React, { useState, useRef } from 'react';
import { X, Image, Globe, Send, Loader2 } from 'lucide-react';
import { CreateStoryInput, UserProfile } from '../../types';
import { GlassCard } from '../UI/GlassCard';
import { NeonButton } from '../UI/NeonButton';
import imageCompression from 'browser-image-compression';

interface StoryEditorProps {
    user: UserProfile;
    isOpen: boolean;
    onClose: () => void;
    onPublish: (story: CreateStoryInput, coverFile?: File) => Promise<void>;
}

export const StoryEditor: React.FC<StoryEditorProps> = ({
    user,
    isOpen,
    onClose,
    onPublish
}) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [language, setLanguage] = useState<'en' | 'ta'>('en');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Compress image
            const compressed = await imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true
            });

            setCoverImage(compressed);
            setCoverPreview(URL.createObjectURL(compressed));
        } catch (err) {
            setError('Failed to process image');
        }
    };

    const removeCover = () => {
        setCoverImage(null);
        setCoverPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handlePublish = async () => {
        if (!title.trim()) {
            setError('Please add a title');
            return;
        }
        if (!content.trim()) {
            setError('Please write some content');
            return;
        }

        setError('');
        setIsPublishing(true);

        try {
            await onPublish(
                {
                    title: title.trim(),
                    content: content.trim(),
                    language
                },
                coverImage || undefined
            );

            // Reset form
            setTitle('');
            setContent('');
            setLanguage('en');
            setCoverImage(null);
            setCoverPreview(null);
            onClose();
        } catch (err) {
            setError('Failed to publish story. Please try again.');
        } finally {
            setIsPublishing(false);
        }
    };

    const isTamil = language === 'ta';

    return (
        <div className="fixed inset-0 z-[70] bg-[#0B0F1A] overflow-y-auto">
            {/* Header */}
            <header className="sticky top-0 z-10 glass-panel border-b border-white/10 px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                        <span className="text-sm font-medium">Cancel</span>
                    </button>

                    <h2 className="text-lg font-bold text-white">Write Story</h2>

                    <NeonButton
                        onClick={handlePublish}
                        isLoading={isPublishing}
                        disabled={!title.trim() || !content.trim()}
                    >
                        <Send size={16} className="mr-1" />
                        Publish
                    </NeonButton>
                </div>
            </header>

            {/* Editor */}
            <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Language Selector */}
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                        <Globe size={16} />
                        Language:
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setLanguage('en')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${language === 'en'
                                    ? 'bg-cyan-500 text-white'
                                    : 'bg-white/5 text-gray-400 hover:text-white'
                                }`}
                        >
                            English
                        </button>
                        <button
                            onClick={() => setLanguage('ta')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${language === 'ta'
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-white/5 text-gray-400 hover:text-white'
                                }`}
                        >
                            தமிழ்
                        </button>
                    </div>
                </div>

                {/* Cover Image */}
                <div>
                    {coverPreview ? (
                        <div className="relative rounded-2xl overflow-hidden h-48">
                            <img
                                src={coverPreview}
                                alt="Cover"
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={removeCover}
                                className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-purple-500/50 hover:text-purple-400 transition-all"
                        >
                            <Image size={24} />
                            <span className="text-sm">Add Cover Image (Recommended)</span>
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverSelect}
                        className="hidden"
                        title="Select cover image"
                    />
                </div>

                {/* Title Input */}
                <div>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                        placeholder={isTamil ? 'தலைப்பு...' : 'Story Title...'}
                        className={`w-full bg-transparent text-3xl font-bold text-white placeholder-gray-600 focus:outline-none border-none ${isTamil ? 'font-tamil' : ''
                            }`}
                    />
                    <p className="text-xs text-gray-500 mt-1">{title.length}/120 characters</p>
                </div>

                {/* Content Textarea */}
                <div className="min-h-[400px]">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={isTamil
                            ? 'உங்கள் கதையை இங்கே எழுதுங்கள்...'
                            : 'Write your story here...'
                        }
                        className={`w-full h-full min-h-[400px] bg-transparent text-lg text-gray-200 placeholder-gray-600 focus:outline-none resize-none leading-relaxed ${isTamil ? 'font-tamil leading-loose' : ''
                            }`}
                    />
                </div>

                {/* Author Preview */}
                <div className="pt-6 border-t border-white/10">
                    <p className="text-xs text-gray-500 mb-2">Publishing as:</p>
                    <div className="flex items-center gap-3">
                        <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-10 h-10 rounded-full border border-white/10"
                        />
                        <span className="text-white font-medium">@{user.username}</span>
                    </div>
                </div>
            </main>
        </div>
    );
};
