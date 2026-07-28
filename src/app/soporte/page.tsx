'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiPlus, FiMessageCircle, FiClock, FiLoader, FiX, FiSend, FiTag,
  FiAlertCircle, FiCheckCircle, FiHeadphones, FiChevronRight,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SupportTicket } from '@/types';

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  LOW: { label: 'Baja', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: <FiTag size={10} /> },
  MEDIUM: { label: 'Media', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: <FiAlertCircle size={10} /> },
  HIGH: { label: 'Alta', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: <FiAlertCircle size={10} /> },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  OPEN: { label: 'Abierto', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', dot: 'bg-green-400' },
  CLOSED: { label: 'Cerrado', color: 'text-dark-500', bg: 'bg-dark-700/50', border: 'border-dark-600/20', dot: 'bg-dark-500' },
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
          <div className="h-40 bg-dark-800/50 rounded-3xl" />
          <div className="h-12 bg-dark-800/50 rounded-2xl" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-dark-800/50 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12">
      <div className="section max-w-3xl mx-auto">
        <Link href="/dashboard" className="text-dark-400 hover:text-white text-sm mb-6 flex items-center gap-1.5 transition-colors group w-fit">
          <FiArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Volver al dashboard
        </Link>

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-dark-900 to-accent-600/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(99,102,241,0.15),transparent_60%)]" />
          <div className="relative p-8 md:p-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mb-4 shadow-lg shadow-brand-500/25">
                  <FiHeadphones size={24} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Soporte</h1>
                <p className="text-dark-300 text-sm max-w-md">
                  Contacta con nuestro equipo para resolver cualquier duda o problema. Tus consultas serán atendidas por nuestro staff.
                </p>
              </div>
              <button
                onClick={() => setShowCreate(!showCreate)}
                className={`flex items-center gap-2 text-sm font-semibold py-3 px-5 rounded-xl transition-all duration-300 shadow-lg ${
                  showCreate
                    ? 'bg-dark-800/80 text-dark-300 border border-dark-700/50 hover:bg-dark-700/80'
                    : 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-brand-600/25 hover:shadow-brand-500/40 hover:-translate-y-0.5'
                }`}
              >
                {showCreate ? <FiX size={16} /> : <FiPlus size={16} />}
                {showCreate ? 'Cancelar' : 'Nuevo Ticket'}
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-3 mt-6">
              <div className="flex items-center gap-2 bg-dark-800/40 rounded-xl px-3.5 py-2 border border-dark-700/30">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-dark-300">
                  <span className="text-white font-semibold">{openTickets.length}</span> abierto{openTickets.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-dark-800/40 rounded-xl px-3.5 py-2 border border-dark-700/30">
                <FiClock size={10} className="text-dark-500" />
                <span className="text-xs text-dark-300">
                  <span className="text-white font-semibold">{closedTickets.length}</span> cerrado{closedTickets.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-dark-800/40 rounded-xl px-3.5 py-2 border border-dark-700/30">
                <FiMessageCircle size={10} className="text-dark-500" />
                <span className="text-xs text-dark-300">
                  <span className="text-white font-semibold">{tickets.length}</span> total
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Create Form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={createTicket} className="bg-dark-900/80 border border-dark-800/50 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
                    <FiPlus size={14} className="text-brand-400" />
                  </div>
                  <h2 className="text-white font-semibold">Nuevo Ticket de Soporte</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-dark-400 mb-2 block font-medium uppercase tracking-wider">Asunto</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ej: No puedo acceder a mi curso..."
                      className="input w-full"
                      maxLength={200}
                      required
                    />
                    <p className="text-[10px] text-dark-600 mt-1.5 text-right">{subject.length}/200</p>
                  </div>

                  <div>
                    <label className="text-xs text-dark-400 mb-2 block font-medium uppercase tracking-wider">Prioridad</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setPriority(key)}
                          className={`text-xs px-3 py-2.5 rounded-xl border transition-all duration-200 flex items-center justify-center gap-2 font-medium ${
                            priority === key
                              ? `${config.bg} ${config.color} ${config.border} shadow-lg`
                              : 'bg-dark-800/50 border-dark-700/50 text-dark-400 hover:text-white hover:border-dark-600'
                          }`}
                        >
                          {config.icon}
                          {config.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-dark-400 mb-2 block font-medium uppercase tracking-wider">Mensaje</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe tu problema o consulta en detalle. Cuanta más información nos proporciones, más rápido podremos ayudarte..."
                      className="input w-full h-36 resize-none"
                      maxLength={5000}
                      required
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-dark-600">Mínimo 10 caracteres</span>
                      <span className={`text-[10px] ${message.length > 4500 ? 'text-yellow-400' : 'text-dark-600'}`}>{message.length}/5000</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-dark-800/50">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="btn-secondary text-sm py-2.5 px-5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !subject.trim() || !message.trim()}
                    className="btn-primary text-sm py-2.5 px-6 flex items-center gap-2"
                  >
                    {creating ? <FiLoader size={14} className="animate-spin" /> : <FiSend size={14} />}
                    {creating ? 'Enviando...' : 'Enviar Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ticket List */}
        {tickets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-900/80 border border-dark-800/50 rounded-2xl p-16 text-center backdrop-blur-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-dark-800/50 flex items-center justify-center mx-auto mb-4 border border-dark-700/30">
              <FiMessageCircle size={28} className="text-dark-600" />
            </div>
            <p className="text-white font-medium mb-1">Sin tickets</p>
            <p className="text-dark-500 text-sm max-w-xs mx-auto">
              Aún no has creado ningún ticket de soporte. Crea uno si necesitas ayuda.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {openTickets.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <h2 className="text-xs font-semibold text-dark-300 uppercase tracking-wider">
                    Abiertos · {openTickets.length}
                  </h2>
                </div>
                <div className="space-y-2">
                  {openTickets.map((ticket, i) => (
                    <TicketCard key={ticket.id} ticket={ticket} index={i} />
                  ))}
                </div>
              </div>
            )}

            {closedTickets.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2 h-2 rounded-full bg-dark-600" />
                  <h2 className="text-xs font-semibold text-dark-500 uppercase tracking-wider">
                    Cerrados · {closedTickets.length}
                  </h2>
                </div>
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
  const isOpen = ticket.status === 'OPEN';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link
        href={`/soporte/${ticket.id}`}
        className={`group block bg-dark-900/80 border rounded-2xl p-4 transition-all duration-300 backdrop-blur-sm ${
          isOpen
            ? 'border-dark-800/50 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-600/5 hover:-translate-y-0.5'
            : 'border-dark-800/30 opacity-70 hover:opacity-100 hover:border-dark-700/50'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${
            isOpen
              ? 'bg-gradient-to-br from-brand-500/20 to-accent-500/20 border border-brand-500/20'
              : 'bg-dark-800/50 border border-dark-700/30'
          }`}>
            <FiMessageCircle size={16} className={isOpen ? 'text-brand-400' : 'text-dark-500'} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-white truncate group-hover:text-brand-300 transition-colors">
                {ticket.subject}
              </h3>
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusConf.bg} ${statusConf.border} ${statusConf.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot} ${isOpen ? 'animate-pulse' : ''}`} />
                {statusConf.label}
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${priorityConf.bg} ${priorityConf.border} ${priorityConf.color}`}>
                {priorityConf.icon}
                {priorityConf.label}
              </span>
            </div>
            {lastMessage && (
              <p className="text-xs text-dark-500 truncate mb-1.5">{lastMessage.content}</p>
            )}
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-dark-600 flex items-center gap-1">
                <FiMessageCircle size={8} />
                {ticket._count?.messages || 0} mensaje{((ticket._count?.messages || 0) !== 1) ? 's' : ''}
              </span>
              <span className="text-[10px] text-dark-600">
                hace {formatDistanceToNow(new Date(ticket.updatedAt), { locale: es })}
              </span>
            </div>
          </div>
          <FiChevronRight size={16} className="text-dark-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-3" />
        </div>
      </Link>
    </motion.div>
  );
}
