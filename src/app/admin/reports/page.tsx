'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiFlag, FiCheckCircle, FiX, FiLoader, FiUser, FiClock, FiMessageSquare,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Report {
  id: string;
  reason: string;
  description: string | null;
  targetType: string;
  targetId: string;
  status: string;
  createdAt: string;
  reporter: { id: string; name: string | null; email: string | null };
}

const REASON_LABELS: Record<string, string> = {
  SPAM: 'Spam',
  INAPPROPRIATE: 'Contenido inapropiado',
  HARASSMENT: 'Acoso',
  CHEATING: 'Trampas/Copias',
  OTHER: 'Otro',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  REVIEWED: 'Revisado',
  DISMISSED: 'Descartado',
  ACTION_TAKEN: 'Acción tomada',
};

export default function AdminReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const loadReports = useCallback(async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') loadReports();
  }, [status, loadReports]);

  async function resolveReport(reportId: string, action: 'ACTION_TAKEN' | 'DISMISSED') {
    setResolvingId(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });
      if (res.ok) {
        toast.success(action === 'ACTION_TAKEN' ? 'Reporte resuelto' : 'Reporte descartado');
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      } else {
        toast.error('Error al actualizar reporte');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setResolvingId(null);
    }
  }

  if (loading) {
    return (
      <div className="py-12 section">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-800 rounded w-1/4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="h-4 bg-dark-800 rounded w-3/4" />
              <div className="h-3 bg-dark-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const pending = reports.filter((r) => r.status === 'PENDING');
  const resolved = reports.filter((r) => r.status !== 'PENDING');

  return (
    <div className="py-12 section max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <FiFlag size={20} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Moderación</h1>
          <p className="text-dark-400 text-sm">{pending.length} reportes pendientes</p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="card p-12 text-center">
          <FiCheckCircle size={48} className="text-green-400/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Todo limpio</h3>
          <p className="text-dark-400">No hay reportes que revisar</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FiFlag size={12} /> Pendientes ({pending.length})
              </h2>
              <div className="space-y-3">
                <AnimatePresence>
                  {pending.map((report) => (
                    <motion.div
                      key={report.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="card p-4 border-l-4 border-l-red-500/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="badge-red text-[10px]">{REASON_LABELS[report.reason] || report.reason}</span>
                            <span className="text-[10px] text-dark-500 uppercase">{report.targetType}</span>
                          </div>
                          {report.description && (
                            <p className="text-sm text-dark-300 mb-2">{report.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-[10px] text-dark-500">
                            <span className="flex items-center gap-1">
                              <FiUser size={9} /> {report.reporter.name || report.reporter.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiClock size={9} />
                              {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: es })}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiMessageSquare size={9} /> {report.targetId.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => resolveReport(report.id, 'ACTION_TAKEN')}
                            disabled={resolvingId === report.id}
                            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 disabled:opacity-30"
                          >
                            {resolvingId === report.id ? (
                              <FiLoader size={12} className="animate-spin" />
                            ) : (
                              <FiCheckCircle size={12} />
                            )}
                            Resolver
                          </button>
                          <button
                            onClick={() => resolveReport(report.id, 'DISMISSED')}
                            disabled={resolvingId === report.id}
                            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 disabled:opacity-30"
                          >
                            <FiX size={12} /> Descartar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {resolved.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FiCheckCircle size={12} /> Resueltos ({resolved.length})
              </h2>
              <div className="space-y-2">
                {resolved.map((report) => (
                  <div key={report.id} className="card p-3 opacity-60">
                    <div className="flex items-center gap-3">
                      <span className="badge-green text-[10px]">{STATUS_LABELS[report.status]}</span>
                      <span className="text-xs text-dark-400">{REASON_LABELS[report.reason]}</span>
                      <span className="text-[10px] text-dark-600 ml-auto">
                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
