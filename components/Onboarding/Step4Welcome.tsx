import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap, BookOpen, UserPlus } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { NeonButton } from '../UI/NeonButton';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { MemorialWelcome } from './MemorialWelcome';

interface Step4Props {
    data: any;
    onFinish: () => void;
}

export const Step4Welcome: React.FC<Step4Props> = ({ data, onFinish }) => {
    return (
        <MemorialWelcome onFinish={onFinish} />
    );
};
