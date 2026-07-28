'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiMessageCircle, FiUser, FiClock, FiLoader, FiTrash2, FiCheckCircle, FiTag, FiAlertCircle,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SupportTicket } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'Abierto', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  CLOSED: { label: 'Cerrado', color: 'text-dark-500', bg: 'bg-dark-700/50 border-dark-600/20' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Baja', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  MEDIUM: { label: 'Media', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  HIGH: { label: 'Alta', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

export default function AdminSupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/support/tickets?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (status === 'authenticated') loadTickets();
  }, [status, loadTickets]);

  async function closeTicket(id: string) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED' }),
      });
      if (res.ok) {
        setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status: 'CLOSED' } : t));
        toast.success('Ticket cerrado');
      } else {
        toast.error('Error al cerrar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setUpdatingId(null);
    }
  }

  async function reopenTicket(id: string) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'OPEN' }),
      });
      if (res.ok) {
        setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status: 'OPEN' } : t));
        toast.success('Ticket reabierto');
      } else {
        toast.error('Error al reabrir');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteTicket(id: string) {
    if (!window.confirm('¿Eliminar este ticket y todos sus mensajes?')) return;
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTickets((prev) => prev.filter((t) => t.id !== id));
        toast.success('Ticket eliminado');
      } else {
        toast.error('Error al eliminar');
      }
    } catch {
      toast.error('Error de conexión');
    }
  }

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const highPriorityCount = tickets.filter((t) => t.status === 'OPEN' && t.priority === 'HIGH').length;

  if (loading) {
    return (
      <div className="py-12 section">
        <div className="max-w-4xl mx-auto animate-pulse space-y-4">
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
            <h1 className="text-3xl font-bold text-white mb-1">Soporte</h1>
            <p className="text-dark-400">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
              {openCount > 0 && (
                <span className="ml-2 text-green-400">· {openCount} abierto{openCount !== 1 ? 's' : ''}</span>
              )}
              {highPriorityCount > 0 && (
                <span className="ml-2 text-red-400">· {highPriorityCount} alta prioridad</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {['ALL', 'OPEN', 'CLOSED'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setLoading(true); }}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filter === f
                  ? 'bg-brand-500/10 border-brand-500/20 text-brand-400'
                  : 'bg-dark-800/50 border-dark-700/50 text-dark-400 hover:text-white'
              }`}
            >
              {f === 'ALL' ? 'Todos' : f === 'OPEN' ? 'Abiertos' : 'Cerrados'}
            </button>
          ))}
        </div>

        {tickets.length === 0 ? (
          <div className="card p-12 text-center">
            <FiMessageCircle size={32} className="text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400 text-sm">No hay tickets</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {tickets.map((ticket, i) => {
                const statusConf = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
                const priorityConf = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM;
                const lastMessage = (ticket as any).messages?.[0];

                return (
                  <motion.div
                    key={ticket.id}
                    className="card overflow-hidden"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <div className="p-4 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/20 to-blue-500/20 border border-brand-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {ticket.user.image ? (
                          <img src={ticket.user.image} alt="" className="w-9 h-9 rounded-xl object-cover" />
                        ) : (
                          <FiUser size={16} className="text-brand-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-white truncate">
                            {ticket.user.name || ticket.user.email}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${statusConf.bg} ${statusConf.color}`}>
                            {statusConf.label}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${priorityConf.bg} ${priorityConf.color}`}>
                            {priorityConf.label}
                          </span>
                        </div>
                        <Link href={`/admin/support/${ticket.id}`} className="text-sm text-dark-200 hover:text-white transition-colors truncate block">
                          {ticket.subject}
                        </Link>
                        {lastMessage && (
                          <p className="text-xs text-dark-500 truncate mt-0.5">{lastMessage.content}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-dark-500 flex items-center gap-1">
                            <FiMessageCircle size={9} />
                            {ticket._count?.messages || 0}
                          </span>
                          <span className="text-[10px] text-dark-600">
                            {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true, locale: es })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {ticket.status === 'OPEN' ? (
                          <button
                            onClick={() => closeTicket(ticket.id)}
                            disabled={updatingId === ticket.id}
                            className="text-[11px] px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors flex items-center gap-1.5"
                            title="Cerrar ticket"
                          >
                            {updatingId === ticket.id ? <FiLoader size={10} className="animate-spin" /> : <FiCheckCircle size={10} />}
                            Cerrar
                          </button>
                        ) : (
                          <button
                            onClick={() => reopenTicket(ticket.id)}
                            disabled={updatingId === ticket.id}
                            className="text-[11px] px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors flex items-center gap-1.5"
                            title="Reabrir ticket"
                          >
                            Reabrir
                          </button>
                        )}
                        <button
                          onClick={() => deleteTicket(ticket.id)}
                          className="text-[11px] px-2 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                          title="Eliminar ticket"
                        >
                          <FiTrash2 size={10} />
                        </button>
                      </div>
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
