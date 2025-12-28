import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile } from '../../types';
import { api } from '../../services/supabase';
import { useToast } from '../UI/ToastNotification';
import { Step1PersonalInfo } from './Step1PersonalInfo';
import { Step2Relationship } from './Step2Relationship';
import { Step3FirstMemory } from './Step3FirstMemory';
import { Step4Welcome } from './Step4Welcome';

interface OnboardingFlowProps {
    user: UserProfile;
    onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ user, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        displayName: user.username || '',
        dateOfBirth: '',
        profilePicture: null as File | null,
        profilePictureUrl: user.avatar_url || '',
        relationshipTags: [] as string[],
        relationshipNote: '',
        firstMemory: {
            photo: null as File | null,
            caption: '',
            date: new Date().toISOString().split('T')[0],
        }
    });

    const { showToast, ToastComponent } = useToast();
    const progress = (currentStep / 4) * 100;

    // Load progress from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(`onboarding_progress_${user.id}`);
        if (saved) {
            try {
                const { step, data } = JSON.parse(saved);
                setCurrentStep(step);
                // Merge saved data with initial data (to keep File objects null but preserve strings)
                setFormData(prev => ({ ...prev, ...data }));
            } catch (e) {
                console.error("Failed to restore onboarding progress", e);
            }
        }
    }, [user.id]);

    // Save progress to localStorage (excluding File objects)
    useEffect(() => {
        const dataToSave = {
            ...formData,
            profilePicture: null, // Can't save File in localStorage
            firstMemory: { ...formData.firstMemory, photo: null }
        };
        localStorage.setItem(`onboarding_progress_${user.id}`, JSON.stringify({
            step: currentStep,
            data: dataToSave
        }));
    }, [currentStep, formData, user.id]);

    const handleNext = () => {
        setCurrentStep(prev => Math.min(4, prev + 1));
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(1, prev - 1));
    };

    const handleComplete = async (finalData: any) => {
        try {
            // 1. Upload Profile Picture (if exists as File)
            let finalAvatarUrl = formData.profilePictureUrl;
            if (formData.profilePicture instanceof File) {
                // Note: logic assumes api.uploadProfilePicture handles the upload and returns URL
                // We don't have this function exposed yet in types but it exists in supabase.ts
                // Let's assume user.avatar_url is fallback
                try {
                    finalAvatarUrl = await api.uploadProfilePicture(formData.profilePicture, user.id);
                } catch (uploadErr) {
                    console.error("Profile picture upload failed, using default", uploadErr);
                    // Fallback to existing or generated
                }
            }

            // 2. Create Founding Memory Post
            let firstMemoryId = null;
            if (formData.firstMemory.photoUrl) {
                try {
                    firstMemoryId = await api.createPost(
                        user.id,
                        formData.firstMemory.photoUrl,
                        formData.firstMemory.caption,
                        ['founding_memory'] // Add the badge!
                    );
                } catch (postErr) {
                    console.error("Failed to create founding memory post", postErr);
                    // We continue even if this fails, to not block the user entirely
                }
            }

            // 3. Finalize Onboarding with IDs
            await api.completeOnboarding(user.id, {
                ...formData,
                ...finalData,
                avatarUrl: finalAvatarUrl,
                firstMemoryId: firstMemoryId
            });

            localStorage.removeItem(`onboarding_progress_${user.id}`);
            onComplete();
        } catch (error: any) {
            console.error("Onboarding submission failed", error);
            showToast("Failed to finalize onboarding. Please try again.", "error");
        }
    };

    const handleSkip = async () => {
        if (!confirm("Skip onboarding? This will use your default profile settings.")) return;

        try {
            // Minimal update to mark completion
            await api.completeOnboarding(user.id, {
                displayName: formData.displayName || user.username || 'User',
                dateOfBirth: formData.dateOfBirth || '2000-01-01', // Default DOB if skipped
                relationshipTags: [],
                relationshipNote: '',
                firstMemoryId: null,
                avatarUrl: user.avatar_url
            });

            localStorage.removeItem(`onboarding_progress_${user.id}`);
            onComplete();
            showToast("Onboarding skipped!", "success");
        } catch (error) {
            console.error("Skip failed", error);
            // Force complete locally even if backend fails (to unblock user)
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#0B0F1A] flex flex-col items-center justify-center p-4 overflow-y-auto">
            {ToastComponent}

            <div className="w-full max-w-xl">
                {/* Progress Header */}
                <div className="mb-8 space-y-2">
                    <div className="flex justify-between items-end text-xs font-bold uppercase tracking-widest">
                        <span className="text-purple-400">Step {currentStep} of 4</span>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-500">{Math.round(progress)}% Complete</span>
                            {currentStep === 1 && (
                                <button
                                    onClick={handleSkip}
                                    className="text-gray-600 hover:text-white transition-colors text-[10px] underline decoration-gray-600 hover:decoration-white underline-offset-4"
                                >
                                    Skip Setup
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 shadow-[0_0_20px_rgba(139,92,246,0.6)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                </div>

                {/* Step Content */}
                <div className="relative min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <Step1PersonalInfo
                                    data={formData}
                                    updateData={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                                    onNext={handleNext}
                                />
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <Step2Relationship
                                    data={formData}
                                    updateData={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                                    onNext={handleNext}
                                    onBack={handleBack}
                                />
                            </motion.div>
                        )}

                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <Step3FirstMemory
                                    userId={user.id}
                                    data={formData}
                                    updateData={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                                    onNext={handleNext}
                                    onBack={handleBack}
                                />
                            </motion.div>
                        )}

                        {currentStep === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className="w-full"
                            >
                                <Step4Welcome
                                    data={formData}
                                    onFinish={() => handleComplete({})}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
