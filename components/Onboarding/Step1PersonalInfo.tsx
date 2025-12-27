import React, { useState } from 'react';
import { User, Calendar, Camera, Sparkles } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { NeonButton } from '../UI/NeonButton';

interface Step1Props {
    data: any;
    updateData: (updates: any) => void;
    onNext: () => void;
}

export const Step1PersonalInfo: React.FC<Step1Props> = ({ data, updateData, onNext }) => {
    const [nameError, setNameError] = useState('');
    const [dobError, setDobError] = useState('');

    const validate = () => {
        let valid = true;

        // Name validation
        const nameRegex = /^[a-zA-Z\s\-']+$/;
        if (!data.displayName || data.displayName.length < 2 || data.displayName.length > 30) {
            setNameError('Name must be between 2 and 30 characters');
            valid = false;
        } else if (!nameRegex.test(data.displayName)) {
            setNameError('Only letters, spaces, hyphens and apostrophes allowed');
            valid = false;
        } else {
            setNameError('');
        }

        // DOB validation (13+ years)
        if (!data.dateOfBirth) {
            setDobError('Please select your birth date');
            valid = false;
        } else {
            const birthDate = new Date(data.dateOfBirth);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            if (age < 13) {
                setDobError('You must be at least 13 years old 🎂');
                valid = false;
            } else if (birthDate > today) {
                setDobError('Date cannot be in the future');
                valid = false;
            } else {
                setDobError('');
            }
        }

        return valid;
    };

    const handleContinue = () => {
        if (validate()) {
            onNext();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            updateData({
                profilePicture: file,
                profilePictureUrl: URL.createObjectURL(file)
            });
        }
    };

    const isComplete = data.displayName.length >= 2 && data.dateOfBirth;

    return (
        <GlassCard className="p-8 space-y-8 border-purple-500/30 shadow-[0_0_40px_rgba(139,92,246,0.15)] max-w-md mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-white tracking-tight">Let's get to know you</h2>
                <p className="text-gray-400 text-sm italic">Set the foundations of your digital presence</p>
            </div>

            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center">
                <div className="relative group">
                    <div className={`
                        w-24 h-24 rounded-full border-2 overflow-hidden transition-all duration-300
                        ${data.profilePictureUrl ? 'border-cyan-500' : 'border-dashed border-white/20 hover:border-purple-500/50'}
                    `}>
                        {data.profilePictureUrl ? (
                            <img src={data.profilePictureUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 text-gray-500">
                                <User size={32} />
                            </div>
                        )}
                    </div>
                    <label
                        htmlFor="profile-upload"
                        className="absolute bottom-0 right-0 p-2 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full text-white cursor-pointer shadow-lg hover:scale-110 transition-transform"
                        title="Upload profile picture"
                    >
                        <Camera size={16} />
                        <input
                            id="profile-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                            aria-label="Upload profile picture"
                        />
                    </label>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest font-bold">
                    {data.profilePictureUrl ? 'Photo Added' : 'Add Photo (Optional)'}
                </p>
            </div>

            <div className="space-y-6">
                {/* Display Name */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <Sparkles size={14} className="text-purple-400" />
                        Display Name
                    </label>
                    <input
                        type="text"
                        value={data.displayName}
                        onChange={(e) => updateData({ displayName: e.target.value })}
                        placeholder="Your name..."
                        className={`
                            w-full bg-[#0B0F1A] border rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none transition-all
                            ${nameError ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-purple-500/50 focus:bg-white/5'}
                        `}
                    />
                    {nameError && <p className="text-xs text-red-400 animate-pulse">{nameError}</p>}
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <Calendar size={14} className="text-cyan-400" />
                        Date of Birth
                    </label>
                    <div className="relative">
                        <input
                            type="date"
                            value={data.dateOfBirth}
                            onChange={(e) => updateData({ dateOfBirth: e.target.value })}
                            aria-label="Date of birth"
                            title="Date of birth"
                            className={`
                                w-full bg-[#0B0F1A] border rounded-xl px-4 py-3 text-white outline-none transition-all appearance-none
                                ${dobError ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-cyan-500/50 focus:bg-white/5'}
                            `}
                        />
                    </div>
                    {dobError ? (
                        <p className="text-xs text-red-400 animate-pulse">{dobError}</p>
                    ) : (
                        <p className="text-[10px] text-gray-500 font-medium">We'll celebrate your special day! 🎂</p>
                    )}
                </div>
            </div>

            <NeonButton
                onClick={handleContinue}
                className="w-full"
                disabled={!isComplete}
            >
                Continue
            </NeonButton>
        </GlassCard>
    );
};
