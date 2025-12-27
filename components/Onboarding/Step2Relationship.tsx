import React, { useEffect } from 'react';
import { Users, Heart, MessageCircle } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { NeonButton } from '../UI/NeonButton';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface Step2Props {
    data: any;
    updateData: (updates: any) => void;
    onNext: () => void;
    onBack: () => void;
}

export const Step2Relationship: React.FC<Step2Props> = ({ data, updateData, onNext, onBack }) => {

    const toggleTag = (tag: string) => {
        const current = data.relationshipTags || [];
        let updated;

        if (current.includes(tag)) {
            updated = current.filter((t: string) => t !== tag);
        } else {
            updated = [...current, tag];
            // Celebrate first selection
            if (current.length === 0) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#8B5CF6', '#EC4899', '#22D3EE']
                });
            }
        }

        updateData({ relationshipTags: updated });
    };

    const isFriend = data.relationshipTags.includes('friend');
    const isFamily = data.relationshipTags.includes('family');
    const canContinue = data.relationshipTags.length > 0;

    return (
        <div className="space-y-8 max-w-xl mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-white tracking-tight">How do you know Nazir?</h2>
                <p className="text-gray-400 text-sm italic">Sharing your bond helps customize your vault</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={() => toggleTag('friend')}
                    className={`
                        p-6 rounded-2xl border-2 text-left transition-all duration-300 group
                        ${isFriend
                            ? 'bg-purple-500/10 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)] scale-[1.02]'
                            : 'bg-white/5 border-dashed border-white/10 hover:border-purple-500/50 hover:bg-white/10'
                        }
                    `}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${isFriend ? 'bg-purple-500' : 'bg-white/10'}`}>
                        <Users size={24} className={isFriend ? 'text-white' : 'text-gray-400'} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">🤝 Friend</h3>
                    <p className="text-sm text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors">
                        "We share laughs and moments that define our journey."
                    </p>
                </button>

                <button
                    onClick={() => toggleTag('family')}
                    className={`
                        p-6 rounded-2xl border-2 text-left transition-all duration-300 group
                        ${isFamily
                            ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_30px_rgba(34,211,238,0.3)] scale-[1.02]'
                            : 'bg-white/5 border-dashed border-white/10 hover:border-cyan-500/50 hover:bg-white/10'
                        }
                    `}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${isFamily ? 'bg-cyan-500' : 'bg-white/10'}`}>
                        <Heart size={24} className={isFamily ? 'text-white' : 'text-gray-400'} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">👨‍👩‍👧 Family</h3>
                    <p className="text-sm text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors">
                        "We share blood, bonds, and stories that span generations."
                    </p>
                </button>
            </div>

            {/* Optional Field */}
            <AnimatePresence>
                {canContinue && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 pt-4 border-t border-white/5"
                    >
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest px-2">
                            <MessageCircle size={14} className="text-pink-500" />
                            Tell us more (optional)
                        </label>
                        <input
                            type="text"
                            value={data.relationshipNote}
                            onChange={(e) => updateData({ relationshipNote: e.target.value.slice(0, 100) })}
                            placeholder="e.g., College roommate, Favorite cousin..."
                            className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-pink-500/50 focus:bg-white/5 transition-all shadow-inner"
                        />
                        <div className="flex justify-end px-2">
                            <span className="text-[10px] text-gray-600 font-bold tracking-widest">{data.relationshipNote.length}/100</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex gap-4 pt-4">
                <NeonButton variant="ghost" onClick={onBack} className="flex-1">
                    Back
                </NeonButton>
                <NeonButton
                    onClick={onNext}
                    className="flex-[2]"
                    disabled={!canContinue}
                >
                    Continue
                </NeonButton>
            </div>
        </div>
    );
};
