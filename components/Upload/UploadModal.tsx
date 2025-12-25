import React, { useState, useRef } from 'react';
import { X, UploadCloud, Image as ImageIcon, Maximize, Minimize } from 'lucide-react';
import { NeonButton } from '../UI/NeonButton';
import { GlassCard } from '../UI/GlassCard';
import imageCompression from 'browser-image-compression';

interface UploadModalProps {
  onClose: () => void;
  onUpload: (file: File, caption: string) => Promise<void>;
}

export const UploadModal: React.FC<UploadModalProps> = ({ onClose, onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [template, setTemplate] = useState<'landscape' | 'portrait'>('landscape');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    let fileToProcess = selectedFile;

    // Compression Logic
    if (selectedFile.size > 1.5 * 1024 * 1024) { // If larger than 1.5MB
      setIsCompressing(true);
      try {
        const options = {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        console.log(`Original size: ${selectedFile.size / 1024 / 1024} MB`);
        fileToProcess = await imageCompression(selectedFile, options);
        console.log(`Compressed size: ${fileToProcess.size / 1024 / 1024} MB`);
      } catch (error) {
        console.error("Compression error:", error);
      } finally {
        setIsCompressing(false);
      }
    }

    setFile(fileToProcess);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(fileToProcess);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    try {
      await onUpload(file, caption);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <GlassCard className="w-full max-w-2xl relative animate-[fadeIn_0.3s_ease-out]">
        <button
          onClick={onClose}
          title="Close upload modal"
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <UploadCloud className="text-cyan-400" /> Create New Memory
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selector */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setTemplate('landscape')}
              className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${template === 'landscape' ? 'bg-cyan-500/10 border-cyan-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}
            >
              <Minimize className="rotate-90" size={18} /> Landscape (Wide)
            </button>
            <button
              type="button"
              onClick={() => setTemplate('portrait')}
              className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${template === 'portrait' ? 'bg-purple-500/10 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}
            >
              <Maximize className="rotate-90" size={18} /> Portrait (Tall)
            </button>
          </div>

          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300
              ${template === 'landscape' ? 'aspect-video' : 'aspect-[3/4] max-h-[400px]'}
              ${isDragging ? (template === 'landscape' ? 'border-cyan-500 bg-cyan-500/10' : 'border-purple-500 bg-purple-500/10') : 'border-gray-600 hover:border-gray-400 hover:bg-white/5'}
              ${preview ? 'border-none p-0 overflow-hidden' : 'p-8'}
            `}
          >
            {isCompressing ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                <p className="text-white font-medium">Compressing Image...</p>
                <p className="text-xs text-gray-400 mt-2">Making it lean and mean</p>
              </div>
            ) : preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <ImageIcon size={32} className="text-gray-400" />
                </div>
                <p className="text-lg font-medium text-white">Click or drag image here</p>
                <p className="text-sm text-gray-500 mt-2">JPG, PNG, WebP up to 10MB</p>
                <p className="text-[10px] text-cyan-400/60 uppercase mt-4 tracking-widest font-bold">
                  Autocompression Active
                </p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              title="Select image to upload"
              className="hidden"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
              placeholder="What's the story behind this moment?"
              className="w-full h-32 bg-[#0B0F1A] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-500">Add some hashtags for discoverability</span>
              <span className="text-xs text-gray-500">{caption.length}/500</span>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
            <NeonButton variant="ghost" type="button" onClick={onClose}>
              Cancel
            </NeonButton>
            <NeonButton variant="primary" type="submit" disabled={!file} isLoading={isUploading}>
              Upload Memory
            </NeonButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
