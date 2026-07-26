'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiCamera, FiCheck, FiX, FiLoader } from 'react-icons/fi';

interface ProfilePhotoProps {
  userId: string;
  currentImage: string | null;
  isMe: boolean;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 40, md: 64, lg: 96 };
const iconSizes = { sm: 12, md: 16, lg: 20 } as const;

export function ProfilePhoto({ userId, currentImage, isMe, name = '', size = 'md' }: ProfilePhotoProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const px = sizes[size];
  const initial = (name || '?').charAt(0).toUpperCase();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadPhoto() {
    if (!preview) return;
    setUploading(true);
    setProgress(0);

    const interval = setInterval(() => setProgress((p) => Math.min(p + 10, 90)), 150);

    try {
      const res = await fetch('/api/upload/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, image: preview }),
      });
      if (res.ok) {
        toast.success('Foto actualizada');
        setPreview(null);
      } else {
        toast.error('Error al subir imagen');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      clearInterval(interval);
      setProgress(100);
      setUploading(false);
    }
  }

  function cancelUpload() {
    setPreview(null);
    setProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  }

  const displaySrc = preview || currentImage;

  return (
    <div className="relative inline-flex flex-col items-center">
      <motion.div
        className="relative rounded-full overflow-hidden cursor-pointer group"
        style={{ width: px, height: px }}
        whileHover={isMe ? { scale: 1.05 } : undefined}
        onClick={() => isMe && !uploading && fileRef.current?.click()}
      >
        {displaySrc ? (
          <img src={displaySrc} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-500/30 via-accent-500/20 to-emerald-500/30 flex items-center justify-center">
            <span className={`font-bold text-white/80 ${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-xl' : 'text-3xl'}`}>
              {initial}
            </span>
          </div>
        )}

        {isMe && (
          <motion.div
            className="absolute inset-0 bg-dark-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <FiCamera size={iconSizes[size]} className="text-white" />
          </motion.div>
        )}
      </motion.div>

      {isMe && preview && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 mt-2"
        >
          {uploading ? (
            <div className="flex items-center gap-2 text-xs text-dark-400">
              <FiLoader size={12} className="animate-spin" />
              <span>{progress}%</span>
              <div className="w-16 h-1 bg-dark-800 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 transition-all duration-200 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <>
              <motion.button
                onClick={(e) => { e.stopPropagation(); uploadPhoto(); }}
                className="p-1 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
                whileTap={{ scale: 0.9 }}
                title="Guardar"
              >
                <FiCheck size={14} />
              </motion.button>
              <motion.button
                onClick={(e) => { e.stopPropagation(); cancelUpload(); }}
                className="p-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                whileTap={{ scale: 0.9 }}
                title="Cancelar"
              >
                <FiX size={14} />
              </motion.button>
            </>
          )}
        </motion.div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
