import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Camera, ZoomIn, ZoomOut, Trash2, Check, User } from 'lucide-react';
import { NeonButton } from '../UI/NeonButton';
import { GlassCard } from '../UI/GlassCard';
import { useToast } from '../UI/ToastNotification';
import imageCompression from 'browser-image-compression';

interface ProfilePictureUploaderProps {
    currentAvatarUrl?: string;
    onSave: (file: File) => Promise<void>;
    onRemove?: () => void;
    isOpen: boolean;
    onClose: () => void;
}

export const ProfilePictureUploader: React.FC<ProfilePictureUploaderProps> = ({
    currentAvatarUrl,
    onSave,
    onRemove,
    isOpen,
    onClose,
}) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { showToast, ToastComponent } = useToast();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    // Profile picture is always 1:1 (320x320 for Instagram standard)
    const OUTPUT_SIZE = 320;

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setPreview(null);
            setZoom(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen]);

    // Handle file selection
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        setIsProcessing(true);

        try {
            // Compress if needed
            let processedFile = file;
            if (file.size > 1 * 1024 * 1024) {
                processedFile = await imageCompression(file, {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 800,
                    useWebWorker: true,
                });
            }

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
                setZoom(1);
                setPosition({ x: 0, y: 0 });
            };
            reader.readAsDataURL(processedFile);
        } catch (error) {
            console.error('Error processing image:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        const maxOffset = (zoom - 1) * 50;
        const newX = Math.max(-maxOffset, Math.min(maxOffset, e.clientX - dragStart.x));
        const newY = Math.max(-maxOffset, Math.min(maxOffset, e.clientY - dragStart.y));
        setPosition({ x: newX, y: newY });
    }, [isDragging, dragStart, zoom]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Touch handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            setIsDragging(true);
            setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
        }
    };

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isDragging || e.touches.length !== 1) return;
        const touch = e.touches[0];
        const maxOffset = (zoom - 1) * 50;
        const newX = Math.max(-maxOffset, Math.min(maxOffset, touch.clientX - dragStart.x));
        const newY = Math.max(-maxOffset, Math.min(maxOffset, touch.clientY - dragStart.y));
        setPosition({ x: newX, y: newY });
    }, [isDragging, dragStart, zoom]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Global listeners
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleTouchEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

    // Generate cropped image and save
    const handleSave = async () => {
        if (!preview || !canvasRef.current || !imageRef.current) return;

        setIsSaving(true);

        try {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = OUTPUT_SIZE;
            canvas.height = OUTPUT_SIZE;

            const img = imageRef.current;
            const { naturalWidth, naturalHeight } = img;

            // Calculate crop area
            const size = Math.min(naturalWidth, naturalHeight);
            const sourceSize = size / zoom;

            const centerX = naturalWidth / 2;
            const centerY = naturalHeight / 2;

            const offsetX = (position.x / 50) * (sourceSize / 2);
            const offsetY = (position.y / 50) * (sourceSize / 2);

            const sx = centerX - sourceSize / 2 - offsetX;
            const sy = centerY - sourceSize / 2 - offsetY;

            // Draw circular clip
            ctx.beginPath();
            ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

            // Convert to file (JPEG for storage efficiency)
            canvas.toBlob(async (blob) => {
                if (blob) {
                    const file = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    await onSave(file);
                    onClose();
                }
            }, 'image/jpeg', 0.8);
        } catch (error) {
            console.error('Error saving profile picture:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Handle remove
    const handleRemove = () => {
        if (onRemove) {
            onRemove();
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            {ToastComponent}
            <GlassCard className="w-full max-w-md relative animate-[fadeIn_0.3s_ease-out]">
                {/* Close button */}
                <button
                    onClick={onClose}
                    title="Close"
                    className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                        <Camera size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Profile Picture</h2>
                        <p className="text-xs text-gray-400">
                            {preview ? 'Adjust your photo' : 'Upload a new photo'}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {/* Preview area */}
                    <div className="flex justify-center">
                        <div
                            className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white/10 cursor-move bg-[#0B0F1A]"
                            onClick={() => !preview && fileInputRef.current?.click()}
                            onMouseDown={preview ? handleMouseDown : undefined}
                            onTouchStart={preview ? handleTouchStart : undefined}
                        >
                            {isProcessing ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
                                </div>
                            ) : preview ? (
                                <img
                                    ref={imageRef}
                                    src={preview}
                                    alt="Preview"
                                    className="w-full h-full object-cover pointer-events-none"
                                    style={{
                                        transform: `scale(${zoom}) translate(${position.x / zoom}%, ${position.y / zoom}%)`,
                                        transformOrigin: 'center',
                                    }}
                                    draggable={false}
                                />
                            ) : currentAvatarUrl ? (
                                <img
                                    src={currentAvatarUrl}
                                    alt="Current avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                    <User size={48} className="mb-2" />
                                    <span className="text-xs">Click to upload</span>
                                </div>
                            )}

                            {/* Overlay ring */}
                            <div className="absolute inset-0 rounded-full border-2 border-white/20 pointer-events-none" />
                        </div>
                    </div>

                    {/* Zoom controls (only when preview exists) */}
                    {preview && (
                        <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setZoom(prev => Math.max(1, prev - 0.2))}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                title="Zoom out"
                            >
                                <ZoomOut size={18} />
                            </button>

                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.01}
                                value={zoom}
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="w-32 h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                  [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-cyan-500
                  [&::-webkit-slider-thumb]:cursor-pointer"
                                title="Zoom"
                            />

                            <button
                                type="button"
                                onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                title="Zoom in"
                            >
                                <ZoomIn size={18} />
                            </button>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-4 border-t border-white/10">
                        {preview ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setPreview(null)}
                                    className="flex-1 py-2 px-4 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <NeonButton
                                    onClick={handleSave}
                                    isLoading={isSaving}
                                    className="flex-1"
                                >
                                    <Check size={18} />
                                    Apply
                                </NeonButton>
                            </>
                        ) : (
                            <>
                                {currentAvatarUrl && onRemove && (
                                    <button
                                        type="button"
                                        onClick={handleRemove}
                                        className="flex items-center justify-center gap-2 flex-1 py-2 px-4 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                                    >
                                        <Trash2 size={16} />
                                        Remove
                                    </button>
                                )}
                                <NeonButton
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1"
                                >
                                    <Camera size={18} />
                                    Upload Photo
                                </NeonButton>
                            </>
                        )}
                    </div>
                </div>

                {/* Hidden elements */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                    title="Select profile picture"
                />
                <canvas ref={canvasRef} className="hidden" />
            </GlassCard>
        </div>
    );
};
