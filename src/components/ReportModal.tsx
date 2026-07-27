'use client';

import { useState } from 'react';
import { FiFlag, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface ReportModalProps {
  open: boolean;
  targetType: string;
  targetId: string;
  onClose: () => void;
}

const REASONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'INAPPROPRIATE', label: 'Contenido inapropiado' },
  { value: 'HARASSMENT', label: 'Acoso o intimidación' },
  { value: 'OTHER', label: 'Otro' },
];

export function ReportModal({ open, targetType, targetId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!reason) {
      toast.error('Selecciona un motivo');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reason, description }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Reporte enviado. Gracias por ayudarnos a mantener la comunidad segura.');
        onClose();
        setReason('');
        setDescription('');
      } else {
        toast.error(data.error || 'Error');
      }
    } catch {
      toast.error('Error al enviar reporte');
    }
    setLoading(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="card p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FiFlag size={18} className="text-red-400" />
                Reportar contenido
              </h3>
              <button onClick={onClose} className="text-dark-400 hover:text-white">
                <FiX size={18} />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {REASONS.map((r) => (
                <label key={r.value} className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/50 hover:bg-dark-800 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-red-400"
                  />
                  <span className="text-sm text-dark-200">{r.label}</span>
                </label>
              ))}
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el problema (opcional)..."
              className="input w-full mb-4 h-20 resize-none"
            />

            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="btn-secondary text-sm">
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={loading || !reason}
                className="btn-danger text-sm flex items-center gap-1"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FiFlag size={12} />
                )}
                Enviar reporte
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
