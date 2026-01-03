import React from 'react';
import { NeonButton } from '../UI/NeonButton';

export const MemorialHero = () => {
    return (
        <div className="relative rounded-3xl overflow-hidden mb-12 min-h-[450px] flex items-center justify-center text-center">
            {/* Background - Sunset */}
            <div className="absolute inset-0 bg-black/20 z-10"></div>
            <div className="absolute inset-0 bg-[url('/images/sunset-hero.png')] bg-cover bg-[center_75%]"></div>

            <div className="relative z-20 max-w-4xl px-6 py-12 m-8 rounded-2xl bg-black/10 backdrop-blur-sm border border-white/5 shadow-2xl">
                <h1 className="text-4xl md:text-5xl font-serif font-medium text-white mb-6 tracking-wide leading-tight">
                    Some friendships don’t end.<br />
                    <span className="text-purple-200/90 italic">They become places we return to.</span>
                </h1>

                <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto mb-8"></div>

                <p className="text-lg text-gray-300/90 mb-10 leading-relaxed font-light tracking-wider uppercase text-xs md:text-sm">
                    Capture the moments that matter • Shared quietly • Kept forever
                </p>

                <div className="flex gap-4 justify-center">
                    <button className="px-8 py-3 bg-white/10 border border-white/20 rounded-full text-sm text-white hover:bg-white/20 transition-all font-light tracking-widest uppercase backdrop-blur-sm hover:tracking-[0.2em] duration-500">
                        Explore the Vault
                    </button>
                </div>
            </div>
        </div>
    );
};
