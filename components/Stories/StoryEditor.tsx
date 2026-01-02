import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, UploadCloud, Image as ImageIcon, Sparkles, Maximize, Minimize, Square } from 'lucide-react';
import { NeonButton } from '../UI/NeonButton';
import { GlassCard } from '../UI/GlassCard';
import { ImageCropper, ASPECT_RATIOS, AspectRatioKey } from '../Upload/ImageCropper'; // Reusing existing components
import { UploadProgressBar } from '../Upload/UploadProgressBar'; // Reusing existing components
import { useToast } from '../UI/ToastNotification';
import imageCompression from 'browser-image-compression';
import { CreateStoryInput, UserProfile } from '../../types';

interface StoryEditorProps {
    user: UserProfile;
    isOpen: boolean;
    onClose: () => void;
    onPublish: (story: CreateStoryInput, coverFile?: File) => Promise<void>;
}

export const StoryEditor: React.FC<StoryEditorProps> = ({ user, isOpen, onClose, onPublish }) => {
    // File states
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
    const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

    // Form states
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [language, setLanguage] = useState<'en' | 'ta'>('en');
    const [aspectRatio, setAspectRatio] = useState<AspectRatioKey | 'original'>('stories'); // Default to stories ratio
    const [originalDimensions, setOriginalDimensions] = useState<{ width: number, height: number, ratio: number } | null>(null);

    // AI/Magic states (Future proofing)
    const [isGenerating, setIsGenerating] = useState(false);

    // UI states
    const [isDragging, setIsDragging] = useState(false);
    const [step, setStep] = useState<'cover' | 'write'>('cover'); // 'cover' handles select+crop, 'write' handles content

    // Progress states
    const [isCompressing, setIsCompressing] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast, ToastComponent } = useToast();

    // Cleanup preview object URL
    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    // Cleanup cover preview object URL
    useEffect(() => {
        return () => {
            if (coverPreviewUrl) {
                URL.revokeObjectURL(coverPreviewUrl);
            }
        };
    }, [coverPreviewUrl]);

    // Handle initial cover preview when blob changes
    useEffect(() => {
        if (croppedBlob) {
            const url = URL.createObjectURL(croppedBlob);
            setCoverPreviewUrl(url);
            // Move to write step automatically if we just finished cropping
            if (step === 'cover' && preview) {
                setStep('write');
            }
        }
    }, [croppedBlob]);

    if (!isOpen) return null;

    // --- File Processing Logic (Similar to EnhancedUploadModal) ---

    // --- File Processing Logic (Simplified - Matching UploadModal) ---

    const processFile = async (selectedFile: File) => {
        if (!selectedFile.type.startsWith('image/')) {
            showToast('Please upload an image file', 'error');
            return;
        }

        let fileToProcess = selectedFile;

        // Compression Logic (Same as UploadModal)
        if (selectedFile.size > 1.5 * 1024 * 1024) {
            setIsCompressing(true);
            try {
                const options = { maxSizeMB: 1.5, maxWidthOrHeight: 1920, useWebWorker: true };
                fileToProcess = await imageCompression(selectedFile, options);
            } catch (error) {
                console.error('Compression error:', error);
            } finally {
                setIsCompressing(false);
            }
        }

        setOriginalFile(fileToProcess);

        // Use FileReader for stable preview (prevents blob URL revocation issues)
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
            setStep('write'); // Auto-advance to write step
        };
        reader.readAsDataURL(fileToProcess);
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
    };

    // --- Publishing Logic ---

    const handlePublish = async () => {
        if (!title.trim()) { showToast('Please add a title', 'error'); return; }
        if (!content.trim()) { showToast('Please write your story', 'error'); return; }

        setIsPublishing(true);
        setUploadProgress(0);

        // Fake progress for UX - clear reference for cleanup
        let progressInterval: ReturnType<typeof setInterval> | null = setInterval(() => {
            setUploadProgress(p => p >= 90 ? 90 : p + 5);
        }, 100);

        try {
            // Use original (or compressed) file directly, skipping crop to avoid crashes
            await onPublish({ title: title.trim(), content: content.trim(), language }, originalFile || undefined);

            // Clear interval before setting 100%
            if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
            }

            setUploadProgress(100);
            showToast('Story published successfully!', 'success');

            // Small delay to show 100% before closing
            setTimeout(() => {
                setIsPublishing(false);
                onClose();
            }, 500);
        } catch (e) {
            console.error('Publish error:', e);
            showToast('Failed to publish story. Please try again.', 'error');
            setUploadProgress(0);
            setIsPublishing(false);
        } finally {
            // Ensure interval is always cleaned up
            if (progressInterval) {
                clearInterval(progressInterval);
            }
        }
    };

    // --- Renders ---

    const aspectRatioButtons = [
        { key: 'stories' as const, icon: <Maximize size={16} />, label: 'Story (9:16)' },
        { key: 'landscape' as const, icon: <Minimize className="rotate-90" size={16} />, label: 'Wide (16:9)' },
        { key: 'square' as const, icon: <Square size={16} />, label: 'Square (1:1)' },
        { key: 'original' as const, icon: <Sparkles size={16} />, label: 'Original' },
    ];

    const currentRatioConfig = aspectRatio === 'original'
        ? (originalDimensions ? { label: 'Original', ratio: originalDimensions.ratio, width: originalDimensions.width, height: originalDimensions.height } : null)
        : ASPECT_RATIOS[aspectRatio as AspectRatioKey];

    const isTamil = language === 'ta';

    return (
        <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            {ToastComponent}

            <GlassCard className="w-full max-w-5xl h-[90vh] flex overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    aria-label="Close Editor"
                    title="Close Editor"
                    className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/10 text-white rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex w-full h-full flex-col lg:flex-row">

                    {/* LEFT PANEL: Image / Cover */}
                    <div className="w-full lg:w-1/2 bg-[#050505] relative flex flex-col border-b lg:border-b-0 lg:border-r border-white/5">

                        {/* Step 1: Select/Drag */}
                        {!preview && (
                            <div
                                className={`flex-1 flex flex-col items-center justify-center p-8 transition-colors ${isDragging ? 'bg-purple-900/20' : ''}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <div className="text-center space-y-4">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 flex items-center justify-center mx-auto ring-1 ring-white/10">
                                        <ImageIcon size={32} className="text-purple-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white">Add a Story Cover</h3>
                                        <p className="text-sm text-gray-400 max-w-xs mx-auto">Drag & drop your memorable photo here, or browse to upload.</p>
                                    </div>
                                    <NeonButton onClick={() => fileInputRef.current?.click()}>
                                        Browse Files
                                    </NeonButton>
                                    <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Preview (Simplified) */}
                        {preview && (
                            <div className="relative w-full h-full group bg-black">
                                <img
                                    src={preview}
                                    className="w-full h-full object-cover opacity-80"
                                    alt="Story Cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>

                                <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                                    <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white/80 border border-white/10">
                                        Cover Image
                                    </div>
                                    <button
                                        onClick={() => { setPreview(null); setOriginalFile(null); setStep('cover'); }}
                                        className="bg-black/40 hover:bg-red-500/20 hover:text-red-400 backdrop-blur-md p-2 rounded-full text-white/80 border border-white/10 transition-colors"
                                        title="Remove Image"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT PANEL: Content / Write */}
                    <div className="w-full lg:w-1/2 bg-[#0B0F1A] flex flex-col h-full overflow-y-auto">
                        <div className="flex-1 p-6 lg:p-10 space-y-8">

                            {/* Header / Language */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-1">Write Story</h2>
                                    <p className="text-xs text-gray-400">Share a memory that needs words.</p>
                                </div>
                                <div className="flex bg-white/5 p-1 rounded-xl">
                                    <button onClick={() => setLanguage('en')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'en' ? 'bg-cyan-500 text-white' : 'text-gray-400'}`}>EN</button>
                                    <button onClick={() => setLanguage('ta')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'ta' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>TA</button>
                                </div>
                            </div>

                            {/* Inputs */}
                            <div className="space-y-6">
                                <div>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => setTitle(e.target.value.slice(0, 100))}
                                        placeholder={isTamil ? "தலைப்பு..." : "Story Title..."}
                                        className="w-full bg-transparent text-3xl font-bold text-white placeholder-gray-600 border-none focus:outline-none focus:ring-0 p-0"
                                    />
                                    <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-cyan-500 mt-4 rounded-full opacity-50"></div>
                                </div>

                                <textarea
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    placeholder={isTamil ? "உங்கள் கதையை இங்கே எழுதுங்கள்..." : "Start writing your story here..."}
                                    className={`w-full min-h-[300px] bg-transparent text-lg text-gray-300 placeholder-gray-700 resize-none border-none focus:outline-none focus:ring-0 p-0 leading-relaxed ${isTamil ? 'font-tamil' : ''}`}
                                />
                            </div>
                        </div>

                        {/* Footer / Publish */}
                        <div className="p-6 border-t border-white/5 bg-[#080a12] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src={user.avatar_url} className="w-8 h-8 rounded-full border border-white/10" alt="Me" />
                                <span className="text-xs text-gray-400">Posting as <strong className="text-white">@{user.username}</strong></span>
                            </div>

                            <div className="flex gap-4 items-center">
                                {isPublishing && <span className="text-xs text-purple-400 animate-pulse">Publishing... {uploadProgress}%</span>}
                                <NeonButton
                                    onClick={handlePublish}
                                    isLoading={isPublishing}
                                    disabled={!title.trim() || !content.trim()}
                                    size="lg"
                                >
                                    Publish Story
                                </NeonButton>
                            </div>
                        </div>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};
