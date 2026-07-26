'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({ current, total, showLabel = true, size = 'md' }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      <div className={`w-full bg-dark-800/80 rounded-full overflow-hidden ${heights[size]}`}>
        <motion.div
          className="h-full bg-gradient-to-r from-brand-600 via-accent-500 to-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center mt-1.5">
          <span className="text-xs text-dark-500">
            {current} de {total} lecciones
          </span>
          <span className="text-xs font-semibold gradient-text">
            {percentage}%
          </span>
        </div>
      )}
    </div>
  );
}
