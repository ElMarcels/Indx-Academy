'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiSend, FiMessage, FiUsers, FiChevronDown } from 'react-icons/fi';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
}

interface ChatProps {
  groupId?: string;
}

export function ChatPanel({ groupId }: ChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages() {
    try {
      const url = groupId ? `/api/chat?groupId=${groupId}` : '/api/chat';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input, groupId }),
      });
      if (res.ok) {
        setInput('');
        await loadMessages();
      } else {
        toast.error('Error al enviar mensaje');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSending(false);
    }
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  if (loading) {
    return (
      <div className="card p-6 h-96 flex items-center justify-center">
        <div className="animate-pulse text-dark-500">Cargando chat...</div>
      </div>
    );
  }

  return (
    <div className="card flex flex-col h-96">
      <div className="p-4 border-b border-dark-800/50 flex items-center gap-2">
        <FiMessage size={16} className="text-brand-400" />
        <h3 className="font-semibold text-white text-sm">
          {groupId ? 'Chat del Grupo' : 'Chat General'}
        </h3>
        <span className="badge-blue text-[10px] ml-auto">{messages.length} mensajes</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-dark-500 text-sm py-8">
            No hay mensajes aún. ¡Sé el primero!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === (session?.user as any)?.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && (
                  <span className="text-xs text-brand-400 mb-1">{msg.senderName}</span>
                )}
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-brand-600 text-white rounded-br-sm'
                    : 'bg-dark-800 text-dark-200 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-dark-600 mt-1">{formatTime(msg.createdAt)}</span>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-dark-800/50">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Escribe un mensaje..."
            className="input flex-1 text-sm"
          />
          <motion.button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="btn-primary py-2 px-4"
            whileTap={{ scale: 0.95 }}
          >
            <FiSend size={16} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
