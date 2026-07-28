'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Certificate } from '@/components/Certificate';
import { FiAward, FiDownload } from 'react-icons/fi';

interface CertificateData {
  id: string;
  courseId: string;
  course: { title: string; slug: string } | null;
  completedAt: string;
  certificateNumber: string;
}

export default function CertificadosPage() {
  const { data: session } = useSession();
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const userName = (session?.user as any)?.name || 'Estudiante';

  useEffect(() => {
    async function fetchCertificates() {
      try {
        const res = await fetch('/api/certificates');
        if (res.ok) {
          const data = await res.json();
          setCertificates(data.certificates || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchCertificates();
  }, []);

  if (loading) {
    return (
      <div className="py-12 section">
        <div className="animate-pulse space-y-4">
          <div className="h-8 skeleton w-1/3" />
          <div className="h-4 skeleton w-1/2" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 skeleton rounded-2xl shimmer" />
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
            <div className="p-2 bg-emerald-500/15 rounded-xl">
              <FiAward size={20} className="text-emerald-400" />
            </div>
            <h1 className="page-title">Mis Certificados</h1>
          </div>
          <p className="text-dark-400">
            Certificados obtenidos al completar cursos.
          </p>
        </motion.div>

        {certificates.length === 0 ? (
          <motion.div
            className="card p-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="empty-state-icon mx-auto">
              <FiAward size={24} className="text-dark-500" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">No tienes certificados</h2>
            <p className="text-dark-400">
              Completa cursos para obtener certificados.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {certificates.map((cert, i) => {
                const isExpanded = expandedId === cert.id;

                return (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="card p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-brand-500/20 rounded-xl flex items-center justify-center shrink-0">
                            <FiAward size={20} className="text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-white font-semibold truncate">{cert.course?.title || 'Curso'}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-dark-500 mt-0.5">
                              <span>{cert.completedAt ? new Date(cert.completedAt).toLocaleDateString('es') : ''}</span>
                              <span className="w-px h-3 bg-dark-700" />
                              <span>No. {cert.certificateNumber}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : cert.id)}
                            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                          >
                            {isExpanded ? 'Ocultar' : 'Ver certificado'}
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-5 pt-5 border-t border-dark-800/50">
                              <Certificate
                                courseId={cert.courseId}
                                courseTitle={cert.course?.title || ''}
                                userName={userName}
                                completionDate={cert.completedAt || ''}
                                certificateNumber={cert.certificateNumber}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
