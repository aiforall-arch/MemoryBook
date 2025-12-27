import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap, BookOpen, UserPlus } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { NeonButton } from '../UI/NeonButton';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface Step4Props {
    data: any;
    onFinish: () => void;
}

export const Step4Welcome: React.FC<Step4Props> = ({ data, onFinish }) => {
    const [animationState, setAnimationState] = useState<'vault' | 'success'>('vault');
    const [tooltipIndex, setTooltipIndex] = useState(0);

    const TOOLTIPS = [
        {
            target: "add-memory",
            text: "Tap here to add more memories anytime 📸",
            icon: <Zap className="text-yellow-500" />
        },
        {
            target: "feed",
            text: "Your friends' moments will appear here 🌍",
            icon: <BookOpen className="text-cyan-500" />
        },
        {
            target: "stories",
            text: "Stories live here for 24 hours 📖",
            icon: <UserPlus className="text-purple-500" />
        }
    ];

    useEffect(() => {
        // Launch initial confetti
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#8B5CF6', '#22D3EE', '#F472B6']
        });

        // Transition from vault animation to success screen
        const timer = setTimeout(() => setAnimationState('success'), 2500);
        return () => clearTimeout(timer);
    }, []);

    const handleNextTooltip = () => {
        if (tooltipIndex < TOOLTIPS.length - 1) {
            setTooltipIndex(prev => prev + 1);
        } else {
            onFinish();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
            <AnimatePresence mode="wait">
                {animationState === 'vault' ? (
                    <motion.div
                        key="vault"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.2, opacity: 0 }}
                        className="relative"
                    >
                        {/* Vault Opening Animation (SVG/CSS) */}
                        <div className="w-64 h-64 relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-3xl animate-pulse blur-2xl" />
                            <svg viewBox="0 0 200 200" className="w-full h-full text-white">
                                <motion.circle
                                    cx="100" cy="100" r="80"
                                    fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="502.4"
                                    initial={{ strokeDashoffset: 502.4 }}
                                    animate={{ strokeDashoffset: 0 }}
                                    transition={{ duration: 1.5, ease: "easeInOut" }}
                                />
                                <motion.path
                                    d="M60 100 L140 100 M100 60 L100 140"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.5, duration: 0.5 }}
                                />
                                <motion.rect
                                    x="70" y="70" width="60" height="60" rx="10"
                                    fill="none" stroke="currentColor" strokeWidth="2"
                                    initial={{ rotate: -45, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    transition={{ delay: 1, duration: 1 }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.5 }}
                                    className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400"
                                >
                                    Access Granted
                                </motion.div>
                            </div>
                        </div>
                        <h3 className="mt-8 text-2xl font-bold text-white uppercase tracking-widest italic animate-pulse">Initializing Your Vault...</h3>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-lg space-y-8"
                    >
                        <div className="space-y-4">
                            <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                                <ShieldCheck size={40} className="text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-4xl font-extrabold text-white tracking-tight">You're in! 🎉</h2>
                                <p className="text-cyan-400 font-bold uppercase tracking-widest text-xs mt-2">Welcome to your Legacy Vault</p>
                            </div>
                        </div>

                        {/* Founding Memory Card Preview */}
                        <div className="relative group perspective-1000 max-w-sm mx-auto">
                            <GlassCard className="overflow-hidden border-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.2)] transform transition-transform group-hover:scale-[1.02]">
                                <div className="aspect-square relative">
                                    {data.firstMemory.photoUrl && (
                                        <img src={data.firstMemory.photoUrl} alt="First Memory" className="w-full h-full object-cover" />
                                    )}
                                    <div className="absolute top-3 left-3">
                                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-cyan-400 text-[10px] font-bold uppercase tracking-widest">
                                            Founding Memory ⚡
                                        </span>
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                        <p className="text-white text-sm line-clamp-2 italic">"{data.firstMemory.caption}"</p>
                                    </div>
                                </div>
                            </GlassCard>
                            <div className="absolute -top-4 -right-4 p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-xl transform rotate-12">
                                <Sparkles className="text-white" size={24} />
                            </div>
                        </div>

                        {/* Tutorial Feature */}
                        <div className="relative p-6 rounded-2xl bg-white/5 border border-white/10 text-left space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                    {TOOLTIPS[tooltipIndex].icon}
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vault Tutorial ({tooltipIndex + 1}/{TOOLTIPS.length})</p>
                                    <p className="text-white font-medium text-sm">{TOOLTIPS[tooltipIndex].text}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {TOOLTIPS.map((_, i) => (
                                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= tooltipIndex ? 'bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-white/10'}`} />
                                ))}
                            </div>
                        </div>

                        <NeonButton
                            onClick={handleNextTooltip}
                            className="w-full group"
                        >
                            {tooltipIndex === TOOLTIPS.length - 1 ? "Explore My Vault" : "Next Tip"}
                            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                        </NeonButton>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
