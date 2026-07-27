'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiMessageSquare, FiPlus, FiSearch, FiArrowLeft, FiMapPin, FiCheckCircle,
  FiUser, FiClock, FiSend, FiX, FiFilter, FiFlag,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Reactions } from './Reactions';
import { ReportModal } from './ReportModal';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  userId: string;
  authorName: string;
  isPinned: boolean;
  isResolved: boolean;
  createdAt: string;
  _count: { replies: number };
}

interface ForumReply {
  id: string;
  content: string;
  userId: string;
  authorName: string;
  createdAt: string;
}

interface ForumProps {
  courseId: string;
}

export function Forum({ courseId }: ForumProps) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ targetType: string; targetId: string } | null>(null);

  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const userId = (session?.user as any)?.id;

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/forum?courseId=${courseId}`);
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.posts || []).map((p: any) => ({
          ...p,
          userId: p.userId,
          authorName: p.user?.name || 'Anónimo',
          isPinned: p.isPinned,
          isResolved: p.isResolved,
        }));
        setPosts(mapped);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  async function createPost() {
    if (!newTitle.trim() || !newContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, title: newTitle, content: newContent }),
      });
      if (res.ok) {
        toast.success('Publicación creada');
        setNewTitle('');
        setNewContent('');
        setShowNewPost(false);
        await fetchPosts();
      } else {
        toast.error('Error al crear publicación');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  async function loadReplies(post: ForumPost) {
    setSelectedPost(post);
    setRepliesLoading(true);
    try {
      const res = await fetch(`/api/forum/${post.id}`);
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.replies || []).map((r: any) => ({
          ...r,
          userId: r.userId,
          authorName: r.user?.name || 'Anónimo',
        }));
        setReplies(mapped);
      }
    } catch { /* silent */ } finally {
      setRepliesLoading(false);
    }
  }

  async function sendReply() {
    if (!replyContent.trim() || !selectedPost) return;
    setSendingReply(true);
    try {
      const res = await fetch('/api/forum/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: selectedPost.id, content: replyContent }),
      });
      if (res.ok) {
        setReplyContent('');
        toast.success('Respuesta enviada');
        await loadReplies(selectedPost);
      } else {
        toast.error('Error al enviar respuesta');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSendingReply(false);
    }
  }

  async function togglePin(post: ForumPost) {
    try {
      const res = await fetch(`/api/forum/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !post.isPinned }),
      });
      if (res.ok) {
        toast.success(post.isPinned ? 'Desfijado' : 'Fijado');
        if (selectedPost?.id === post.id) setSelectedPost({ ...post, isPinned: !post.isPinned });
        await fetchPosts();
      }
    } catch { toast.error('Error'); }
  }

  async function toggleResolved(post: ForumPost) {
    try {
      const res = await fetch(`/api/forum/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: !post.isResolved }),
      });
      if (res.ok) {
        toast.success(post.isResolved ? 'Marcado como abierto' : 'Marcado como resuelto');
        if (selectedPost?.id === post.id) setSelectedPost({ ...post, isResolved: !post.isResolved });
        await fetchPosts();
      }
    } catch { toast.error('Error'); }
  }

  const filtered = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase())
  );

  const pinned = filtered.filter((p) => p.isPinned);
  const unpinned = filtered.filter((p) => !p.isPinned);

  if (selectedPost) {
    return (
      <div className="card p-6">
        <motion.button
          onClick={() => { setSelectedPost(null); setReplies([]); }}
          className="flex items-center gap-2 text-dark-400 hover:text-white text-sm mb-4 transition-colors"
          whileHover={{ x: -4 }}
        >
          <FiArrowLeft size={16} /> Volver
        </motion.button>

        <div className="mb-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-xl font-bold text-white">{selectedPost.title}</h2>
            <div className="flex items-center gap-2 shrink-0">
              {selectedPost.isPinned && <span className="badge-yellow text-[10px] flex items-center gap-1"><FiMapPin size={10} /> Fijado</span>}
              {selectedPost.isResolved && <span className="badge-green text-[10px] flex items-center gap-1"><FiCheckCircle size={10} /> Resuelto</span>}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-dark-500 mb-4">
            <span className="flex items-center gap-1"><FiUser size={12} /> {selectedPost.authorName}</span>
            <span className="flex items-center gap-1">
              <FiClock size={12} />
              {formatDistanceToNow(new Date(selectedPost.createdAt), { addSuffix: true, locale: es })}
            </span>
          </div>
          <p className="text-dark-200 whitespace-pre-wrap leading-relaxed">{selectedPost.content}</p>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-800/50">
            <Reactions targetType="FORUM_POST" targetId={selectedPost.id} />
            {userId !== selectedPost.userId && (
              <button
                onClick={() => setReportTarget({ targetType: 'FORUM_POST', targetId: selectedPost.id })}
                className="text-dark-500 hover:text-red-400 transition-colors flex items-center gap-1 text-xs"
              >
                <FiFlag size={12} /> Reportar
              </button>
            )}
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dark-800/50">
              <motion.button onClick={() => togglePin(selectedPost)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1" whileTap={{ scale: 0.95 }}>
                <FiMapPin size={12} /> {selectedPost.isPinned ? 'Desfijar' : 'Fijar'}
              </motion.button>
              <motion.button onClick={() => toggleResolved(selectedPost)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1" whileTap={{ scale: 0.95 }}>
                <FiCheckCircle size={12} /> {selectedPost.isResolved ? 'Abrir' : 'Resolver'}
              </motion.button>
            </div>
          )}
        </div>

        <div className="border-t border-dark-800/50 pt-4 mb-4">
          <h3 className="text-sm font-semibold text-dark-300 mb-3">{replies.length} {replies.length === 1 ? 'respuesta' : 'respuestas'}</h3>
          {repliesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-dark-800 rounded-xl animate-pulse" />)}
            </div>
          ) : replies.length === 0 ? (
            <p className="text-dark-500 text-sm text-center py-6">No hay respuestas aún. Sé el primero en responder.</p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {replies.map((reply) => (
                  <motion.div
                    key={reply.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-dark-800/50 rounded-xl p-4 border border-dark-800/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-brand-400">{reply.authorName}</span>
                      <span className="text-[10px] text-dark-600">
                        {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    <p className="text-dark-200 text-sm whitespace-pre-wrap">{reply.content}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-dark-800/30">
                      <Reactions targetType="FORUM_REPLY" targetId={reply.id} compact />
                      {userId !== reply.userId && (
                        <button
                          onClick={() => setReportTarget({ targetType: 'FORUM_REPLY', targetId: reply.id })}
                          className="text-dark-600 hover:text-red-400 transition-colors"
                        >
                          <FiFlag size={10} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendReply()}
            placeholder="Escribe una respuesta..."
            className="input flex-1 text-sm"
          />
          <motion.button
            onClick={sendReply}
            disabled={!replyContent.trim() || sendingReply}
            className="btn-primary py-2 px-4 flex items-center gap-1 text-sm"
            whileTap={{ scale: 0.95 }}
          >
            <FiSend size={14} /> Enviar
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FiMessageSquare size={20} className="text-brand-400" />
          <h2 className="text-lg font-bold text-white">Foro del Curso</h2>
          <span className="badge-blue text-[10px]">{posts.length} publicaciones</span>
        </div>
        <motion.button
          onClick={() => setShowNewPost(true)}
          className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
          whileTap={{ scale: 0.95 }}
        >
          <FiPlus size={14} /> Nueva Publicación
        </motion.button>
      </div>

      <div className="relative mb-5">
        <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar publicaciones..."
          className="input pl-10 text-sm"
        />
      </div>

      <AnimatePresence>
        {showNewPost && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5"
          >
            <div className="bg-dark-800/50 rounded-xl p-5 border border-dark-700/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Nueva Publicación</h3>
                <button onClick={() => setShowNewPost(false)} className="text-dark-500 hover:text-white transition-colors">
                  <FiX size={16} />
                </button>
              </div>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Título"
                className="input text-sm mb-3"
              />
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Escribe tu publicación..."
                rows={4}
                className="input text-sm resize-none mb-3"
              />
              <div className="flex justify-end gap-2">
                <motion.button onClick={() => setShowNewPost(false)} className="btn-secondary text-sm py-2 px-4" whileTap={{ scale: 0.95 }}>
                  Cancelar
                </motion.button>
                <motion.button
                  onClick={createPost}
                  disabled={!newTitle.trim() || !newContent.trim() || submitting}
                  className="btn-primary text-sm py-2 px-4"
                  whileTap={{ scale: 0.95 }}
                >
                  {submitting ? 'Publicando...' : 'Publicar'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-dark-800 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <FiMessageSquare size={40} className="text-dark-700 mx-auto mb-3" />
          <p className="text-dark-500 text-sm">
            {search ? 'No se encontraron publicaciones' : 'No hay publicaciones aún. ¡Crea la primera!'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FiMapPin size={12} /> Fijados
              </h3>
              <div className="space-y-2">
                {pinned.map((post) => (
                  <PostCard key={post.id} post={post} onClick={() => loadReplies(post)} />
                ))}
              </div>
            </div>
          )}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FiFilter size={12} /> Recientes
                </h3>
              )}
              <div className="space-y-2">
                {unpinned.map((post) => (
                  <PostCard key={post.id} post={post} onClick={() => loadReplies(post)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ReportModal
        open={!!reportTarget}
        targetType={reportTarget?.targetType || ''}
        targetId={reportTarget?.targetId || ''}
        onClose={() => setReportTarget(null)}
      />
    </div>
  );
}

function PostCard({ post, onClick }: { post: ForumPost; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="w-full text-left bg-dark-800/30 hover:bg-dark-800/60 border border-dark-800/50 hover:border-brand-500/20 rounded-xl p-4 transition-all duration-300 group"
      whileHover={{ x: 4 }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors line-clamp-1">
          {post.title}
        </h4>
        <div className="flex items-center gap-1.5 shrink-0">
          {post.isPinned && <span className="badge-yellow text-[9px] py-0 px-1.5"><FiMapPin size={8} /> Fijado</span>}
          {post.isResolved && <span className="badge-green text-[9px] py-0 px-1.5"><FiCheckCircle size={8} /> Resuelto</span>}
        </div>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-dark-500">
        <span className="flex items-center gap-1"><FiUser size={10} /> {post.authorName}</span>
        <span className="flex items-center gap-1">
          <FiClock size={10} />
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: es })}
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <FiMessageSquare size={10} /> {post._count.replies}
        </span>
      </div>
    </motion.button>
  );
}
