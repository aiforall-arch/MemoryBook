import React from 'react';
import { NeonButton } from '../UI/NeonButton';

export const MemorialHero = () => {
    return (
        <div className="relative rounded-3xl overflow-hidden mb-12 min-h-[400px] flex items-center justify-center text-center">
            {/* Background - Deep/Serene */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 z-10 opacity-90"></div>
            <div className="absolute inset-0 bg-[url('/images/twilight-hero.png')] bg-cover bg-center opacity-40"></div>

            <div className="relative z-20 max-w-4xl px-6">
                <h1 className="text-4xl md:text-5xl font-serif font-medium text-white mb-6 tracking-wide leading-tight">
                    Some friendships don’t end.<br />
                    <span className="text-purple-200/90 italic">They become places we return to.</span>
                </h1>

                <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto mb-8"></div>

                <p className="text-lg text-gray-300/90 mb-10 leading-relaxed font-light tracking-wider uppercase text-xs md:text-sm">
                    Capture the moments that matter • Shared quietly • Kept forever
                </p>

                <div className="flex gap-4 justify-center">
                    <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all font-light tracking-widest uppercase">
                        Explore the Vault
                    </button>
                </div>
            </div>
        </div>
    );
};
