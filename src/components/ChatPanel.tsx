'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FiSend, FiMessageSquare, FiSearch, FiPaperclip, FiPin, FiTrash2,
  FiX, FiImage, FiFile, FiMoreVertical, FiDownload,
} from 'react-icons/fi';
import { ProfilePopup } from '@/components/ProfilePopup';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderImage: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  isPinned?: boolean;
  createdAt: string;
}

interface ChatProps {
  groupId?: string;
  contactId?: string;
  contactName?: string;
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function isImageType(type: string | null | undefined): boolean {
  return !!type && type.startsWith('image/');
}

function isVideoType(type: string | null | undefined): boolean {
  return !!type && type.startsWith('video/');
}

export function ChatPanel({ groupId, contactId, contactName }: ChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Typing indicator
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);

  // Pinned messages
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [showPinned, setShowPinned] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msg: Message } | null>(null);

  // File upload
  const [uploadingFile, setUploadingFile] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      let url = '/api/chat';
      if (groupId) url = `/api/chat?groupId=${groupId}`;
      else if (contactId) url = `/api/chat?contactId=${contactId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [groupId, contactId]);

  const loadPinned = useCallback(async () => {
    try {
      let url = '/api/chat?pinned=true';
      if (groupId) url = `/api/chat?groupId=${groupId}&pinned=true`;
      else if (contactId) url = `/api/chat?contactId=${contactId}&pinned=true`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPinnedMessages(data.messages);
      }
    } catch { /* silent */ }
  }, [groupId, contactId]);

  const loadTyping = useCallback(async () => {
    try {
      let url = '/api/chat/typing';
      if (groupId) url = `/api/chat/typing?groupId=${groupId}`;
      else if (contactId) url = `/api/chat/typing?contactId=${contactId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTypingUsers(data.typing || []);
      }
    } catch { /* silent */ }
  }, [groupId, contactId]);

  const sendTyping = useCallback(async () => {
    try {
      await fetch('/api/chat/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, contactId }),
      });
    } catch { /* silent */ }
  }, [groupId, contactId]);

  useEffect(() => {
    loadMessages();
    loadPinned();
    const msgInterval = setInterval(loadMessages, 5000);
    const typingInterval = setInterval(loadTyping, 2000);
    const pinnedInterval = setInterval(loadPinned, 10000);
    return () => {
      clearInterval(msgInterval);
      clearInterval(typingInterval);
      clearInterval(pinnedInterval);
    };
  }, [loadMessages, loadPinned, loadTyping]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if ((!input.trim() && !uploadingFile) || sending) return;
    setSending(true);
    try {
      const body: any = { content: input };
      if (groupId) body.groupId = groupId;
      if (contactId) body.receiverId = contactId;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no debe superar 10MB');
      return;
    }

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload/chat', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        toast.error('Error al subir archivo');
        return;
      }
      const { url, name, type } = await uploadRes.json();

      const body: any = { content: input || '', fileUrl: url, fileName: name, fileType: type };
      if (groupId) body.groupId = groupId;
      if (contactId) body.receiverId = contactId;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setInput('');
        await loadMessages();
        toast.success('Archivo enviado');
      } else {
        toast.error('Error al enviar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      let url = `/api/chat?search=${encodeURIComponent(searchQuery)}`;
      if (groupId) url = `/api/chat?groupId=${groupId}&search=${encodeURIComponent(searchQuery)}`;
      else if (contactId) url = `/api/chat?contactId=${contactId}&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.messages);
      }
    } catch { /* silent */ }
  }

  async function togglePin(msgId: string) {
    try {
      const res = await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msgId }),
      });
      if (res.ok) {
        toast.success('Mensaje fijado/desfijado');
        await loadMessages();
        await loadPinned();
      }
    } catch {
      toast.error('Error al fijar');
    }
    setContextMenu(null);
  }

  async function deleteMessage(msgId: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/chat?messageId=${msgId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Mensaje eliminado');
        await loadMessages();
        await loadPinned();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al eliminar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
      setContextMenu(null);
    }
  }

  function handleContextMenu(e: React.MouseEvent, msg: Message) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, msg });
  }

  useEffect(() => {
    function closeMenu() { setContextMenu(null); }
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const myId = (session?.user as any)?.id;
  const pinnedCount = pinnedMessages.length;

  if (loading) {
    return (
      <div className="card p-6 h-96 flex items-center justify-center">
        <div className="animate-pulse text-dark-500">Cargando chat...</div>
      </div>
    );
  }

  return (
    <>
      <div className="card flex flex-col h-[500px]">
        {/* Header */}
        <div className="p-4 border-b border-dark-800/50 flex items-center gap-2">
          <FiMessageSquare size={16} className="text-brand-400" />
          <h3 className="font-semibold text-white text-sm">
            {groupId ? 'Chat del Grupo' : contactId ? (contactName || 'Chat Privado') : 'Chat General'}
          </h3>
          <div className="flex items-center gap-1 ml-auto">
            {pinnedCount > 0 && (
              <button
                onClick={() => setShowPinned(!showPinned)}
                className="flex items-center gap-1 text-xs text-dark-400 hover:text-brand-400 transition-colors px-2 py-1 rounded-lg hover:bg-dark-800/50"
              >
                <FiPin size={12} /> {pinnedCount}
              </button>
            )}
            <button
              onClick={() => { setShowSearch(!showSearch); setSearchResults([]); setSearchQuery(''); }}
              className={`p-1.5 rounded-lg transition-colors ${showSearch ? 'text-brand-400 bg-brand-500/10' : 'text-dark-400 hover:text-white hover:bg-dark-800/50'}`}
            >
              <FiSearch size={14} />
            </button>
            <span className="badge-blue text-[10px]">{messages.length}</span>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-dark-800/50"
            >
              <div className="p-3 flex gap-2">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Buscar en la conversación..."
                  className="input text-sm py-1.5"
                  autoFocus
                />
                <button onClick={handleSearch} className="btn-primary text-xs py-1.5 px-3">Buscar</button>
              </div>
              {searchResults.length > 0 && (
                <div className="px-3 pb-3 max-h-32 overflow-y-auto space-y-1">
                  <p className="text-[10px] text-dark-500 mb-1">{searchResults.length} resultados</p>
                  {searchResults.slice(0, 10).map((r) => (
                    <div key={r.id} className="p-2 bg-dark-800/50 rounded-lg text-xs">
                      <span className="text-brand-400 font-medium">{r.senderName}</span>
                      <span className="text-dark-400 ml-2">{formatTime(r.createdAt)}</span>
                      <p className="text-dark-200 mt-0.5 truncate">{r.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pinned messages bar */}
        <AnimatePresence>
          {showPinned && pinnedMessages.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-dark-800/50"
            >
              <div className="p-3 max-h-40 overflow-y-auto space-y-1">
                <p className="text-[10px] text-dark-500 mb-1 flex items-center gap-1"><FiPin size={10} /> Mensajes fijados</p>
                {pinnedMessages.map((pm) => (
                  <div key={pm.id} className="p-2 bg-brand-500/5 border border-brand-500/10 rounded-lg text-xs flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <span className="text-brand-400 font-medium">{pm.senderName}</span>
                      <p className="text-dark-200 truncate">{pm.content}</p>
                    </div>
                    <button onClick={() => togglePin(pm.id)} className="text-dark-500 hover:text-yellow-400 ml-2 flex-shrink-0">
                      <FiX size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-dark-500 text-sm py-8">
              No hay mensajes aún. ¡Sé el primero!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === myId;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  onContextMenu={(e) => handleContextMenu(e, msg)}
                >
                  {/* Sender info with avatar */}
                  {!isMe && (
                    <div className="flex items-center gap-2 mb-1">
                      <ProfilePopup userId={msg.senderId}>
                        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 cursor-pointer">
                          {msg.senderImage ? (
                            <img src={msg.senderImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-brand-500/30 to-accent-500/20 flex items-center justify-center">
                              <span className="text-[8px] font-bold text-white/80">{(msg.senderName || '?')[0].toUpperCase()}</span>
                            </div>
                          )}
                        </div>
                      </ProfilePopup>
                      <span className="text-xs text-brand-400">{msg.senderName}</span>
                      {msg.isPinned && <FiPin size={10} className="text-yellow-400" />}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm group relative ${
                    isMe
                      ? 'bg-brand-600 text-white rounded-br-sm'
                      : 'bg-dark-800 text-dark-200 rounded-bl-sm'
                  }`}>
                    {/* File attachment */}
                    {msg.fileUrl && (
                      <div className="mb-2">
                        {isImageType(msg.fileType) ? (
                          <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                            <img src={msg.fileUrl} alt={msg.fileName || ''} className="max-w-[200px] max-h-[200px] rounded-lg object-cover" />
                          </a>
                        ) : isVideoType(msg.fileType) ? (
                          <video src={msg.fileUrl} controls className="max-w-[250px] rounded-lg" />
                        ) : (
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-dark-900/50 rounded-lg hover:bg-dark-900/80 transition-colors"
                          >
                            <FiFile size={16} className="text-brand-400 flex-shrink-0" />
                            <span className="text-xs truncate">{msg.fileName || 'Archivo'}</span>
                            <FiDownload size={12} className="text-dark-500 flex-shrink-0" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Markdown content */}
                    {msg.content && (
                      <div className={`chat-markdown ${isMe ? 'chat-markdown-dark' : ''}`}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              if (match) {
                                return (
                                  <pre className="bg-dark-950/50 rounded-lg p-2 overflow-x-auto my-1">
                                    <code className={className} {...props}>{children}</code>
                                  </pre>
                                );
                              }
                              return (
                                <code className="bg-dark-950/30 px-1 rounded text-xs font-mono" {...props}>{children}</code>
                              );
                            },
                            p({ children }) { return <p className="mb-1 last:mb-0">{children}</p>; },
                            ul({ children }) { return <ul className="list-disc pl-4 mb-1">{children}</ul>; },
                            ol({ children }) { return <ol className="list-decimal pl-4 mb-1">{children}</ol>; },
                            strong({ children }) { return <strong className="font-bold">{children}</strong>; },
                            a({ href, children }) {
                              return <a href={href} target="_blank" rel="noopener noreferrer" className="underline opacity-90 hover:opacity-100">{children}</a>;
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Pin indicator for own messages */}
                    {isMe && msg.isPinned && (
                      <FiPin size={10} className="absolute -top-1 -right-1 text-yellow-400" />
                    )}
                  </div>

                  <span className="text-[10px] text-dark-600 mt-1">{formatTime(msg.createdAt)}</span>
                </motion.div>
              );
            })
          )}

          {/* Typing indicator */}
          <AnimatePresence>
            {typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="flex items-center gap-2 text-xs text-dark-400"
              >
                <div className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                {typingUsers.length === 1
                  ? `${typingUsers[0]} está escribiendo...`
                  : `${typingUsers.join(', ')} están escribiendo...`}
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-dark-800/50">
          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
              className="p-2 text-dark-400 hover:text-brand-400 transition-colors flex-shrink-0 disabled:opacity-50"
              title="Adjuntar archivo"
            >
              {uploadingFile ? (
                <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiPaperclip size={16} />
              )}
            </button>
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                sendTyping();
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {}, 3000);
              }}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Escribe un mensaje... (Markdown soportado)"
              className="input flex-1 text-sm min-h-[38px]"
            />
            <motion.button
              onClick={sendMessage}
              disabled={(!input.trim() && !uploadingFile) || sending}
              className="btn-primary py-2 px-4 flex-shrink-0"
              whileTap={{ scale: 0.95 }}
            >
              <FiSend size={16} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 card p-1.5 min-w-[140px] shadow-2xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.msg.senderId === myId && (
              <>
                <button
                  onClick={() => togglePin(contextMenu.msg.id)}
                  className="w-full text-left px-3 py-1.5 text-xs text-dark-200 hover:bg-dark-700 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FiPin size={12} /> {contextMenu.msg.isPinned ? 'Desfijar' : 'Fijar mensaje'}
                </button>
                <button
                  onClick={() => { setDeleteTarget(contextMenu.msg.id); setContextMenu(null); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FiTrash2 size={12} /> Eliminar
                </button>
              </>
            )}
            {contextMenu.msg.senderId !== myId && groupId && (
              <button
                onClick={() => togglePin(contextMenu.msg.id)}
                className="w-full text-left px-3 py-1.5 text-xs text-dark-200 hover:bg-dark-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FiPin size={12} /> {contextMenu.msg.isPinned ? 'Desfijar' : 'Fijar mensaje'}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Eliminar mensaje"
        message="¿Estás seguro de que quieres eliminar este mensaje? Esta acción no se puede deshacer."
        onConfirm={() => deleteTarget && deleteMessage(deleteTarget)}
        onCancel={() => { setDeleteTarget(null); setContextMenu(null); }}
        loading={deleting}
      />
    </>
  );
}
