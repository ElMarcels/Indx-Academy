'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FiMessageSquare, FiX, FiSend, FiLoader, FiPlus, FiChevronDown, FiTrash2, FiBook,
} from 'react-icons/fi';

interface AIMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface AIConversation {
  id: string;
  title: string | null;
  courseId: string | null;
  createdAt: string;
  _count?: { messages: number };
  course?: { title: string } | null;
}

interface CourseOption {
  id: string;
  title: string;
}

export function AIAssistant() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showConversations, setShowConversations] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen && session) {
      loadConversations();
      loadCourses();
    }
  }, [isOpen, session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function loadConversations() {
    setLoadingConversations(true);
    try {
      const res = await fetch('/api/ai/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch { /* silent */ } finally {
      setLoadingConversations(false);
    }
  }

  async function loadCourses() {
    try {
      const res = await fetch('/api/ai/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch { /* silent */ }
  }

  async function loadConversation(id: string) {
    setActiveConversation(id);
    setShowConversations(false);
    try {
      const res = await fetch(`/api/ai/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setSelectedCourseId(data.courseId || null);
      }
    } catch { /* silent */ }
  }

  async function startNewConversation() {
    setActiveConversation(null);
    setMessages([]);
    setSelectedCourseId(null);
    setShowConversations(false);
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput('');
    setSending(true);

    const tempUserMsg: AIMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMsg,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          conversationId: activeConversation,
          courseId: selectedCourseId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev.filter((m) => !m.id.startsWith('temp-')),
          { id: `u-${Date.now()}`, role: 'user', content: userMsg, createdAt: new Date().toISOString() },
          data.message,
        ]);
        if (!activeConversation && data.conversationId) {
          setActiveConversation(data.conversationId);
          loadConversations();
        }
      } else {
        setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));
        toast.error('Error al obtener respuesta');
      }
    } catch {
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));
      toast.error('Error de conexión');
    } finally {
      setSending(false);
    }
  }

  async function deleteConversation(id: string) {
    try {
      await fetch(`/api/ai/conversations/${id}`, { method: 'DELETE' });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversation === id) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch { /* silent */ }
  }

  if (!session) return null;

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lg shadow-brand-500/25 flex items-center justify-center hover:shadow-brand-500/40 transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <FiX size={22} /> : <FiMessageSquare size={22} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] bg-dark-900 border border-dark-800/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ height: '550px' }}
          >
            <div className="p-4 border-b border-dark-800/50 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 border border-brand-500/20 flex items-center justify-center">
                <FiMessageSquare size={16} className="text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">Asistente IA</h3>
                <p className="text-[10px] text-dark-500">Pregúntame lo que quieras</p>
              </div>
              <button
                onClick={() => setShowConversations(!showConversations)}
                className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800/50 transition-colors"
              >
                {showConversations ? <FiChevronDown size={14} /> : <FiPlus size={14} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800/50 transition-colors"
              >
                <FiX size={14} />
              </button>
            </div>

            <AnimatePresence>
              {showConversations && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-dark-800/50"
                >
                  <div className="p-3 max-h-40 overflow-y-auto">
                    <button
                      onClick={startNewConversation}
                      className="w-full text-left px-3 py-2 text-xs text-brand-400 hover:bg-dark-800/50 rounded-lg flex items-center gap-2 transition-colors mb-1"
                    >
                      <FiPlus size={12} /> Nueva conversación
                    </button>
                    {loadingConversations ? (
                      <div className="px-3 py-2 text-xs text-dark-500">Cargando...</div>
                    ) : conversations.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-dark-500">Sin conversaciones</div>
                    ) : (
                      conversations.map((conv) => (
                        <div
                          key={conv.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            activeConversation === conv.id
                              ? 'bg-brand-500/10 text-brand-400'
                              : 'text-dark-300 hover:bg-dark-800/50'
                          }`}
                          onClick={() => loadConversation(conv.id)}
                        >
                          <FiBook size={10} className="flex-shrink-0" />
                          <span className="flex-1 truncate">{conv.title || 'Nueva conversación'}</span>
                          {conv.course && (
                            <span className="text-[9px] text-dark-500 truncate max-w-[80px]">{conv.course.title}</span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                            className="text-dark-600 hover:text-red-400 flex-shrink-0"
                          >
                            <FiTrash2 size={10} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {courses.length > 0 && (
              <div className="px-4 py-2 border-b border-dark-800/30">
                <select
                  value={selectedCourseId || ''}
                  onChange={(e) => setSelectedCourseId(e.target.value || null)}
                  className="w-full text-[11px] bg-dark-800/50 border border-dark-700/50 rounded-lg px-2 py-1.5 text-dark-300 focus:outline-none focus:border-brand-500/50"
                >
                  <option value="">Todas las courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500/10 to-accent-500/10 border border-brand-500/10 flex items-center justify-center mx-auto mb-3">
                    <FiMessageSquare size={20} className="text-brand-400/50" />
                  </div>
                  <p className="text-dark-400 text-sm mb-1">Hola, soy tu asistente IA</p>
                  <p className="text-dark-500 text-xs">Pregúntame sobre cursos, lecciones, glosario o cualquier tema de la plataforma</p>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-sm'
                      : 'bg-dark-800 text-dark-200 rounded-bl-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="chat-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="bg-dark-800 px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-dark-800/50">
              <div className="flex gap-2 items-end">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1 bg-dark-800/50 border border-dark-700/50 rounded-xl px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500/50 resize-none"
                  rows={1}
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-30 transition-colors flex-shrink-0"
                >
                  {sending ? <FiLoader size={16} className="animate-spin" /> : <FiSend size={16} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
