'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiMessageSquare, FiSend, FiArrowLeft, FiLoader, FiFlag, FiTrash2 } from 'react-icons/fi';
import { Reactions } from './Reactions';
import { ReportModal } from './ReportModal';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  replies?: Comment[];
}

interface LessonCommentsProps {
  lessonId: string;
}

export function LessonComments({ lessonId }: LessonCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [reportTarget, setReportTarget] = useState<{ targetType: string; targetId: string } | null>(null);

  useEffect(() => {
    fetchComments();
  }, [lessonId]);

  async function fetchComments() {
    try {
      const res = await fetch(`/api/comments?lessonId=${lessonId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {
      toast.error('Error al cargar comentarios');
    } finally {
      setLoading(false);
    }
  }

  async function handlePostComment() {
    if (!session) {
      toast.error('Debes iniciar sesión para comentar');
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, content: newComment.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [data.comment, ...prev]);
        setNewComment('');
        toast.success('Comentario publicado');
      } else {
        toast.error('Error al publicar comentario');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(parentId: string) {
    if (!session) {
      toast.error('Debes iniciar sesión para responder');
      return;
    }
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, content: replyContent.trim(), parentId }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: [...(c.replies || []), data.comment] }
              : c
          )
        );
        setReplyContent('');
        setReplyingTo(null);
        toast.success('Respuesta publicada');
      } else {
        toast.error('Error al publicar respuesta');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteComment(commentId: string) {
    if (!confirm('¿Eliminar este comentario?')) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId).map((c) => ({
          ...c,
          replies: (c.replies || []).filter((r) => r.id !== commentId),
        })));
        toast.success('Comentario eliminado');
      } else {
        toast.error('Error al eliminar');
      }
    } catch { toast.error('Error de conexión'); }
  }

  function getInitials(name: string | null, email: string | null) {
    const display = name || email || 'U';
    return display.charAt(0).toUpperCase();
  }

  function getDisplayName(user: Comment['user']) {
    return user.name || user.email || 'Usuario';
  }

  function timeAgo(dateStr: string) {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
    } catch {
      return '';
    }
  }

  const totalComments = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-bold text-white">Comentarios</h3>
        <span className="badge-blue">
          <FiMessageSquare size={12} className="mr-1" />
          {totalComments}
        </span>
      </div>

      {session && (
        <div className="card p-4">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-brand-400">
                {getInitials(session.user?.name as string || null, session.user?.email || null)}
              </span>
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                rows={3}
                className="input resize-none text-sm"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handlePostComment}
                  disabled={!newComment.trim() || submitting}
                  className="btn-primary text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-30"
                >
                  {submitting ? <FiLoader size={14} className="animate-spin" /> : <FiSend size={14} />}
                  Comentar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-dark-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-dark-800 rounded w-1/4" />
                  <div className="h-3 bg-dark-800 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="card p-8 text-center">
          <FiMessageSquare size={32} className="text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400">No hay comentarios todavía</p>
          <p className="text-dark-500 text-sm mt-1">Sé el primero en comentar</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="card overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-brand-400">
                        {getInitials(comment.user.name, comment.user.email)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {getDisplayName(comment.user)}
                        </span>
                        <span className="text-xs text-dark-500">{timeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-dark-300 mt-1 whitespace-pre-wrap">{comment.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Reactions targetType="COMMENT" targetId={comment.id} compact />
                        <div className="flex items-center gap-2">
                          {session && (session?.user as any)?.id === comment.user.id && (
                            <button
                              onClick={() => deleteComment(comment.id)}
                              className="text-dark-600 hover:text-red-400 transition-colors"
                            >
                              <FiTrash2 size={10} />
                            </button>
                          )}
                          {session && (session?.user as any)?.id !== comment.user.id && (
                            <button
                              onClick={() => setReportTarget({ targetType: 'COMMENT', targetId: comment.id })}
                              className="text-dark-600 hover:text-red-400 transition-colors"
                            >
                              <FiFlag size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setReplyingTo(replyingTo === comment.id ? null : comment.id);
                          setReplyContent('');
                        }}
                        className="text-xs text-dark-500 hover:text-brand-400 mt-2 flex items-center gap-1 transition-colors"
                      >
                        <FiArrowLeft size={10} /> Responder
                      </button>
                    </div>
                  </div>
                </div>

                {comment.replies && comment.replies.length > 0 && (
                  <div className="border-t border-dark-800/50 bg-dark-800/20">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="p-4 pl-12">
                        <div className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-500/20 to-brand-500/20 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-accent-400">
                              {getInitials(reply.user.name, reply.user.email)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">
                                {getDisplayName(reply.user)}
                              </span>
                              <span className="text-xs text-dark-500">{timeAgo(reply.createdAt)}</span>
                            </div>
                            <p className="text-sm text-dark-300 mt-1 whitespace-pre-wrap">{reply.content}</p>
                            <div className="flex items-center justify-between mt-1">
                              <Reactions targetType="COMMENT" targetId={reply.id} compact />
                              <div className="flex items-center gap-2">
                                {session && (session?.user as any)?.id === reply.user.id && (
                                  <button
                                    onClick={() => deleteComment(reply.id)}
                                    className="text-dark-600 hover:text-red-400 transition-colors"
                                  >
                                    <FiTrash2 size={10} />
                                  </button>
                                )}
                                {session && (session?.user as any)?.id !== reply.user.id && (
                                  <button
                                    onClick={() => setReportTarget({ targetType: 'COMMENT', targetId: reply.id })}
                                    className="text-dark-600 hover:text-red-400 transition-colors"
                                  >
                                    <FiFlag size={10} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <AnimatePresence>
                  {replyingTo === comment.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-dark-800/50"
                    >
                      <div className="p-4 bg-dark-800/10">
                        <div className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-brand-400">
                              {getInitials(session?.user?.name as string || null, session?.user?.email || null)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Escribe una respuesta..."
                              rows={2}
                              className="input resize-none text-sm"
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyContent('');
                                }}
                                className="btn-secondary text-xs py-1.5 px-3"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleReply(comment.id)}
                                disabled={!replyContent.trim() || submitting}
                                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 disabled:opacity-30"
                              >
                                <FiSend size={10} /> Responder
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
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
