'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FiMessageSquare, FiX, FiSend, FiLoader, FiPlus, FiChevronDown, FiTrash2, FiBook,
  FiShield, FiFileText, FiHelpCircle, FiCode, FiTarget, FiLayers, FiBookOpen, FiGrid,
  FiUsers, FiArrowLeft, FiCheck, FiUpload,
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

interface ModuleOption {
  id: string;
  title: string;
}

interface LessonOption {
  id: string;
  title: string;
}

type ContentType =
  | 'lesson_content'
  | 'lesson_task'
  | 'quiz_questions'
  | 'exercise'
  | 'challenge'
  | 'course_description'
  | 'module_description'
  | 'glossary_term'
  | 'flashcards';

const contentTypes: { value: ContentType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'lesson_content', label: 'Contenido de lección', icon: <FiFileText size={14} />, color: 'text-blue-400' },
  { value: 'lesson_task', label: 'Tarea/Práctica', icon: <FiTarget size={14} />, color: 'text-green-400' },
  { value: 'quiz_questions', label: 'Preguntas de quiz', icon: <FiHelpCircle size={14} />, color: 'text-yellow-400' },
  { value: 'exercise', label: 'Ejercicio de código', icon: <FiCode size={14} />, color: 'text-purple-400' },
  { value: 'challenge', label: 'Desafío', icon: <FiTarget size={14} />, color: 'text-red-400' },
  { value: 'course_description', label: 'Descripción de curso', icon: <FiBookOpen size={14} />, color: 'text-cyan-400' },
  { value: 'module_description', label: 'Descripción de módulo', icon: <FiLayers size={14} />, color: 'text-orange-400' },
  { value: 'glossary_term', label: 'Término de glosario', icon: <FiBook size={14} />, color: 'text-pink-400' },
  { value: 'flashcards', label: 'Flashcards', icon: <FiGrid size={14} />, color: 'text-emerald-400' },
];

export function IndxAI() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'menu' | 'staff' | 'ia'>('menu');
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

  // AI modes: content generation stays available to admins, alongside a private admin chat.
  const [aiMode, setAiMode] = useState<'normal' | 'content' | 'admin'>('normal');
  const [selectedContentType, setSelectedContentType] = useState<ContentType>('lesson_content');
  const [showContentTypeSelector, setShowContentTypeSelector] = useState(false);
  const [adminModules, setAdminModules] = useState<ModuleOption[]>([]);
  const [adminLessons, setAdminLessons] = useState<LessonOption[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [attachment, setAttachment] = useState<{ name: string; mimeType: string; data: string } | null>(null);
  // Kept only for backwards compatibility with an already-open legacy panel;
  // the visible menu now routes exclusively to the full ticket system.
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sendingContact, setSendingContact] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen && selectedOption === 'ia' && session) {
      loadConversations();
      loadCourses();
    }
  }, [isOpen, selectedOption, session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (selectedCourseId && aiMode === 'content') {
      loadModules(selectedCourseId);
    } else {
      setAdminModules([]);
      setSelectedModuleId(null);
      setAdminLessons([]);
      setSelectedLessonId(null);
    }
  }, [selectedCourseId, aiMode]);

  useEffect(() => {
    if (selectedModuleId) {
      loadLessons(selectedModuleId);
    } else {
      setAdminLessons([]);
      setSelectedLessonId(null);
    }
  }, [selectedModuleId]);

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

  async function loadModules(courseId: string) {
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      if (res.ok) {
        const data = await res.json();
        const modules = (data.course?.modules || []).map((m: any) => ({ id: m.id, title: m.title }));
        setAdminModules(modules);
      }
    } catch { /* silent */ }
  }

  async function loadLessons(moduleId: string) {
    try {
      const mod = adminModules.find(m => m.id === moduleId);
      if (mod) {
        const res = await fetch(`/api/courses/${selectedCourseId}`);
        if (res.ok) {
          const data = await res.json();
          const modData = data.course?.modules?.find((m: any) => m.id === moduleId);
          const lessons = (modData?.lessons || []).map((l: any) => ({ id: l.id, title: l.title }));
          setAdminLessons(lessons);
        }
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
    if ((!input.trim() && !attachment) || sending) return;
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
      const res = await fetch(aiMode === 'admin' ? '/api/ai/admin-chat' : '/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiMode === 'admin' ? { message: userMsg, attachment } : {
          message: userMsg, conversationId: activeConversation, courseId: selectedCourseId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev.filter((m) => !m.id.startsWith('temp-')),
          { id: `u-${Date.now()}`, role: 'user', content: userMsg, createdAt: new Date().toISOString() },
          aiMode === 'admin'
            ? { id: `a-${Date.now()}`, role: 'assistant', content: data.content, createdAt: new Date().toISOString() }
            : data.message,
        ]);
        setAttachment(null);
        if (aiMode !== 'admin' && !activeConversation && data.conversationId) {
          setActiveConversation(data.conversationId);
          loadConversations();
        }
      } else {
        setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));
        toast.error('Error al obtener respuesta de IndxAI');
      }
    } catch {
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));
      toast.error('Error de conexión con IndxAI');
    } finally {
      setSending(false);
    }
  }

  function selectAttachment(file?: File) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error('El archivo no puede superar 8 MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setAttachment({ name: file.name, mimeType: file.type || 'application/octet-stream', data: String(reader.result).split(',')[1] });
    reader.readAsDataURL(file);
  }

  async function generateAdminContent() {
    if (!input.trim() || generating) return;
    setGenerating(true);
    setGeneratedContent(null);

    try {
      const res = await fetch('/api/ai/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: selectedContentType,
          courseId: selectedCourseId || undefined,
          moduleId: selectedModuleId || undefined,
          lessonId: selectedLessonId || undefined,
          additionalContext: input.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedContent(data.content);
        setShowPreview(true);
        setInput('');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al generar contenido');
      }
    } catch {
      toast.error('Error al conectar con IndxAI');
    } finally {
      setGenerating(false);
    }
  }

  function copyToClipboard() {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      toast.success('Copiado al portapapeles');
    }
  }

  function closePreview() {
    setShowPreview(false);
    setGeneratedContent(null);
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

  async function sendContactMessage() {
    if (!contactSubject.trim() || !contactMessage.trim() || sendingContact) return;
    setSendingContact(true);
    try {
      const res = await fetch('/api/staff/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: contactSubject, message: contactMessage }),
      });
      if (res.ok) {
        setContactSent(true);
        setContactSubject('');
        setContactMessage('');
        toast.success('Mensaje enviado al staff');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al enviar el mensaje');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSendingContact(false);
    }
  }

  if (!session) return null;

  return (
    <>
      <motion.button
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            setSelectedOption('menu');
          } else {
            setIsOpen(true);
            setSelectedOption('menu');
          }
        }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lg shadow-brand-500/25 flex items-center justify-center hover:shadow-brand-500/40 transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Abrir IndxAI"
      >
        {isOpen ? <FiX size={22} /> : <FiMessageSquare size={22} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && selectedOption === 'menu' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[320px] max-w-[calc(100vw-3rem)] bg-dark-900 border border-dark-800/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-dark-800/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 border border-brand-500/20 flex items-center justify-center">
                  <FiMessageSquare size={16} className="text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white">Menú</h3>
                  <p className="text-[10px] text-dark-500">Selecciona una opción</p>
                </div>
                <button
                  onClick={() => { setIsOpen(false); setSelectedOption('menu'); }}
                  className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800/50 transition-colors"
                >
                  <FiX size={14} />
                </button>
              </div>
            </div>

            <div className="p-3 space-y-2">
              <Link
                href="/soporte"
                onClick={() => setIsOpen(false)}
                className="block w-full text-left px-4 py-3 rounded-xl bg-dark-800/50 border border-dark-700/50 hover:border-brand-500/30 hover:bg-dark-800 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-blue-500/20 border border-brand-500/20 flex items-center justify-center flex-shrink-0 group-hover:border-brand-500/40 transition-colors">
                    <FiUsers size={18} className="text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-brand-400 transition-colors">Tickets de soporte</p>
                    <p className="text-[10px] text-dark-500">Consulta y gestiona tus tickets</p>
                  </div>
                </div>
              </Link>

              <button
                onClick={() => setSelectedOption('ia')}
                className="w-full text-left px-4 py-3 rounded-xl bg-dark-800/50 border border-dark-700/50 hover:border-accent-500/30 hover:bg-dark-800 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500/20 to-purple-500/20 border border-accent-500/20 flex items-center justify-center flex-shrink-0 group-hover:border-accent-500/40 transition-colors">
                    <FiMessageSquare size={18} className="text-accent-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-accent-400 transition-colors">IndxAI</p>
                    <p className="text-[10px] text-dark-500">Asistente de IA potenciado por Gemma 4</p>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {isOpen && selectedOption === 'staff' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)] bg-dark-900 border border-dark-800/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ height: '580px' }}
          >
            {/* Header */}
            <div className="p-4 border-b border-dark-800/50 flex items-center gap-3">
              <button
                onClick={() => setSelectedOption('menu')}
                className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800/50 transition-colors"
              >
                <FiArrowLeft size={14} />
              </button>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/20 to-blue-500/20 border border-brand-500/20 flex items-center justify-center">
                <FiUsers size={16} className="text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">Contacto con el Staff</h3>
                <p className="text-[10px] text-dark-500">Envía tu consulta al equipo</p>
              </div>
              <button
                onClick={() => { setIsOpen(false); setSelectedOption('menu'); }}
                className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800/50 transition-colors"
              >
                <FiX size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {contactSent ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <FiCheck size={24} className="text-green-400" />
                  </div>
                  <p className="text-white text-sm font-medium mb-1">¡Mensaje enviado!</p>
                  <p className="text-dark-500 text-xs mb-6">El staff de la plataforma recibió tu mensaje y te responderá pronto.</p>
                  <button
                    onClick={() => { setContactSent(false); setContactSubject(''); setContactMessage(''); }}
                    className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] text-dark-400 font-medium mb-1.5">Asunto</label>
                    <input
                      type="text"
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      placeholder="Ej: Problema con mi certificado"
                      maxLength={200}
                      className="w-full bg-dark-800/50 border border-dark-700/50 rounded-xl px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500/50"
                    />
                    <p className="text-[9px] text-dark-600 mt-1 text-right">{contactSubject.length}/200</p>
                  </div>
                  <div>
                    <label className="block text-[11px] text-dark-400 font-medium mb-1.5">Mensaje</label>
                    <textarea
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Describe tu consulta o problema detalladamente..."
                      maxLength={5000}
                      rows={8}
                      className="w-full bg-dark-800/50 border border-dark-700/50 rounded-xl px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500/50 resize-none"
                    />
                    <p className="text-[9px] text-dark-600 mt-1 text-right">{contactMessage.length}/5000</p>
                  </div>
                  <button
                    onClick={sendContactMessage}
                    disabled={!contactSubject.trim() || !contactMessage.trim() || sendingContact}
                    className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {sendingContact ? (
                      <>
                        <FiLoader size={14} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <FiSend size={14} />
                        Enviar mensaje
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {isOpen && selectedOption === 'ia' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)] bg-dark-900 border border-dark-800/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ height: '580px' }}
          >
            {/* Header */}
            <div className="p-4 border-b border-dark-800/50 flex items-center gap-3">
              <button
                onClick={() => setSelectedOption('menu')}
                className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800/50 transition-colors"
              >
                <FiArrowLeft size={14} />
              </button>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                aiMode !== 'normal'
                  ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20'
                  : 'bg-gradient-to-br from-brand-500/20 to-accent-500/20 border border-brand-500/20'
              }`}>
                {aiMode !== 'normal' ? (
                  <FiShield size={16} className="text-amber-400" />
                ) : (
                  <FiMessageSquare size={16} className="text-brand-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">IndxAI</h3>
                  {aiMode !== 'normal' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium border border-amber-500/20">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-dark-500">
                  {aiMode === 'content' ? 'Generación de contenido' : aiMode === 'admin' ? 'Chat administrativo privado' : 'Asistente de aprendizaje'}
                </p>
              </div>
              <select
                value={aiMode}
                onChange={(e) => { const next = e.target.value as 'normal' | 'content' | 'admin'; setAiMode(next); setShowPreview(false); setGeneratedContent(null); setAttachment(null); }}
                className="bg-dark-800 border border-dark-700 rounded-lg px-2 py-1 text-[10px] text-dark-200 focus:outline-none"
                aria-label="Modo de IndxAI"
              >
                <option value="normal">Aprendizaje</option>
                {isAdmin && <option value="content">Generar contenido</option>}
                {isAdmin && <option value="admin">Admin privado</option>}
              </select>
              <button
                onClick={() => setShowConversations(!showConversations)}
                className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800/50 transition-colors"
              >
                {showConversations ? <FiChevronDown size={14} /> : <FiPlus size={14} />}
              </button>
              <button
                onClick={() => { setIsOpen(false); setSelectedOption('menu'); }}
                className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800/50 transition-colors"
              >
                <FiX size={14} />
              </button>
            </div>

            {/* Conversations panel */}
            <AnimatePresence>
              {showConversations && aiMode === 'normal' && (
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

            {/* Admin mode: Content type selector */}
            {aiMode === 'content' && (
              <div className="px-4 py-2 border-b border-dark-800/30 space-y-2">
                {/* Course selector */}
                {courses.length > 0 && (
                  <select
                    value={selectedCourseId || ''}
                    onChange={(e) => setSelectedCourseId(e.target.value || null)}
                    className="w-full text-[11px] bg-dark-800/50 border border-dark-700/50 rounded-lg px-2 py-1.5 text-dark-300 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="">Seleccionar curso...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                )}

                {/* Module selector */}
                {selectedCourseId && adminModules.length > 0 && (
                  <select
                    value={selectedModuleId || ''}
                    onChange={(e) => setSelectedModuleId(e.target.value || null)}
                    className="w-full text-[11px] bg-dark-800/50 border border-dark-700/50 rounded-lg px-2 py-1.5 text-dark-300 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="">Seleccionar módulo...</option>
                    {adminModules.map((m) => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                )}

                {/* Content type selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowContentTypeSelector(!showContentTypeSelector)}
                    className="w-full text-[11px] bg-dark-800/50 border border-dark-700/50 rounded-lg px-2 py-1.5 text-dark-300 focus:outline-none focus:border-amber-500/50 flex items-center gap-2"
                  >
                    {contentTypes.find(t => t.value === selectedContentType)?.icon}
                    <span>{contentTypes.find(t => t.value === selectedContentType)?.label}</span>
                    <FiChevronDown size={10} className="ml-auto" />
                  </button>

                  <AnimatePresence>
                    {showContentTypeSelector && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-dark-800 border border-dark-700/50 rounded-lg shadow-xl z-10 overflow-hidden"
                      >
                        {contentTypes.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => {
                              setSelectedContentType(type.value);
                              setShowContentTypeSelector(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-[11px] flex items-center gap-2 transition-colors ${
                              selectedContentType === type.value
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'text-dark-300 hover:bg-dark-700/50'
                            }`}
                          >
                            <span className={type.color}>{type.icon}</span>
                            {type.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Messages / Preview area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Empty state */}
              {messages.length === 0 && aiMode !== 'content' && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500/10 to-accent-500/10 border border-brand-500/10 flex items-center justify-center mx-auto mb-3">
                    <FiMessageSquare size={20} className="text-brand-400/50" />
                  </div>
                  <p className="text-dark-400 text-sm mb-1">Hola, soy <span className="text-brand-400 font-semibold">IndxAI</span></p>
                  <p className="text-dark-500 text-xs mb-2">Tu asistente de IA potenciado por Gemma 4</p>
                  <p className="text-dark-500 text-xs">Pregúntame sobre cursos, lecciones, glosario o cualquier tema de programación</p>
                </div>
              )}

              {/* Admin empty state */}
              {aiMode === 'content' && !showPreview && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/10 flex items-center justify-center mx-auto mb-3">
                    <FiShield size={20} className="text-amber-400/50" />
                  </div>
                  <p className="text-dark-400 text-sm mb-1">Modo <span className="text-amber-400 font-semibold">Administrador</span></p>
                  <p className="text-dark-500 text-xs mb-3">Genera contenido para tus cursos con IA</p>
                  <div className="text-left bg-dark-800/50 rounded-lg p-3 max-w-xs mx-auto">
                    <p className="text-[10px] text-dark-400 mb-2 font-medium">Tipos de contenido disponible:</p>
                    <div className="grid grid-cols-2 gap-1">
                      {contentTypes.map((type) => (
                        <div key={type.value} className="flex items-center gap-1.5 text-[10px] text-dark-500">
                          <span className={type.color}>{type.icon}</span>
                          {type.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Generated content preview */}
              {showPreview && generatedContent && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-amber-400 font-medium">Contenido generado</span>
                    <div className="flex gap-1">
                      <button
                        onClick={copyToClipboard}
                        className="text-[10px] px-2 py-1 rounded bg-dark-800 text-dark-300 hover:bg-dark-700 transition-colors"
                      >
                        Copiar
                      </button>
                      <button
                        onClick={closePreview}
                        className="text-[10px] px-2 py-1 rounded bg-dark-800 text-dark-300 hover:bg-dark-700 transition-colors"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                  <div className="bg-dark-800 rounded-xl p-3 border border-dark-700/50">
                    <div className="chat-markdown text-sm text-dark-200">
                      {selectedContentType === 'quiz_questions' || selectedContentType === 'exercise' || selectedContentType === 'challenge' || selectedContentType === 'glossary_term' || selectedContentType === 'flashcards' ? (
                        <pre className="whitespace-pre-wrap text-xs font-mono text-dark-300 overflow-x-auto">{generatedContent}</pre>
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedContent}</ReactMarkdown>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat messages */}
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

              {/* Loading indicators */}
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

              {generating && (
                <div className="flex justify-start">
                  <div className="bg-dark-800 px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex items-center gap-2">
                      <FiLoader size={14} className="text-amber-400 animate-spin" />
                      <span className="text-xs text-dark-400">Generando contenido...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-3 border-t border-dark-800/50">
              {aiMode === 'admin' && (
                <div className="flex items-center gap-2 mb-2 text-[10px] text-dark-400">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300">
                    <FiUpload size={12} /> Adjuntar archivo
                    <input type="file" className="hidden" accept="image/*,.pdf,.txt,.md,.csv,.json" onChange={(e) => selectAttachment(e.target.files?.[0])} />
                  </label>
                  {attachment && <span className="truncate flex-1">{attachment.name}</span>}
                  {attachment && <button onClick={() => setAttachment(null)} className="text-dark-500 hover:text-red-400">Quitar</button>}
                </div>
              )}
              <div className="flex gap-2 items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (aiMode === 'content' && !showPreview) {
                        generateAdminContent();
                      } else if (aiMode !== 'content') {
                        sendMessage();
                      }
                    }
                  }}
                  placeholder={aiMode === 'content' ? (showPreview ? 'Genera otro contenido...' : 'Describe qué contenido generar...') : aiMode === 'admin' ? 'Consulta o pide evaluar un archivo...' : 'Pregúntale a IndxAI...'}
                  className="flex-1 bg-dark-800/50 border border-dark-700/50 rounded-xl px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500/50 resize-none"
                  rows={1}
                  disabled={sending || generating}
                />
                <button
                  onClick={aiMode === 'content' ? generateAdminContent : sendMessage}
                  disabled={(!input.trim() && !(aiMode === 'admin' && attachment)) || sending || generating}
                  className={`p-2 rounded-xl disabled:opacity-30 transition-colors flex-shrink-0 ${
                    aiMode === 'content'
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-brand-600 hover:bg-brand-500 text-white'
                  }`}
                >
                  {sending || generating ? <FiLoader size={16} className="animate-spin" /> : <FiSend size={16} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
