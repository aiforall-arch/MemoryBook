import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, UploadCloud, Image as ImageIcon, Sparkles, Maximize, Minimize, Square } from 'lucide-react';
import { NeonButton } from '../UI/NeonButton';
import { GlassCard } from '../UI/GlassCard';
import { ImageCropper, ASPECT_RATIOS, AspectRatioKey } from './ImageCropper';
import { UploadProgressBar } from './UploadProgressBar';
import { useToast } from '../UI/ToastNotification';
import imageCompression from 'browser-image-compression';

interface EnhancedUploadModalProps {
    onClose: () => void;
    onUpload: (file: File, caption: string) => Promise<void>;
}

export const EnhancedUploadModal: React.FC<EnhancedUploadModalProps> = ({ onClose, onUpload }) => {
    // File states
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);

    // Form states
    const [caption, setCaption] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatioKey | 'original'>('original');
    const [originalDimensions, setOriginalDimensions] = useState<{ width: number, height: number, ratio: number } | null>(null);

    // UI states
    const [isDragging, setIsDragging] = useState(false);
    const [step, setStep] = useState<'select' | 'crop' | 'caption'>('select');

    // Progress states
    const [isCompressing, setIsCompressing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadCancelled, setUploadCancelled] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const { showToast, ToastComponent } = useToast();

    // Set thumbnail background via ref to avoid JSX style prop linting
    useEffect(() => {
        if (thumbRef.current && croppedBlob) {
            thumbRef.current.style.backgroundImage = `url(${URL.createObjectURL(croppedBlob)})`;
        }
    }, [croppedBlob]);

    const MAX_CAPTION_LENGTH = 500;

    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    // File processing with compression
    const processFile = async (selectedFile: File) => {
        if (!selectedFile.type.startsWith('image/')) {
            showToast('Please upload an image file (JPG, PNG, WebP)', 'error');
            return;
        }

        let fileToProcess = selectedFile;

        // Compression for large files
        if (selectedFile.size > 1.2 * 1024 * 1024) {
            setIsCompressing(true);
            try {
                const options = {
                    maxSizeMB: 1.2,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                };
                console.log(`Original size: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`);
                fileToProcess = await imageCompression(selectedFile, options);
                console.log(`Compressed size: ${(fileToProcess.size / 1024 / 1024).toFixed(2)} MB`);
            } catch (error) {
                console.error('Compression error:', error);
                showToast('Compression failed, using original', 'error');
            } finally {
                setIsCompressing(false);
            }
        }

        setOriginalFile(fileToProcess);

        // Detect dimensions and create preview
        const img = new Image();
        img.onload = () => {
            const width = img.naturalWidth;
            const height = img.naturalHeight;
            const ratio = width / height;

            setOriginalDimensions({ width, height, ratio });
            setPreview(img.src);
            setStep('crop');
            setAspectRatio('original'); // Always default to original for "Rich experience"
        };
        img.src = URL.createObjectURL(fileToProcess);
    };

    // Handle crop completion
    const handleCropComplete = useCallback((blob: Blob) => {
        setCroppedBlob(blob);
    }, []);

    // Proceed to caption step
    const handleCropDone = () => {
        if (croppedBlob) {
            setStep('caption');
        }
    };

    // Final upload
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!croppedBlob) return;

        setIsUploading(true);
        setUploadProgress(0);
        setUploadCancelled(false);

        // Simulate progress (real progress would come from upload API)
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return prev;
                }
                return prev + Math.random() * 15;
            });
        }, 200);

        try {
            // Convert blob to File
            const croppedFile = new File([croppedBlob], `memory_${Date.now()}.jpg`, {
                type: 'image/jpeg',
            });

            if (uploadCancelled) {
                clearInterval(progressInterval);
                return;
            }

            await onUpload(croppedFile, caption);

            setUploadProgress(100);
            clearInterval(progressInterval);

            showToast('Memory captured successfully! 📸✨', 'success');

            // Close modal after short delay
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (err) {
            console.error('Upload error:', err);
            clearInterval(progressInterval);
            showToast('Failed to upload memory. Please try again.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    // Cancel upload
    const handleCancelUpload = () => {
        setUploadCancelled(true);
        setIsUploading(false);
        setUploadProgress(0);
        showToast('Upload cancelled', 'info');
    };

    // Go back to previous step
    const handleBack = () => {
        if (step === 'caption') setStep('crop');
        else if (step === 'crop') {
            setStep('select');
            setPreview(null);
            setOriginalFile(null);
            setCroppedBlob(null);
        }
    };

    // Reset when changing files
    const handleChangeFile = () => {
        setStep('select');
        setPreview(null);
        setOriginalFile(null);
        setCroppedBlob(null);
        fileInputRef.current?.click();
    };

    // Aspect ratio button config
    const aspectRatioButtons = [
        {
            key: 'original' as const,
            icon: <Sparkles size={16} />,
            label: 'Original',
            config: originalDimensions ? {
                label: 'Original',
                ratio: originalDimensions.ratio,
                width: originalDimensions.width > 1600 ? 1600 : originalDimensions.width,
                height: originalDimensions.width > 1600 ? 1600 / originalDimensions.ratio : originalDimensions.height
            } : null
        },
        { key: 'portrait' as const, icon: <Maximize className="rotate-90" size={16} />, label: 'Portrait' },
        { key: 'landscape' as const, icon: <Minimize className="rotate-90" size={16} />, label: 'Landscape' },
        { key: 'stories' as const, icon: <Maximize size={16} />, label: 'Stories' },
        { key: 'square' as const, icon: <Square size={16} />, label: 'Square' },
    ];

    const currentRatioConfig = aspectRatio === 'original'
        ? aspectRatioButtons[0].config
        : ASPECT_RATIOS[aspectRatio as AspectRatioKey];

    return (
        <>
            {ToastComponent}

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-[fadeIn_0.3s_ease-out] shadow-[0_0_100px_-20px_rgba(139,92,246,0.3)]">
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        title="Close upload modal"
                        className="absolute top-4 right-4 z-20 text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full"
                    >
                        <X size={20} />
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <UploadCloud size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                Add Memory <Sparkles className="text-yellow-400" size={18} />
                            </h2>
                            <p className="text-xs text-gray-400">
                                {step === 'select' && 'Choose an image to upload'}
                                {step === 'crop' && 'Style and frame your memory'}
                                {step === 'caption' && 'Describe the moment'}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Step 1: File Selection */}
                        {step === 'select' && (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`
                  relative w-full aspect-video border-2 border-dashed rounded-2xl 
                  flex flex-col items-center justify-center cursor-pointer transition-all duration-300
                  ${isDragging
                                        ? 'border-cyan-500 bg-cyan-500/10 scale-[1.02]'
                                        : 'border-white/10 hover:border-purple-500/50 hover:bg-white/5'
                                    }
                `}
                            >
                                {isCompressing ? (
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4" />
                                        <p className="text-white font-medium">Processing Image...</p>
                                        <p className="text-xs text-gray-400 mt-2">Preparing for the vault</p>
                                    </div>
                                ) : (
                                    <div className="text-center p-8">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6 shadow-inner">
                                            <ImageIcon size={40} className="text-gray-400" />
                                        </div>
                                        <p className="text-lg font-medium text-white mb-2">
                                            Drop your image here
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            or click to browse
                                        </p>
                                        <p className="text-xs text-gray-500 mt-4 font-bold tracking-widest uppercase">
                                            JPG, PNG, WebP up to 10MB
                                        </p>
                                    </div>
                                )}

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    title="Select image to upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                                />
                            </div>
                        )}

                        {/* Step 2: Cropping */}
                        {step === 'crop' && preview && (
                            <div className="space-y-6">
                                {/* Aspect Ratio Selector */}
                                <div className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                                    {aspectRatioButtons.map((btn) => (
                                        <button
                                            key={btn.key}
                                            type="button"
                                            onClick={() => setAspectRatio(btn.key)}
                                            className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-300
                        ${aspectRatio === btn.key
                                                    ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-purple-500/50 text-white shadow-lg'
                                                    : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                                }
                      `}
                                        >
                                            <span className={aspectRatio === btn.key ? 'text-cyan-400' : ''}>{btn.icon}</span>
                                            <span className="text-sm font-medium">{btn.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Image Cropper */}
                                {currentRatioConfig && (
                                    <ImageCropper
                                        imageSrc={preview}
                                        aspectRatio={currentRatioConfig as any}
                                        onCropComplete={handleCropComplete}
                                    />
                                )}

                                {/* Navigation */}
                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                    <button
                                        type="button"
                                        onClick={handleChangeFile}
                                        className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                    >
                                        Change image
                                    </button>
                                    <NeonButton type="button" onClick={handleCropDone} disabled={!croppedBlob}>
                                        Continue to Caption
                                    </NeonButton>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Caption */}
                        {step === 'caption' && (
                            <div className="space-y-6">
                                {/* Preview thumbnail */}
                                {croppedBlob && (
                                    <div className="flex gap-6 items-start p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <div
                                            ref={thumbRef}
                                            className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 shadow-xl bg-cover bg-center"
                                        />
                                        <div className="flex-1 pt-2">
                                            <p className="text-sm font-bold text-white mb-1 uppercase tracking-widest text-cyan-400">Ready to upload</p>
                                            <p className="text-xs text-gray-500">
                                                {aspectRatio === 'original' ? 'Original Fit' : (ASPECT_RATIOS as any)[aspectRatio].label}
                                                • High Quality Optimized
                                            </p>
                                            <div className="mt-4 flex gap-2">
                                                <div className="px-2 py-1 rounded bg-white/5 text-[10px] text-gray-400 border border-white/10">JPG</div>
                                                <div className="px-2 py-1 rounded bg-white/5 text-[10px] text-gray-400 border border-white/10">Optimized</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Caption input */}
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="text-sm font-bold text-gray-300 uppercase tracking-widest">
                                            Story Description
                                        </label>
                                        <span className={`text-[10px] font-bold transition-colors ${caption.length >= MAX_CAPTION_LENGTH * 0.9
                                            ? 'text-orange-400'
                                            : 'text-gray-500'
                                            }`}>
                                            {caption.length}/{MAX_CAPTION_LENGTH}
                                        </span>
                                    </div>
                                    <textarea
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION_LENGTH))}
                                        maxLength={MAX_CAPTION_LENGTH}
                                        placeholder="What makes this memory special? Share the story..."
                                        className="w-full h-32 bg-[#0B0F1A] border border-white/10 rounded-2xl p-4 text-white placeholder-gray-600
                      focus:outline-none focus:border-purple-500/50 focus:bg-white/5 transition-all resize-none shadow-inner"
                                        disabled={isUploading}
                                    />
                                </div>

                                {/* Progress bar */}
                                {isUploading && (
                                    <UploadProgressBar
                                        progress={uploadProgress}
                                        isVisible={isUploading}
                                        onCancel={handleCancelUpload}
                                        status={uploadProgress < 30 ? 'processing' : 'uploading'}
                                    />
                                )}

                                {/* Action buttons */}
                                {!isUploading && (
                                    <div className="flex justify-between pt-6 border-t border-white/5">
                                        <NeonButton variant="ghost" type="button" onClick={handleBack}>
                                            Back
                                        </NeonButton>
                                        <NeonButton
                                            variant="primary"
                                            type="submit"
                                            disabled={!croppedBlob}
                                            isLoading={isUploading}
                                        >
                                            Upload Memory
                                        </NeonButton>
                                    </div>
                                )}
                            </div>
                        )}
                    </form>
                </GlassCard>
            </div>
        </>
    );
};
