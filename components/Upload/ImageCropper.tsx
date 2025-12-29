import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';

// Custom aspect ratio type to allow dynamic configurations
export interface CustomAspectRatio {
    label: string;
    ratio: number;
    width: number;
    height: number;
}

// Instagram aspect ratios
export const ASPECT_RATIOS = {
    portrait: { label: 'Portrait', ratio: 4 / 5, width: 900, height: 1125 },
    landscape: { label: 'Landscape', ratio: 1.91 / 1, width: 900, height: 471 },
    stories: { label: 'Stories', ratio: 9 / 16, width: 720, height: 1280 },
    square: { label: 'Square', ratio: 1, width: 900, height: 900 },
    original: { label: 'Original', ratio: 1, width: 900, height: 900 } // Placeholder, will be updated dynamically
} as const;

export type AspectRatioKey = keyof typeof ASPECT_RATIOS;

interface ImageCropperProps {
    imageSrc: string;
    aspectRatio: AspectRatioKey | CustomAspectRatio;
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

    const ratioConfig = typeof aspectRatio === 'string' ? ASPECT_RATIOS[aspectRatio] : aspectRatio;
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

    // Calculate minimum zoom to cover the frame (Cover mode)
    const getCoverZoom = useCallback(() => {
        if (!imageNaturalSize.width || !imageNaturalSize.height) return 1;

        const containerAspect = ratioConfig.ratio;
        const imageAspect = imageNaturalSize.width / imageNaturalSize.height;

        if (imageAspect > containerAspect) {
            // Image is wider than container - height matches, width exceeds
            return 1;
        } else {
            // Image is taller than container - width matches, height exceeds
            return containerAspect / imageAspect;
        }
    }, [imageNaturalSize, ratioConfig.ratio]);

    // Calculate zoom to fit entirely (Contain mode)
    const getContainZoom = useCallback(() => {
        if (!imageNaturalSize.width || !imageNaturalSize.height) return 1;

        const containerAspect = ratioConfig.ratio;
        const imageAspect = imageNaturalSize.width / imageNaturalSize.height;

        if (imageAspect > containerAspect) {
            // Image is wider - width matches, height has space
            return containerAspect / imageAspect;
        } else {
            // Image is taller - height matches, width has space
            return 1;
        }
    }, [imageNaturalSize, ratioConfig.ratio]);

    // Clamp position to keep image within bounds
    const clampPosition = useCallback((pos: { x: number; y: number }, currentZoom: number) => {
        const coverZoom = getCoverZoom();

        // If zoom is less than cover zoom, we have "contain" bars, so it's easier to keep it centered
        if (currentZoom < coverZoom) {
            return { x: 0, y: 0 };
        }

        // Calculate how much the image extends beyond each edge in percentage units
        // currentZoom of 1 means image fits the "shorter" dimension of the container
        const maxX = Math.max(0, (currentZoom - 1) * 50);
        const maxY = Math.max(0, (currentZoom - coverZoom) * 50);

        return {
            x: Math.max(-maxX, Math.min(maxX, pos.x)),
            y: Math.max(-maxY, Math.min(maxY, pos.y)),
        };
    }, [getCoverZoom]);

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
        const minZoom = 0.5; // Allow zooming out more for flexibility
        const newZoom = Math.max(minZoom, Math.min(4, zoom + delta));
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

        // Background color for bars if contained
        ctx.fillStyle = '#111827'; // slate-900 match
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const img = imageRef.current;
        const { naturalWidth, naturalHeight } = img;

        // Fundamental logic: Container has ratio R. Image has ratio I.
        const containerAspect = ratioConfig.ratio;
        const imageAspect = naturalWidth / naturalHeight;

        let sourceWidth, sourceHeight;

        if (imageAspect > containerAspect) {
            // Image is wider: Height is the limiting factor for "fit"
            sourceHeight = naturalHeight;
            sourceWidth = naturalHeight * containerAspect;
        } else {
            // Image is taller: Width is the limiting factor for "fit"
            sourceWidth = naturalWidth;
            sourceHeight = naturalWidth / containerAspect;
        }

        // Apply Zoom (Invert since we're scaling the "window")
        sourceWidth /= zoom;
        sourceHeight /= zoom;

        // Calculate offset based on position
        // position.x is -50 to 50 (percentage of overflow)
        const maxOffsetX = Math.max(0, (naturalWidth - sourceWidth) / 2);
        const maxOffsetY = Math.max(0, (naturalHeight - sourceHeight) / 2);

        const offsetX = (naturalWidth - sourceWidth) / 2 - (position.x / 50) * maxOffsetX;
        const offsetY = (naturalHeight - sourceHeight) / 2 - (position.y / 50) * maxOffsetY;

        // Draw it
        ctx.drawImage(
            img,
            offsetX, offsetY, sourceWidth, sourceHeight,
            0, 0, outputWidth, outputHeight
        );

        canvas.toBlob((blob) => {
            if (blob) {
                onCropComplete(blob);
            }
        }, 'image/jpeg', 0.85);
    }, [imageLoaded, zoom, position, outputWidth, outputHeight, ratioConfig.ratio, onCropComplete]);

    // Auto-generate crop when position/zoom changes (debounced for performance)
    useEffect(() => {
        if (imageLoaded) {
            const timeoutId = setTimeout(() => {
                generateCrop();
            }, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [imageLoaded, zoom, position, generateCrop]);

    const minZoom = 0.5;

    return (
        <div className={`flex flex-col gap-4 ${className}`}>
            {/* Cropper Container */}
            <div
                ref={containerRef}
                className="relative overflow-hidden rounded-xl bg-[#0B0F1A] cursor-move select-none border border-white/5 shadow-2xl"
                style={{
                    aspectRatio: `${ratioConfig.ratio}`,
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
                        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                    }}
                    draggable={false}
                />

                {/* Drag indicator */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                    <div className="bg-black/50 backdrop-blur-md rounded-full p-4 border border-white/10">
                        <Move className="text-white" size={32} />
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

            {/* Slider Controls */}
            <div className="flex items-center gap-4 px-2 py-3 bg-white/5 rounded-2xl border border-white/10">
                <button
                    type="button"
                    onClick={() => {
                        const newZoom = Math.max(minZoom, zoom - 0.2);
                        setZoom(newZoom);
                        setPosition(clampPosition(position, newZoom));
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all shadow-lg"
                    title="Zoom out"
                >
                    <ZoomOut size={20} />
                </button>

                <div className="flex-1 relative group">
                    <input
                        type="range"
                        min={minZoom}
                        max={4}
                        step={0.01}
                        value={zoom}
                        onChange={handleZoomChange}
                        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-grab active:cursor-grabbing
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-cyan-500
                [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/20
                [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                        title="Zoom level"
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 rounded lg text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-bold tracking-tighter">
                        {Math.round(zoom * 100)}%
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        const newZoom = Math.min(4, zoom + 0.2);
                        setZoom(newZoom);
                        setPosition(clampPosition(position, newZoom));
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all shadow-lg"
                    title="Zoom in"
                >
                    <ZoomIn size={20} />
                </button>
            </div>

            {/* Hidden canvas for cropping */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};
