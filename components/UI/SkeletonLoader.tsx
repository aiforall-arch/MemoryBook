import React from 'react';

interface SkeletonLoaderProps {
    count?: number;
    type?: 'post' | 'story' | 'comment';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ count = 3, type = 'post' }) => {
    const Skeletons = Array.from({ length: count });

    if (type === 'story') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {Skeletons.map((_, i) => (
                    <div
                        key={i}
                        className="glass-panel rounded-2xl h-80 animate-pulse bg-white/5 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5" />
                        <div className="absolute bottom-0 left-0 w-full p-6 space-y-3">
                            <div className="h-6 w-3/4 bg-white/10 rounded-lg" />
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/10" />
                                <div className="h-4 w-24 bg-white/10 rounded-lg" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'comment') {
        return (
            <div className="space-y-4">
                {Skeletons.map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-9 h-9 rounded-full bg-white/5" />
                        <div className="flex-1 bg-white/5 rounded-2xl rounded-tl-sm p-3 h-16" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {Skeletons.map((_, i) => (
                <div
                    key={i}
                    className="glass-panel rounded-3xl overflow-hidden animate-pulse bg-white/5 h-96 relative"
                >
                    <div className="absolute inset-x-6 top-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10" />
                        <div className="h-4 w-32 bg-white/10 rounded-lg" />
                    </div>
                    <div className="absolute inset-x-6 bottom-6 space-y-3">
                        <div className="h-4 w-full bg-white/10 rounded-lg" />
                        <div className="h-4 w-2/3 bg-white/10 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
};
