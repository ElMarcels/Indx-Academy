'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiMail, FiUser, FiClock, FiLoader, FiTrash2, FiEye, FiCheckCircle, FiMessageCircle,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface StaffMessage {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pendiente', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  READ: { label: 'Leído', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  REPLIED: { label: 'Respondido', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
};

export default function AdminStaffMessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<StaffMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/staff-messages');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') loadMessages();
  }, [status, loadMessages]);

  async function updateStatus(id: string, newStatus: string) {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/staff-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: newStatus } : m));
        toast.success('Estado actualizado');
      } else {
        toast.error('Error al actualizar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteMessage(id: string) {
    if (!window.confirm('¿Eliminar este mensaje?')) return;
    try {
      const res = await fetch('/api/admin/staff-messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        toast.success('Mensaje eliminado');
      } else {
        toast.error('Error al eliminar');
      }
    } catch {
      toast.error('Error de conexión');
    }
  }

  const pendingCount = messages.filter((m) => m.status === 'PENDING').length;

  if (loading) {
    return (
      <div className="py-12 section">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-800 rounded w-1/4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-dark-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="section max-w-4xl mx-auto">
        <Link href="/admin" className="text-dark-400 hover:text-white text-sm mb-6 flex items-center gap-1.5 transition-colors">
          <FiArrowLeft size={14} /> Volver al admin
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Mensajes al Staff</h1>
            <p className="text-dark-400">
              {messages.length} mensaje{messages.length !== 1 ? 's' : ''}
              {pendingCount > 0 && (
                <span className="ml-2 text-yellow-400">· {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}</span>
              )}
            </p>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="card p-12 text-center">
            <FiMail size={32} className="text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400 text-sm">No hay mensajes todavía</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {messages.map((msg, i) => {
                const isExpanded = expandedId === msg.id;
                const config = STATUS_CONFIG[msg.status] || STATUS_CONFIG.PENDING;

                return (
                  <motion.div
                    key={msg.id}
                    className="card overflow-hidden"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <button
                      onClick={() => {
                        setExpandedId(isExpanded ? null : msg.id);
                        if (msg.status === 'PENDING') updateStatus(msg.id, 'READ');
                      }}
                      className="w-full text-left p-4 flex items-start gap-3 hover:bg-dark-800/30 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/20 to-blue-500/20 border border-brand-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {msg.user.image ? (
                          <img src={msg.user.image} alt="" className="w-9 h-9 rounded-xl object-cover" />
                        ) : (
                          <FiUser size={16} className="text-brand-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-white truncate">
                            {msg.user.name || msg.user.email}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-sm text-dark-200 truncate">{msg.subject}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <FiClock size={10} className="text-dark-600" />
                          <span className="text-[10px] text-dark-500">
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: es })}
                          </span>
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-dark-800/50">
                            <div className="mt-3 mb-4">
                              <p className="text-xs text-dark-500 mb-1">Mensaje:</p>
                              <p className="text-sm text-dark-200 whitespace-pre-wrap bg-dark-800/50 rounded-xl p-3">{msg.message}</p>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-dark-500 mb-3">
                              <FiMail size={10} />
                              <span>{msg.user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {msg.status !== 'READ' && (
                                <button
                                  onClick={() => updateStatus(msg.id, 'READ')}
                                  disabled={updatingId === msg.id}
                                  className="text-[11px] px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors flex items-center gap-1.5"
                                >
                                  {updatingId === msg.id ? <FiLoader size={10} className="animate-spin" /> : <FiEye size={10} />}
                                  Marcar leído
                                </button>
                              )}
                              {msg.status !== 'REPLIED' && (
                                <button
                                  onClick={() => updateStatus(msg.id, 'REPLIED')}
                                  disabled={updatingId === msg.id}
                                  className="text-[11px] px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors flex items-center gap-1.5"
                                >
                                  {updatingId === msg.id ? <FiLoader size={10} className="animate-spin" /> : <FiCheckCircle size={10} />}
                                  Marcar respondido
                                </button>
                              )}
                              <button
                                onClick={() => deleteMessage(msg.id)}
                                className="text-[11px] px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center gap-1.5 ml-auto"
                              >
                                <FiTrash2 size={10} />
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
