'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiUpload, FiFile, FiX, FiTrash2 } from 'react-icons/fi';

interface LessonFile {
  id: string;
  name: string;
  url: string;
  size: number | null;
  type: string | null;
}

interface AdminLessonFilesProps {
  lessonId: string;
  files: LessonFile[];
  onFilesChange: (files: LessonFile[]) => void;
}

export function AdminLessonFiles({ lessonId, files, onFilesChange }: AdminLessonFilesProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];

        const formData = new FormData();
        formData.append('file', file);
        formData.append('lessonId', lessonId);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          onFilesChange([...files, data.file]);
        } else {
          toast.error(`Error al subir ${file.name}`);
        }
      }
      toast.success(`${fileList.length} archivo(s) subido(s)`);
    } catch {
      toast.error('Error al subir archivos');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function deleteFile(fileId: string) {
    try {
      const res = await fetch(`/api/upload/${fileId}`, { method: 'DELETE' });
      if (res.ok) {
        onFilesChange(files.filter((f) => f.id !== fileId));
        toast.success('Archivo eliminado');
      }
    } catch {
      toast.error('Error al eliminar');
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-dark-400">Archivos adjuntos ({files.length})</span>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-outline text-xs py-1 px-3 flex items-center gap-1"
          >
            <FiUpload size={12} /> {uploading ? 'Subiendo...' : 'Subir archivos'}
          </button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-2 bg-dark-800/50 rounded-lg">
              <div className="flex items-center gap-2 min-w-0">
                <FiFile size={12} className="text-emerald-400 flex-shrink-0" />
                <span className="text-xs text-dark-200 truncate">{file.name}</span>
                {file.size && <span className="text-[10px] text-dark-500 flex-shrink-0">{formatSize(file.size)}</span>}
              </div>
              <button onClick={() => deleteFile(file.id)} className="text-dark-500 hover:text-red-400 transition-colors flex-shrink-0 ml-2">
                <FiTrash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
