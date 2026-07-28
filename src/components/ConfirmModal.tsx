'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiX, FiTrash2, FiCheckCircle, FiInfo } from 'react-icons/fi';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const VARIANT_CONFIG: Record<ConfirmVariant, {
  icon: React.ReactNode;
  iconBg: string;
  confirmBg: string;
  confirmHover: string;
}> = {
  danger: {
    icon: <FiTrash2 size={20} />,
    iconBg: 'bg-red-500/15',
    confirmBg: 'bg-red-600',
    confirmHover: 'hover:bg-red-500',
  },
  warning: {
    icon: <FiAlertTriangle size={20} />,
    iconBg: 'bg-yellow-500/15',
    confirmBg: 'bg-yellow-600',
    confirmHover: 'hover:bg-yellow-500',
  },
  info: {
    icon: <FiCheckCircle size={20} />,
    iconBg: 'bg-brand-500/15',
    confirmBg: 'bg-brand-600',
    confirmHover: 'hover:bg-brand-500',
  },
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading,
}: ConfirmModalProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-dark-950/80 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onCancel()}
          >
            <div className="bg-dark-900/95 border border-dark-700/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-dark-950/50 backdrop-blur-xl">
              <div className="flex items-start gap-4 mb-5">
                <div className={`w-12 h-12 rounded-2xl ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-red-400">{config.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
                  <p className="text-dark-400 text-sm leading-relaxed">{message}</p>
                </div>
                <button
                  onClick={onCancel}
                  className="text-dark-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-dark-800/50 -mt-1 -mr-1"
                >
                  <FiX size={16} />
                </button>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="btn-secondary text-sm py-2 px-5"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`${config.confirmBg} ${config.confirmHover} text-white font-semibold py-2 px-5 rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 text-sm flex items-center gap-2 shadow-lg`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      {config.icon}
                      {confirmText}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
