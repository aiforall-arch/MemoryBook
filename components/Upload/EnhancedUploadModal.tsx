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
    const [aspectRatio, setAspectRatio] = useState<AspectRatioKey>('portrait');

    // UI states
    const [isDragging, setIsDragging] = useState(false);
    const [step, setStep] = useState<'select' | 'crop' | 'caption'>('select');

    // Progress states
    const [isCompressing, setIsCompressing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadCancelled, setUploadCancelled] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast, ToastComponent } = useToast();

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
        if (selectedFile.size > 1.5 * 1024 * 1024) {
            setIsCompressing(true);
            try {
                const options = {
                    maxSizeMB: 1.5,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                };
                console.log(`Original size: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`);
                fileToProcess = await imageCompression(selectedFile, options);
                console.log(`Compressed size: ${(fileToProcess.size / 1024 / 1024).toFixed(2)} MB`);
                showToast('Image compressed for optimal quality', 'info');
            } catch (error) {
                console.error('Compression error:', error);
                showToast('Compression failed, using original', 'error');
            } finally {
                setIsCompressing(false);
            }
        }

        setOriginalFile(fileToProcess);

        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
            setStep('crop');
        };
        reader.readAsDataURL(fileToProcess);
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
    const aspectRatioButtons: { key: AspectRatioKey; icon: React.ReactNode; label: string }[] = [
        { key: 'portrait', icon: <Maximize className="rotate-90" size={16} />, label: 'Portrait' },
        { key: 'landscape', icon: <Minimize className="rotate-90" size={16} />, label: 'Landscape' },
        { key: 'stories', icon: <Maximize size={16} />, label: 'Stories' },
        { key: 'square', icon: <Square size={16} />, label: 'Square' },
    ];

    return (
        <>
            {ToastComponent}

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-[fadeIn_0.3s_ease-out]">
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        title="Close upload modal"
                        className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                            <UploadCloud size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                Add Memory <Sparkles className="text-yellow-400" size={18} />
                            </h2>
                            <p className="text-xs text-gray-400">
                                {step === 'select' && 'Choose an image to upload'}
                                {step === 'crop' && 'Adjust your image'}
                                {step === 'caption' && 'Add a caption'}
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
                  relative w-full aspect-video border-2 border-dashed rounded-xl 
                  flex flex-col items-center justify-center cursor-pointer transition-all duration-300
                  ${isDragging
                                        ? 'border-cyan-500 bg-cyan-500/10 scale-[1.02]'
                                        : 'border-gray-600 hover:border-purple-500 hover:bg-white/5'
                                    }
                `}
                            >
                                {isCompressing ? (
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4" />
                                        <p className="text-white font-medium">Compressing Image...</p>
                                        <p className="text-xs text-gray-400 mt-2">Making it lean and mean</p>
                                    </div>
                                ) : (
                                    <div className="text-center p-8">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                                            <ImageIcon size={40} className="text-gray-400" />
                                        </div>
                                        <p className="text-lg font-medium text-white mb-2">
                                            Drop your image here
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            or click to browse
                                        </p>
                                        <p className="text-xs text-gray-500 mt-4">
                                            JPG, PNG, WebP up to 10MB
                                        </p>
                                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                            <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
                                                Auto-compression Active
                                            </span>
                                        </div>
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
                            <div className="space-y-4">
                                {/* Aspect Ratio Selector */}
                                <div className="flex flex-wrap gap-2">
                                    {aspectRatioButtons.map(({ key, icon, label }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setAspectRatio(key)}
                                            className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl border transition-all
                        ${aspectRatio === key
                                                    ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-purple-500/50 text-white'
                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                                                }
                      `}
                                        >
                                            {icon}
                                            <span className="text-sm">{label}</span>
                                            <span className="text-xs text-gray-500">
                                                {ASPECT_RATIOS[key].width}×{ASPECT_RATIOS[key].height}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Image Cropper */}
                                <ImageCropper
                                    imageSrc={preview}
                                    aspectRatio={aspectRatio}
                                    onCropComplete={handleCropComplete}
                                />

                                {/* Navigation */}
                                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={handleChangeFile}
                                        className="text-sm text-gray-400 hover:text-white transition-colors"
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
                                    <div className="flex gap-4 items-start">
                                        <div
                                            className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border border-white/10"
                                            style={{
                                                backgroundImage: `url(${URL.createObjectURL(croppedBlob)})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center'
                                            }}
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-400 mb-1">Ready to upload</p>
                                            <p className="text-xs text-gray-500">
                                                {ASPECT_RATIOS[aspectRatio].label} • {ASPECT_RATIOS[aspectRatio].width}×{ASPECT_RATIOS[aspectRatio].height}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Caption input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Caption
                                    </label>
                                    <textarea
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION_LENGTH))}
                                        maxLength={MAX_CAPTION_LENGTH}
                                        placeholder="What's the story behind this moment?"
                                        className="w-full h-32 bg-[#0B0F1A] border border-white/10 rounded-xl p-4 text-white 
                      focus:outline-none focus:border-purple-500 transition-colors resize-none"
                                        disabled={isUploading}
                                    />
                                    <div className="flex justify-between mt-2">
                                        <span className="text-xs text-gray-500">
                                            Add some hashtags for discoverability
                                        </span>
                                        <span className={`text-xs transition-colors ${caption.length >= MAX_CAPTION_LENGTH * 0.9
                                                ? 'text-orange-400'
                                                : 'text-gray-500'
                                            }`}>
                                            {caption.length}/{MAX_CAPTION_LENGTH}
                                        </span>
                                    </div>
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
                                    <div className="flex justify-between pt-4 border-t border-white/10">
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
