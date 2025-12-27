import React, { useState, useRef, useEffect } from 'react';
import { Upload, ImageIcon, Sparkles, Clock, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { NeonButton } from '../UI/NeonButton';
import imageCompression from 'browser-image-compression';
import { api } from '../../services/supabase';

interface Step3Props {
    userId: string;
    data: any;
    updateData: (updates: any) => void;
    onNext: () => void;
    onBack: () => void;
}

import { useToast } from '../UI/ToastNotification';

export const Step3FirstMemory: React.FC<Step3Props> = ({ userId, data, updateData, onNext, onBack }) => {
    const { showToast, ToastComponent } = useToast();
    const [isDragging, setIsDragging] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showPrompts, setShowPrompts] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<string>(''); // For background upload feedback
    const fileInputRef = useRef<HTMLInputElement>(null);
    const promptTimerRef = useRef<NodeJS.Timeout | null>(null);
    const uploadPromiseRef = useRef<Promise<string> | null>(null);

    const PROMPTS = [
        "The very first day we met...",
        "My favorite shared adventure was...",
        "I'll never forget the time Nazir...",
        "That one moment that says it all about our bond..."
    ];

    // Reset/Start prompt timer
    useEffect(() => {
        if (!data.firstMemory.caption && !showPrompts) {
            promptTimerRef.current = setTimeout(() => setShowPrompts(true), 5000);
        } else if (data.firstMemory.caption) {
            setShowPrompts(false);
        }
        return () => {
            if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
        };
    }, [data.firstMemory.caption]);

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) return;

        setIsCompressing(true);
        setPreviewUrl(URL.createObjectURL(file));

        try {
            const options = {
                maxSizeMB: 0.8,
                maxWidthOrHeight: 2048,
                useWebWorker: true,
                fileType: 'image/jpeg' // Force JPEG for standardisation
            };
            const compressed = await imageCompression(file, options);

            // Rename to ensures extension matches mime type
            const renamedFile = new File([compressed], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' });

            updateData({
                firstMemory: {
                    ...data.firstMemory,
                    photo: renamedFile
                }
            });

            // Start background upload immediately (using renamed file)
            setUploadStatus('Uploading in background...');
            uploadPromiseRef.current = api.uploadImage(renamedFile)
                .then(url => {
                    setUploadStatus('Ready');
                    return url;
                })
                .catch(err => {
                    console.error("Background upload failed", err);
                    setUploadStatus('Upload failed');
                    return Promise.reject(err);
                });

        } catch (err) {
            console.error("Compression error", err);
        } finally {
            setIsCompressing(false);
        }
    };

    const handleUploadClick = async () => {
        if (!data.firstMemory.photo || !data.firstMemory.caption) return;

        setIsUploading(true);
        try {
            let publicUrl = data.firstMemory.photoUrl;

            // Use the background upload promise if available
            if (!publicUrl && uploadPromiseRef.current) {
                publicUrl = await uploadPromiseRef.current;
            } else if (!publicUrl) {
                // Fallback if background upload wasn't triggered
                publicUrl = await api.uploadImage(data.firstMemory.photo);
            }

            // Update with final URL (if not already there)
            updateData({
                firstMemory: {
                    ...data.firstMemory,
                    photoUrl: publicUrl
                }
            });
            onNext();
        } catch (err: any) {
            console.error("Upload failed", err);
            showToast(err.message || "Upload failed. Please try again.", "error");
            uploadPromiseRef.current = null; // Clear to retry
        } finally {
            setIsUploading(false);
        }
    };

    const isReady = data.firstMemory.photo && data.firstMemory.caption.length >= 10;
    const captionLength = data.firstMemory.caption.length;

    return (
        <div className="space-y-6 max-w-2xl mx-auto pb-12">
            {ToastComponent}
            <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                    <Sparkles size={12} /> Founding Memory Required
                </span>
                <h2 className="text-3xl font-bold text-white tracking-tight">Share a moment with Nazir</h2>
                <p className="text-gray-400 text-sm italic">Every legendary vault begins with a single shared truth</p>
            </div>

            {/* Upload Zone */}
            <div
                className={`
                    relative aspect-video rounded-3xl border-2 border-dashed transition-all duration-500 overflow-hidden group
                    ${isDragging ? 'border-purple-500 bg-purple-500/10 scale-[1.01]' : 'border-white/10 hover:border-purple-500/50 bg-white/5'}
                `}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file); }}
                onClick={() => !isUploading && fileInputRef.current?.click()}
            >
                {previewUrl ? (
                    <div className="relative w-full h-full">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                            <ImageIcon size={48} className="text-white animate-bounce" />
                            <p className="text-white font-bold uppercase tracking-widest text-xs mt-4">Change Photo</p>
                        </div>
                        <div className="absolute top-4 left-4 z-10">
                            <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-cyan-400 text-[10px] font-bold uppercase tracking-widest shadow-xl">
                                <Sparkles size={12} className="animate-pulse" /> Founding Memory ⚡
                            </span>
                        </div>
                        {isCompressing && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-cyan-400 font-bold text-xs uppercase tracking-widest">Optimizing for the vault...</p>
                                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-cyan-400 font-bold text-xs uppercase tracking-widest">Optimizing for the vault...</p>
                            </div>
                        )}
                        {/* Background Upload Status */}
                        {!isCompressing && uploadStatus && uploadStatus !== 'Ready' && (
                            <div className="absolute top-4 right-4">
                                <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest shadow-xl">
                                    {uploadStatus === 'Upload failed' ? <span className="text-red-400">⚠️ Upload Failed</span> : <span className="text-cyan-400 flex items-center gap-2"><Loader2 size={10} className="animate-spin" /> Uploading...</span>}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/10 to-cyan-500/10 flex items-center justify-center border border-white/5 shadow-inner">
                            <Upload size={32} className="text-gray-500 group-hover:text-purple-400 transition-colors" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-white mb-1">Drag your photo here</p>
                            <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">or click to upload</p>
                        </div>
                        <p className="text-[10px] text-gray-600 font-medium">JPEG, PNG or HEIC up to 10MB</p>
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    aria-label="Upload memory photo"
                    title="Upload memory photo"
                />
            </div>

            {/* Caption & Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <ImageIcon size={14} className="text-purple-400" /> What's the story?
                        </label>
                        <span className={`text-[10px] font-bold tracking-widest transition-colors ${captionLength >= 10 ? 'text-cyan-400' : 'text-gray-600'}`}>
                            {captionLength}/500 {captionLength < 10 && "(Min 10)"}
                        </span>
                    </div>
                    <textarea
                        value={data.firstMemory.caption}
                        onChange={(e) => updateData({ firstMemory: { ...data.firstMemory, caption: e.target.value.slice(0, 500) } })}
                        placeholder="Describe this special moment..."
                        className={`
                            w-full h-32 bg-[#0B0F1A] border rounded-2xl p-4 text-white placeholder-gray-600 outline-none transition-all resize-none shadow-inner
                            ${captionLength > 0 && captionLength < 10 ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 focus:border-purple-500/50 focus:bg-white/5'}
                        `}
                    />

                    {/* Prompts */}
                    {showPrompts && !data.firstMemory.caption && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Sparkles size={12} className="text-yellow-500" /> Need inspiration?
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {PROMPTS.map((p, i) => (
                                    <button
                                        key={i}
                                        onClick={() => updateData({ firstMemory: { ...data.firstMemory, caption: p } })}
                                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] text-gray-400 hover:text-white hover:bg-white/10 transition-all italic"
                                    >
                                        "{p}"
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={14} className="text-cyan-400" /> When was this?
                    </label>
                    <input
                        type="date"
                        value={data.firstMemory.date}
                        onChange={(e) => updateData({ firstMemory: { ...data.firstMemory, date: e.target.value } })}
                        className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500/50 transition-all font-medium"
                        aria-label="Date of memory"
                        title="Date of memory"
                    />

                    <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-cyan-500 uppercase tracking-widest">
                            <CheckCircle size={14} /> Instant Optimization
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed italic">
                            Your memory will be compressed to approx. 800KB for the vault without losing detail. ⚡
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-white/5">
                <NeonButton variant="ghost" onClick={onBack} disabled={isUploading}>
                    Back
                </NeonButton>
                <NeonButton
                    onClick={handleUploadClick}
                    className="flex-1"
                    disabled={!isReady || isUploading}
                    isLoading={isUploading}
                >
                    {isUploading ? "Capturing..." : "Create My First Memory"}
                </NeonButton>
            </div>
        </div>
    );
};
