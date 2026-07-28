'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiPlus, FiMessageCircle, FiClock, FiLoader, FiX, FiSend, FiAlertCircle, FiCheckCircle, FiTag,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SupportTicket } from '@/types';

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  LOW: { label: 'Baja', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: <FiTag size={10} /> },
  MEDIUM: { label: 'Media', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: <FiAlertCircle size={10} /> },
  HIGH: { label: 'Alta', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: <FiAlertCircle size={10} /> },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'Abierto', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  CLOSED: { label: 'Cerrado', color: 'text-dark-500', bg: 'bg-dark-700/50 border-dark-600/20' },
};

export default function SoportePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/support/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') loadTickets();
  }, [status, loadTickets]);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, priority }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Ticket creado');
        setSubject('');
        setMessage('');
        setPriority('MEDIUM');
        setShowCreate(false);
        router.push(`/soporte/${data.ticket.id}`);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al crear ticket');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setCreating(false);
    }
  }

  const openTickets = tickets.filter((t) => t.status === 'OPEN');
  const closedTickets = tickets.filter((t) => t.status === 'CLOSED');

  if (loading) {
    return (
      <div className="py-12 section">
        <div className="max-w-3xl mx-auto animate-pulse space-y-4">
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
      <div className="section max-w-3xl mx-auto">
        <Link href="/dashboard" className="text-dark-400 hover:text-white text-sm mb-6 flex items-center gap-1.5 transition-colors">
          <FiArrowLeft size={14} /> Volver al dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Soporte</h1>
            <p className="text-dark-400">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
              {openTickets.length > 0 && (
                <span className="ml-2 text-green-400">· {openTickets.length} abierto{openTickets.length !== 1 ? 's' : ''}</span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
          >
            {showCreate ? <FiX size={14} /> : <FiPlus size={14} />}
            {showCreate ? 'Cancelar' : 'Nuevo Ticket'}
          </button>
        </div>

        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <form onSubmit={createTicket} className="card p-6 space-y-4">
                <div>
                  <label className="text-xs text-dark-400 mb-1.5 block">Asunto</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Describe brevemente tu problema..."
                    className="input w-full"
                    maxLength={200}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1.5 block">Prioridad</label>
                  <div className="flex gap-2">
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPriority(key)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          priority === key
                            ? `${config.bg} ${config.color}`
                            : 'bg-dark-800/50 border-dark-700/50 text-dark-400 hover:text-white'
                        }`}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1.5 block">Mensaje</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Explica tu consulta en detalle..."
                    className="input w-full h-32 resize-none"
                    maxLength={5000}
                    required
                  />
                  <p className="text-[10px] text-dark-600 mt-1 text-right">{message.length}/5000</p>
                </div>
                <button
                  type="submit"
                  disabled={creating || !subject.trim() || !message.trim()}
                  className="btn-primary text-sm py-2.5 px-6 flex items-center gap-2 disabled:opacity-50"
                >
                  {creating ? <FiLoader size={14} className="animate-spin" /> : <FiSend size={14} />}
                  Enviar Ticket
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {tickets.length === 0 ? (
          <div className="card p-12 text-center">
            <FiMessageCircle size={32} className="text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400 text-sm mb-1">No hay tickets todavía</p>
            <p className="text-dark-600 text-xs">Crea un ticket para contactar al staff</p>
          </div>
        ) : (
          <div className="space-y-8">
            {openTickets.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-dark-400 mb-3 flex items-center gap-2">
                  <FiCheckCircle size={14} className="text-green-400" />
                  Abiertos ({openTickets.length})
                </h2>
                <div className="space-y-2">
                  {openTickets.map((ticket, i) => (
                    <TicketCard key={ticket.id} ticket={ticket} index={i} />
                  ))}
                </div>
              </div>
            )}

            {closedTickets.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-dark-500 mb-3 flex items-center gap-2">
                  <FiClock size={14} />
                  Cerrados ({closedTickets.length})
                </h2>
                <div className="space-y-2">
                  {closedTickets.map((ticket, i) => (
                    <TicketCard key={ticket.id} ticket={ticket} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TicketCard({ ticket, index }: { ticket: SupportTicket; index: number }) {
  const statusConf = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
  const priorityConf = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM;
  const lastMessage = (ticket as any).messages?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link href={`/soporte/${ticket.id}`} className="card p-4 flex items-start gap-3 hover:bg-dark-800/30 transition-colors block">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 border border-brand-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <FiMessageCircle size={16} className="text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-white truncate">{ticket.subject}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${statusConf.bg} ${statusConf.color}`}>
              {statusConf.label}
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${priorityConf.bg} ${priorityConf.color} flex items-center gap-1`}>
              {priorityConf.icon}
              {priorityConf.label}
            </span>
          </div>
          {lastMessage && (
            <p className="text-xs text-dark-400 truncate">{lastMessage.content}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-dark-500 flex items-center gap-1">
              <FiMessageCircle size={9} />
              {ticket._count?.messages || 0} mensaje{((ticket._count?.messages || 0) !== 1) ? 's' : ''}
            </span>
            <span className="text-[10px] text-dark-600">
              {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true, locale: es })}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
