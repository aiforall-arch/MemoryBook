import React from 'react';
import { X } from 'lucide-react';

interface UploadProgressBarProps {
    progress: number; // 0-100
    isVisible: boolean;
    onCancel: () => void;
    status?: 'uploading' | 'processing' | 'compressing';
}

export const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
    progress,
    isVisible,
    onCancel,
    status = 'uploading',
}) => {
    if (!isVisible) return null;

    const statusLabels = {
        uploading: 'Uploading memory...',
        processing: 'Processing image...',
        compressing: 'Compressing image...',
    };

    return (
        <div className="w-full space-y-3">
            {/* Status text */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    {statusLabels[status]}
                </span>
                <span className="text-gray-400 font-mono">{Math.round(progress)}%</span>
            </div>

            {/* Progress bar container */}
            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />

                {/* Progress fill */}
                <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                >
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 blur-sm opacity-60" />
                </div>

                {/* Moving highlight */}
                <div
                    className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-progress-shine"
                    style={{ left: `${Math.max(0, progress - 20)}%` }}
                />
            </div>

            {/* Cancel button */}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-red-400 
            bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    <X size={14} />
                    Cancel Upload
                </button>
            </div>
        </div>
    );
};
