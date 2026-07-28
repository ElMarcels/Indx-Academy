'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiSend, FiLoader, FiUser, FiShield, FiCheckCircle, FiLock,
  FiTag, FiAlertCircle, FiClock, FiMail, FiAlertOctagon,
} from 'react-icons/fi';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SupportTicketDetail } from '@/types';
import { ConfirmModal } from '@/components/ConfirmModal';

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  LOW: { label: 'Baja', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: <FiTag size={10} /> },
  MEDIUM: { label: 'Media', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: <FiAlertCircle size={10} /> },
  HIGH: { label: 'Alta', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: <FiAlertOctagon size={10} /> },
};

export default function AdminTicketDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const ticketId = params.ticketId as string;
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userId = (session?.user as any)?.id;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const loadTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setTicket(data.ticket);
      } else {
        toast.error('Ticket no encontrado');
        router.push('/admin/support');
      }
    } catch {
      toast.error('Error al cargar ticket');
    } finally {
      setLoading(false);
    }
  }, [ticketId, router]);

  useEffect(() => {
    if (status === 'authenticated') loadTicket();
  }, [status, loadTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.ok) {
        const data = await res.json();
        setTicket((prev) => prev ? {
          ...prev,
          messages: [...prev.messages, data.message],
          updatedAt: new Date().toISOString(),
        } : null);
        setNewMessage('');
        inputRef.current?.focus();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al enviar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSending(false);
    }
  }

  async function toggleClose() {
    if (!ticket) return;
    setClosing(true);
    try {
      const newStatus = ticket.status === 'OPEN' ? 'CLOSED' : 'OPEN';
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTicket((prev) => prev ? { ...prev, status: newStatus } : null);
        toast.success(newStatus === 'CLOSED' ? 'Ticket cerrado' : 'Ticket reabierto');
      } else {
        toast.error('Error al actualizar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setClosing(false);
    }
  }

  if (loading || !ticket) {
    return (
      <div className="py-12 section">
        <div className="max-w-4xl mx-auto animate-pulse space-y-4">
          <div className="h-4 skeleton w-1/4" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
          </div>
          <div className="h-[500px] skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  const isOpen = ticket.status === 'OPEN';
  const priorityConf = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM;
  const lastMsg = ticket.messages[ticket.messages.length - 1];
  const lastActivity = lastMsg ? formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: true, locale: es }) : null;

  return (
    <div className="py-8 md:py-12">
      <div className="section max-w-4xl mx-auto">
        <Link href="/admin/support" className="text-dark-400 hover:text-white text-sm mb-6 flex items-center gap-1.5 transition-colors group w-fit">
          <FiArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Tickets de soporte
        </Link>

        <div className="grid md:grid-cols-[1fr_320px] gap-4">
          {/* Chat Column */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-900/80 border border-dark-800/50 rounded-2xl overflow-hidden backdrop-blur-sm"
          >
            <div className="h-[500px] md:h-[600px] overflow-y-auto p-4 md:p-5 space-y-1 scroll-smooth">
              {ticket.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-dark-600 text-sm">No hay mensajes</p>
                </div>
              ) : (
                ticket.messages.map((msg) => {
                  const isOwn = msg.senderId === userId;
                  const isStaff = msg.sender.role === 'ADMIN';

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-2.5 py-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isStaff
                          ? 'bg-gradient-to-br from-accent-500/25 to-brand-500/25 border border-accent-500/20'
                          : 'bg-gradient-to-br from-brand-500/20 to-blue-500/20 border border-brand-500/20'
                      }`}>
                        {msg.sender.image ? (
                          <img src={msg.sender.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : isStaff ? (
                          <FiShield size={13} className="text-accent-400" />
                        ) : (
                          <FiUser size={13} className="text-brand-400" />
                        )}
                      </div>
                      <div className={`max-w-[78%] ${isOwn ? 'items-end' : ''}`}>
                        <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[11px] font-medium text-dark-300">
                            {isStaff ? (
                              <span className="text-accent-400">Staff (Tú)</span>
                            ) : (
                              msg.sender.name || msg.sender.email
                            )}
                          </span>
                          <span className="text-[9px] text-dark-600">
                            {format(new Date(msg.createdAt), 'HH:mm', { locale: es })}
                          </span>
                        </div>
                        <div className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                          isOwn
                            ? 'bg-accent-600/10 border border-accent-500/10 text-dark-100 rounded-br-md'
                            : 'bg-dark-800/80 border border-dark-700/40 text-dark-200 rounded-bl-md'
                        }`}>
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-dark-800/50 p-4">
              {isOpen ? (
                <form onSubmit={sendMessage} className="flex gap-3 items-end">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Responder como staff..."
                      className="input w-full pr-12"
                      maxLength={5000}
                      disabled={sending}
                      autoFocus
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-dark-700">
                      {newMessage.length > 0 && `${newMessage.length}`}
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-brand-600/20 flex items-center gap-2"
                  >
                    {sending ? <FiLoader size={14} className="animate-spin" /> : <FiSend size={14} />}
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setConfirmClose(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all text-sm font-medium"
                >
                  <FiLock size={14} />
                  Reabrir ticket
                </button>
              )}
            </div>
          </motion.div>

          {/* Info Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {/* User Card */}
            <div className="bg-dark-900/80 border border-dark-800/50 rounded-2xl p-5 backdrop-blur-sm">
              <h3 className="text-[10px] font-semibold text-dark-500 uppercase tracking-wider mb-4">Usuario</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-blue-500/20 border border-brand-500/15 flex items-center justify-center">
                  {ticket.user.image ? (
                    <img src={ticket.user.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <FiUser size={18} className="text-brand-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{ticket.user.name || 'Sin nombre'}</p>
                  <p className="text-[11px] text-dark-500">{ticket.user.email}</p>
                </div>
              </div>
            </div>

            {/* Ticket Info */}
            <div className="bg-dark-900/80 border border-dark-800/50 rounded-2xl p-5 backdrop-blur-sm">
              <h3 className="text-[10px] font-semibold text-dark-500 uppercase tracking-wider mb-4">Detalles</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-dark-400 flex items-center gap-1.5">
                    {isOpen ? <FiCheckCircle size={11} className="text-green-400" /> : <FiLock size={11} />}
                    Estado
                  </span>
                  <span className={`text-xs font-medium ${isOpen ? 'text-green-400' : 'text-dark-500'}`}>
                    {isOpen ? 'Abierto' : 'Cerrado'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-dark-400 flex items-center gap-1.5">
                    {priorityConf.icon}
                    Prioridad
                  </span>
                  <span className={`text-xs font-medium ${priorityConf.color}`}>{priorityConf.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-dark-400 flex items-center gap-1.5">
                    <FiMail size={11} />
                    Mensajes
                  </span>
                  <span className="text-xs font-medium text-white">{ticket.messages.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-dark-400 flex items-center gap-1.5">
                    <FiClock size={11} />
                    Creado
                  </span>
                  <span className="text-[11px] text-dark-500">
                    {format(new Date(ticket.createdAt), "d MMM yyyy", { locale: es })}
                  </span>
                </div>
                {lastActivity && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-dark-400">Última actividad</span>
                    <span className="text-[11px] text-dark-500">{lastActivity}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-dark-900/80 border border-dark-800/50 rounded-2xl p-5 backdrop-blur-sm">
              <h3 className="text-[10px] font-semibold text-dark-500 uppercase tracking-wider mb-4">Acciones</h3>
              <button
                onClick={() => setConfirmClose(true)}
                disabled={closing}
                className={`w-full text-xs font-medium py-2.5 px-4 rounded-xl border transition-all duration-200 flex items-center justify-center gap-2 ${
                  isOpen
                    ? 'bg-green-500/10 text-green-400 border-green-500/15 hover:bg-green-500/20'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/15 hover:bg-blue-500/20'
                }`}
              >
                {closing ? (
                  <FiLoader size={12} className="animate-spin" />
                ) : isOpen ? (
                  <FiCheckCircle size={12} />
                ) : (
                  <FiLock size={12} />
                )}
                {isOpen ? 'Cerrar ticket' : 'Reabrir ticket'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <ConfirmModal
        open={confirmClose}
        title={isOpen ? 'Cerrar ticket' : 'Reabrir ticket'}
        message={isOpen
          ? 'Al cerrar este ticket, el usuario no podrá enviar más mensajes. ¿Estás seguro?'
          : 'Al reabrir este ticket, el usuario podrá volver a enviar mensajes.'}
        confirmText={isOpen ? 'Cerrar ticket' : 'Reabrir ticket'}
        variant={isOpen ? 'info' : 'info'}
        loading={closing}
        onConfirm={() => { setConfirmClose(false); toggleClose(); }}
        onCancel={() => setConfirmClose(false)}
      />
    </div>
  );
}
