'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiTrash2, FiX } from 'react-icons/fi';

interface DeleteConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DeleteConfirmModal({ open, title, message, onConfirm, onCancel, loading }: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onCancel()}
          >
            <div className="card p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/15 rounded-xl flex items-center justify-center">
                    <FiAlertTriangle size={18} className="text-red-400" />
                  </div>
                  <h3 className="text-white font-semibold">{title}</h3>
                </div>
                <button onClick={onCancel} className="text-dark-500 hover:text-white transition-colors p-1">
                  <FiX size={16} />
                </button>
              </div>
              <p className="text-dark-300 text-sm mb-6 pl-[52px]">{message}</p>
              <div className="flex gap-3 justify-end">
                <button onClick={onCancel} className="btn-secondary text-sm py-2 px-4">
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 text-sm flex items-center gap-2"
                >
                  <FiTrash2 size={14} />
                  {loading ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
