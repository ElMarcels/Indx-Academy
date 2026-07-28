'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiMessageCircle, FiUser, FiClock, FiLoader, FiTrash2,
  FiCheckCircle, FiTag, FiAlertCircle, FiHeadphones, FiSearch, FiChevronRight,
  FiMail, FiAlertOctagon, FiInbox,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SupportTicket } from '@/types';
import { ConfirmModal } from '@/components/ConfirmModal';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  OPEN: { label: 'Abierto', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', dot: 'bg-green-400' },
  CLOSED: { label: 'Cerrado', color: 'text-dark-500', bg: 'bg-dark-700/50', border: 'border-dark-600/20', dot: 'bg-dark-500' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  LOW: { label: 'Baja', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  MEDIUM: { label: 'Media', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  HIGH: { label: 'Alta', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

const FILTER_TABS = [
  { key: 'ALL', label: 'Todos', icon: FiInbox },
  { key: 'OPEN', label: 'Abiertos', icon: FiMail },
  { key: 'CLOSED', label: 'Cerrados', icon: FiCheckCircle },
];

export default function AdminSupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

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

  async function deleteTicket() {
    if (!confirmDelete.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${confirmDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setTickets((prev) => prev.filter((t) => t.id !== confirmDelete.id));
        toast.success('Ticket eliminado');
      } else {
        toast.error('Error al eliminar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setDeleting(false);
      setConfirmDelete({ open: false, id: null });
    }
  }

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const highPriorityCount = tickets.filter((t) => t.status === 'OPEN' && t.priority === 'HIGH').length;
  const totalMessages = tickets.reduce((acc, t) => acc + (t._count?.messages || 0), 0);

  const filteredTickets = search.trim()
    ? tickets.filter((t) =>
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.user.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.user.email.toLowerCase().includes(search.toLowerCase())
      )
    : tickets;

  if (loading) {
    return (
      <div className="py-12 section">
        <div className="max-w-4xl mx-auto animate-pulse space-y-4">
          <div className="h-40 bg-dark-800/50 rounded-3xl" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-dark-800/50 rounded-2xl" />)}
          </div>
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-dark-800/50 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12">
      <div className="section max-w-4xl mx-auto">
        <Link href="/admin" className="text-dark-400 hover:text-white text-sm mb-6 flex items-center gap-1.5 transition-colors group w-fit">
          <FiArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Volver al admin
        </Link>

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-600/15 via-dark-900 to-brand-600/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(217,70,239,0.12),transparent_60%)]" />
          <div className="relative p-8 md:p-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500 to-brand-500 flex items-center justify-center mb-4 shadow-lg shadow-accent-500/25">
                  <FiHeadphones size={24} className="text-white" />
                </div>
                <h1 className="page-title">Soporte - Panel Admin</h1>
                <p className="text-dark-300 text-sm max-w-md">
                  Gestiona las consultas de los usuarios. Responde y cierra tickets cuando estén resueltos.
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              {[
                { icon: FiInbox, label: 'Total', value: tickets.length, color: 'text-dark-300', bg: 'bg-dark-800/40' },
                { icon: FiMail, label: 'Abiertos', value: openCount, color: 'text-green-400', bg: 'bg-green-500/5', dot: 'bg-green-400' },
                { icon: FiCheckCircle, label: 'Cerrados', value: tickets.length - openCount, color: 'text-dark-500', bg: 'bg-dark-800/40' },
                { icon: FiAlertOctagon, label: 'Alta prioridad', value: highPriorityCount, color: 'text-red-400', bg: 'bg-red-500/5' },
              ].map((stat) => (
                <div key={stat.label} className={`${stat.bg} rounded-xl px-4 py-3 border border-dark-700/20`}>
                  <div className="flex items-center gap-2 mb-1">
                    {stat.dot && <div className={`w-1.5 h-1.5 rounded-full ${stat.dot}`} />}
                    <stat.icon size={12} className={stat.color} />
                  </div>
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-[10px] text-dark-500 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="flex gap-1.5 bg-dark-900/80 border border-dark-800/50 rounded-xl p-1 backdrop-blur-sm">
            {FILTER_TABS.map((tab) => {
              const count = tab.key === 'ALL' ? tickets.length : tickets.filter((t) => t.status === tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setFilter(tab.key); setLoading(true); }}
                  className={`text-xs px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 font-medium ${
                    filter === tab.key
                      ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20 shadow-sm'
                      : 'text-dark-400 hover:text-white hover:bg-dark-800/50 border border-transparent'
                  }`}
                >
                  <tab.icon size={12} />
                  {tab.label}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    filter === tab.key ? 'bg-brand-500/20 text-brand-300' : 'bg-dark-800 text-dark-500'
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>
          <div className="relative flex-1 sm:max-w-xs w-full">
            <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por asunto o usuario..."
              className="input w-full pl-9 py-2 text-xs"
            />
          </div>
        </div>

        {/* Ticket List */}
        {filteredTickets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-900/80 border border-dark-800/50 rounded-2xl p-16 text-center backdrop-blur-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-dark-800/50 flex items-center justify-center mx-auto mb-4 border border-dark-700/30">
              <FiMessageCircle size={28} className="text-dark-600" />
            </div>
            <p className="text-white font-medium mb-1">
              {search ? 'Sin resultados' : 'No hay tickets'}
            </p>
            <p className="text-dark-500 text-sm max-w-xs mx-auto">
              {search ? 'No se encontraron tickets que coincidan con tu búsqueda.' : 'No hay tickets de soporte en este momento.'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filteredTickets.map((ticket, i) => {
                const statusConf = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
                const priorityConf = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM;
                const lastMessage = (ticket as any).messages?.[0];
                const isOpen = ticket.status === 'OPEN';

                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                  >
                    <div className={`group bg-dark-900/80 border rounded-2xl transition-all duration-300 backdrop-blur-sm ${
                      isOpen
                        ? 'border-dark-800/50 hover:border-brand-500/20 hover:shadow-lg hover:shadow-brand-600/5'
                        : 'border-dark-800/30 opacity-75 hover:opacity-100'
                    }`}>
                      <div className="p-4 flex items-start gap-3.5">
                        {/* User Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-blue-500/20 border border-brand-500/15 flex items-center justify-center flex-shrink-0">
                          {ticket.user.image ? (
                            <img src={ticket.user.image} alt="" className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <FiUser size={16} className="text-brand-400" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-dark-300">
                              {ticket.user.name || ticket.user.email}
                            </span>
                            <span className="text-[9px] text-dark-600">·</span>
                            <span className="text-[10px] text-dark-600">
                              {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: es })}
                            </span>
                          </div>
                          <Link href={`/admin/support/${ticket.id}`} className="text-sm font-semibold text-white hover:text-brand-300 transition-colors truncate block mb-1">
                            {ticket.subject}
                          </Link>
                          {lastMessage && (
                            <p className="text-xs text-dark-500 truncate mb-2">{lastMessage.content}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border font-medium ${statusConf.bg} ${statusConf.border} ${statusConf.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot} ${isOpen ? 'animate-pulse' : ''}`} />
                              {statusConf.label}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border font-medium ${priorityConf.bg} ${priorityConf.border} ${priorityConf.color}`}>
                              {priorityConf.label}
                            </span>
                            <span className="text-[10px] text-dark-600 flex items-center gap-1">
                              <FiMessageCircle size={8} />
                              {ticket._count?.messages || 0}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isOpen ? (
                            <button
                              onClick={() => closeTicket(ticket.id)}
                              disabled={updatingId === ticket.id}
                              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/15 hover:bg-green-500/20 transition-all duration-200 flex items-center gap-1.5 font-medium"
                            >
                              {updatingId === ticket.id ? <FiLoader size={10} className="animate-spin" /> : <FiCheckCircle size={10} />}
                              Cerrar
                            </button>
                          ) : (
                            <button
                              onClick={() => reopenTicket(ticket.id)}
                              disabled={updatingId === ticket.id}
                              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/15 hover:bg-blue-500/20 transition-all duration-200 flex items-center gap-1.5 font-medium"
                            >
                              Reabrir
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmDelete({ open: true, id: ticket.id })}
                            className="text-[11px] px-2 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/15 hover:bg-red-500/20 transition-all duration-200"
                            title="Eliminar ticket"
                          >
                            <FiTrash2 size={10} />
                          </button>
                          <Link href={`/admin/support/${ticket.id}`} className="p-1.5 rounded-lg text-dark-600 hover:text-brand-400 hover:bg-dark-800/50 transition-all">
                            <FiChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmDelete.open}
        title="Eliminar ticket"
        message="Se eliminará este ticket y todos sus mensajes de forma permanente. Esta acción no se puede deshacer."
        confirmText="Eliminar ticket"
        variant="danger"
        loading={deleting}
        onConfirm={deleteTicket}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />
    </div>
  );
}
