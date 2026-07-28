'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiSend, FiLoader, FiUser, FiShield, FiAlertCircle, FiTag, FiLock,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SupportTicketDetail } from '@/types';

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Baja', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  MEDIUM: { label: 'Media', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  HIGH: { label: 'Alta', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

export default function TicketDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const ticketId = params.ticketId as string;
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = (session?.user as any)?.id;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const loadTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setTicket(data.ticket);
      } else {
        toast.error('Ticket no encontrado');
        router.push('/soporte');
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

  if (loading || !ticket) {
    return (
      <div className="py-12 section">
        <div className="max-w-3xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-dark-800 rounded w-1/4" />
          <div className="h-64 bg-dark-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  const priorityConf = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM;
  const isOpen = ticket.status === 'OPEN';

  return (
    <div className="py-12">
      <div className="section max-w-3xl mx-auto">
        <Link href="/soporte" className="text-dark-400 hover:text-white text-sm mb-6 flex items-center gap-1.5 transition-colors">
          <FiArrowLeft size={14} /> Mis tickets
        </Link>

        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white mb-2">{ticket.subject}</h1>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                  isOpen ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-dark-700/50 border-dark-600/20 text-dark-500'
                }`}>
                  {isOpen ? 'Abierto' : 'Cerrado'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${priorityConf.bg} ${priorityConf.color}`}>
                  <FiTag size={9} />
                  Prioridad {priorityConf.label}
                </span>
                <span className="text-[10px] text-dark-600">
                  {ticket.messages.length} mensaje{ticket.messages.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="h-[500px] overflow-y-auto p-4 space-y-4">
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
                    className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isStaff
                        ? 'bg-gradient-to-br from-accent-500/20 to-brand-500/20 border border-accent-500/20'
                        : 'bg-gradient-to-br from-brand-500/20 to-blue-500/20 border border-brand-500/20'
                    }`}>
                      {msg.sender.image ? (
                        <img src={msg.sender.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : isStaff ? (
                        <FiShield size={14} className="text-accent-400" />
                      ) : (
                        <FiUser size={14} className="text-brand-400" />
                      )}
                    </div>
                    <div className={`max-w-[75%] ${isOwn ? 'items-end' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-dark-300">
                          {isStaff ? 'Staff' : msg.sender.name || msg.sender.email}
                        </span>
                        <span className="text-[9px] text-dark-600">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                      <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                        isOwn
                          ? 'bg-brand-600/20 border border-brand-500/20 text-dark-100'
                          : isStaff
                            ? 'bg-accent-600/10 border border-accent-500/15 text-dark-100'
                            : 'bg-dark-800/80 border border-dark-700/50 text-dark-200'
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

          <div className="border-t border-dark-800/50 p-4">
            {isOpen ? (
              <form onSubmit={sendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="input flex-1"
                  maxLength={5000}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="btn-primary py-2.5 px-4 flex items-center gap-2 disabled:opacity-50"
                >
                  {sending ? <FiLoader size={14} className="animate-spin" /> : <FiSend size={14} />}
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-2 py-3 text-dark-500 text-sm">
                <FiLock size={14} />
                Este ticket está cerrado
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
