import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { NeonButton } from '../UI/NeonButton';

interface MemorialWelcomeProps {
    onFinish: () => void;
}

export const MemorialWelcome: React.FC<MemorialWelcomeProps> = ({ onFinish }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Sequence logic
        const s1 = setTimeout(() => setStep(1), 500); // Start silence
        const s2 = setTimeout(() => setStep(2), 2000); // Headline fade in
        const s3 = setTimeout(() => setStep(3), 4500); // Subtext fade in (1.5s after headline start?)
        const s4 = setTimeout(() => setStep(4), 8000); // CTA appear after pause

        return () => {
            clearTimeout(s1);
            clearTimeout(s2);
            clearTimeout(s3);
            clearTimeout(s4);
        };
    }, []);

    return (
        <div className="relative w-full min-h-[600px] flex flex-col items-center justify-center text-center overflow-hidden rounded-3xl">
            {/* Background Image - Golden Hour Road */}
            <div
                className="absolute inset-0 bg-[url('/images/dawn-hero.png')] bg-cover bg-[center_75%]"
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            </div>

            <div className="relative z-10 max-w-2xl px-6">
                <AnimatePresence>
                    {step >= 2 && (
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            className="text-4xl md:text-6xl font-serif text-white mb-8 leading-tight tracking-wide"
                        >
                            Some people don’t leave.<br />
                            They become memories we carry together.
                        </motion.h1>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {step >= 3 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        >
                            <p className="text-xl text-gray-200 mb-12 font-light leading-relaxed">
                                This space exists to remember, to feel, and to keep stories alive.<br />
                                You are now part of that remembering.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {step >= 4 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.5 }}
                        >
                            <button
                                onClick={onFinish}
                                className="group relative px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-full text-white font-medium tracking-widest transition-all duration-500 hover:tracking-[0.2em] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Walk Into the Memories
                                </span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div >
    );
};
