'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LearningPaths } from '@/components/LearningPaths';
import { FiLayers } from 'react-icons/fi';

export default function RutasPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        await fetch('/api/paths');
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    check();
  }, []);

  if (loading) {
    return (
      <div className="py-12 section">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-800 rounded w-1/3" />
          <div className="h-4 bg-dark-800 rounded w-1/2" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-dark-800 rounded-2xl shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="section max-w-4xl">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent-500/15 rounded-xl">
              <FiLayers size={20} className="text-accent-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Rutas de Aprendizaje</h1>
          </div>
          <p className="text-dark-400">
            Sigue una ruta guiada para dominar un tema de principio a fin.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <LearningPaths />
        </motion.div>
      </div>
    </div>
  );
}
