import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';

// Instagram aspect ratios
export const ASPECT_RATIOS = {
    portrait: { label: 'Portrait', ratio: 4 / 5, width: 1080, height: 1350 },
    landscape: { label: 'Landscape', ratio: 1.91 / 1, width: 1080, height: 566 },
    stories: { label: 'Stories', ratio: 9 / 16, width: 1080, height: 1920 },
    square: { label: 'Square', ratio: 1, width: 1080, height: 1080 },
} as const;

export type AspectRatioKey = keyof typeof ASPECT_RATIOS;

interface ImageCropperProps {
    imageSrc: string;
    aspectRatio: AspectRatioKey;
    onCropComplete: (croppedBlob: Blob) => void;
    className?: string;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
    imageSrc,
    aspectRatio,
    onCropComplete,
    className = '',
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });

    const ratioConfig = ASPECT_RATIOS[aspectRatio];
    const outputWidth = ratioConfig.width;
    const outputHeight = ratioConfig.height;

    // Reset position when aspect ratio changes
    useEffect(() => {
        setPosition({ x: 0, y: 0 });
        setZoom(1);
    }, [aspectRatio]);

    // Handle image load
    const handleImageLoad = useCallback(() => {
        if (imageRef.current) {
            setImageNaturalSize({
                width: imageRef.current.naturalWidth,
                height: imageRef.current.naturalHeight,
            });
            setImageLoaded(true);
        }
    }, []);

    // Calculate minimum zoom to cover the frame
    const getMinZoom = useCallback(() => {
        if (!imageNaturalSize.width || !imageNaturalSize.height) return 1;

        const containerAspect = ratioConfig.ratio;
        const imageAspect = imageNaturalSize.width / imageNaturalSize.height;

        if (imageAspect > containerAspect) {
            // Image is wider - scale to match height
            return 1;
        } else {
            // Image is taller - scale to match width
            return containerAspect / imageAspect;
        }
    }, [imageNaturalSize, ratioConfig.ratio]);

    // Clamp position to keep image within bounds
    const clampPosition = useCallback((pos: { x: number; y: number }, currentZoom: number) => {
        const minZoom = getMinZoom();
        const effectiveZoom = Math.max(currentZoom, minZoom);

        // Calculate how much the image extends beyond each edge
        const maxX = Math.max(0, (effectiveZoom - 1) * 50);
        const maxY = Math.max(0, (effectiveZoom - 1) * 50);

        return {
            x: Math.max(-maxX, Math.min(maxX, pos.x)),
            y: Math.max(-maxY, Math.min(maxY, pos.y)),
        };
    }, [getMinZoom]);

    // Mouse/touch handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        const newPos = {
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        };
        setPosition(clampPosition(newPos, zoom));
    }, [isDragging, dragStart, zoom, clampPosition]);

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
        const newPos = {
            x: touch.clientX - dragStart.x,
            y: touch.clientY - dragStart.y,
        };
        setPosition(clampPosition(newPos, zoom));
    }, [isDragging, dragStart, zoom, clampPosition]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Global mouse/touch listeners
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

    // Wheel zoom
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const minZoom = getMinZoom();
        const newZoom = Math.max(minZoom, Math.min(3, zoom + delta));
        setZoom(newZoom);
        setPosition(clampPosition(position, newZoom));
    };

    // Slider zoom
    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newZoom = parseFloat(e.target.value);
        setZoom(newZoom);
        setPosition(clampPosition(position, newZoom));
    };

    // Generate cropped image
    const generateCrop = useCallback(() => {
        if (!canvasRef.current || !imageRef.current || !imageLoaded) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = outputWidth;
        canvas.height = outputHeight;

        const img = imageRef.current;
        const { naturalWidth, naturalHeight } = img;

        // Calculate the visible portion of the image
        const containerAspect = ratioConfig.ratio;
        const imageAspect = naturalWidth / naturalHeight;

        let drawWidth: number, drawHeight: number;

        if (imageAspect > containerAspect) {
            drawHeight = naturalHeight;
            drawWidth = naturalHeight * containerAspect;
        } else {
            drawWidth = naturalWidth;
            drawHeight = naturalWidth / containerAspect;
        }

        // Apply zoom
        drawWidth /= zoom;
        drawHeight /= zoom;

        // Calculate offset based on position (position is in percentage of overflow)
        const maxOffsetX = (naturalWidth - drawWidth) / 2;
        const maxOffsetY = (naturalHeight - drawHeight) / 2;

        const offsetX = (naturalWidth - drawWidth) / 2 - (position.x / 50) * maxOffsetX;
        const offsetY = (naturalHeight - drawHeight) / 2 - (position.y / 50) * maxOffsetY;

        // Draw the cropped image
        ctx.drawImage(
            img,
            offsetX, offsetY, drawWidth, drawHeight,
            0, 0, outputWidth, outputHeight
        );

        canvas.toBlob((blob) => {
            if (blob) {
                onCropComplete(blob);
            }
        }, 'image/jpeg', 0.92);
    }, [imageLoaded, zoom, position, outputWidth, outputHeight, ratioConfig.ratio, onCropComplete]);

    // Auto-generate crop when position/zoom changes
    useEffect(() => {
        if (imageLoaded) {
            const timeoutId = setTimeout(() => {
                generateCrop();
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [imageLoaded, zoom, position, generateCrop]);

    const minZoom = getMinZoom();

    return (
        <div className={`flex flex-col gap-4 ${className}`}>
            {/* Cropper Container */}
            <div
                ref={containerRef}
                className="relative overflow-hidden rounded-xl bg-black/50 cursor-move select-none"
                style={{
                    aspectRatio: `${ratioConfig.ratio}`,
                    maxHeight: aspectRatio === 'stories' ? '400px' : 'none',
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onWheel={handleWheel}
            >
                {/* Image */}
                <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="Crop preview"
                    onLoad={handleImageLoad}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{
                        objectFit: 'cover',
                        transform: `scale(${zoom}) translate(${position.x / zoom}%, ${position.y / zoom}%)`,
                        transformOrigin: 'center',
                    }}
                    draggable={false}
                />

                {/* Drag indicator */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                    <div className="bg-black/50 rounded-full p-3">
                        <Move className="text-white" size={24} />
                    </div>
                </div>

                {/* Grid overlay */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                        {[...Array(9)].map((_, i) => (
                            <div key={i} className="border border-white/10" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-3 px-2">
                <button
                    type="button"
                    onClick={() => {
                        const newZoom = Math.max(minZoom, zoom - 0.2);
                        setZoom(newZoom);
                        setPosition(clampPosition(position, newZoom));
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Zoom out"
                >
                    <ZoomOut size={18} />
                </button>

                <input
                    type="range"
                    min={minZoom}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={handleZoomChange}
                    className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
            [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-cyan-500
            [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                    title="Zoom level"
                />

                <button
                    type="button"
                    onClick={() => {
                        const newZoom = Math.min(3, zoom + 0.2);
                        setZoom(newZoom);
                        setPosition(clampPosition(position, newZoom));
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Zoom in"
                >
                    <ZoomIn size={18} />
                </button>

                <span className="text-xs text-gray-500 w-12 text-right">{Math.round(zoom * 100)}%</span>
            </div>

            {/* Hidden canvas for cropping */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};
