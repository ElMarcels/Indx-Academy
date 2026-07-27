'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FiFileText, FiLink, FiCheckCircle, FiClock, FiSend, FiLoader, FiAlertCircle, FiExternalLink, FiUpload,
} from 'react-icons/fi';

interface ActivityItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  content: string | null;
  config: string | null;
  maxScore: number | null;
  dueDate: string | null;
  order: number;
  submission?: {
    id: string;
    content: string | null;
    score: number | null;
    feedback: string | null;
    status: string;
  } | null;
}

const TYPE_LABELS: Record<string, string> = {
  PAGE: 'Página',
  ASSIGNMENT: 'Tarea',
  FILE: 'Archivo',
  LINK: 'Enlace',
  CHOICE: 'Selección',
  WORKSHOP: 'Taller',
  WIKI: 'Wiki',
  DATABASE: 'Base de datos',
  GLOSSARY: 'Glosario',
};

const TYPE_COLORS: Record<string, string> = {
  PAGE: 'badge-blue',
  ASSIGNMENT: 'badge-yellow',
  FILE: 'badge-green',
  LINK: 'badge-purple',
  CHOICE: 'badge-orange',
  WORKSHOP: 'badge-red',
  WIKI: 'badge-blue',
  DATABASE: 'badge-green',
  GLOSSARY: 'badge-yellow',
};

interface Props {
  lessonId: string;
}

export function ActivityViewer({ lessonId }: Props) {
  const { data: session } = useSession();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState<Record<string, string>>({});

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}/activities`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  async function submitActivity(activityId: string) {
    const content = submissionText[activityId];
    if (!content?.trim()) { toast.error('Escribe algo antes de enviar'); return; }
    setSubmittingId(activityId);
    try {
      const res = await fetch(`/api/activities/${activityId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        toast.success('Actividad enviada');
        fetchActivities();
        setSubmissionText((prev) => ({ ...prev, [activityId]: '' }));
      } else {
        toast.error('Error al enviar');
      }
    } catch { toast.error('Error de conexión'); } finally { setSubmittingId(null); }
  }

  function isOverdue(dateStr: string) {
    return new Date(dateStr) < new Date();
  }

  function isDueSoon(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-4 bg-dark-800 rounded w-1/3 mb-2" />
            <div className="h-3 bg-dark-800 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <FiFileText size={18} className="text-brand-400" /> Actividades
        <span className="badge-blue text-[10px]">{activities.length}</span>
      </h3>

      <div className="space-y-3">
        <AnimatePresence>
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`${TYPE_COLORS[activity.type] || 'badge-blue'} text-[10px]`}>
                        {TYPE_LABELS[activity.type] || activity.type}
                      </span>
                      <h4 className="text-sm font-semibold text-white">{activity.title}</h4>
                    </div>
                    {activity.description && (
                      <p className="text-xs text-dark-400">{activity.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-dark-500 flex-shrink-0">
                    {activity.maxScore && (
                      <span className="flex items-center gap-1">
                        <FiCheckCircle size={10} /> {activity.maxScore} pts
                      </span>
                    )}
                    {activity.dueDate && (
                      <span className={`flex items-center gap-1 ${
                        isOverdue(activity.dueDate) ? 'text-red-400' : isDueSoon(activity.dueDate) ? 'text-yellow-400' : ''
                      }`}>
                        <FiClock size={10} />
                        {new Date(activity.dueDate).toLocaleDateString('es')}
                      </span>
                    )}
                  </div>
                </div>

                {activity.type === 'PAGE' && activity.content && (
                  <div className="mt-3 p-3 bg-dark-800/30 rounded-lg text-sm text-dark-200">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{activity.content}</ReactMarkdown>
                  </div>
                )}

                {activity.type === 'LINK' && activity.config && (() => {
                  try {
                    const cfg = JSON.parse(activity.config);
                    return (
                      <a
                        href={cfg.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        <FiExternalLink size={14} /> {cfg.url}
                      </a>
                    );
                  } catch { return null; }
                })()}

                {activity.type === 'CHOICE' && activity.config && (() => {
                  try {
                    const cfg = JSON.parse(activity.config);
                    const choices: string[] = cfg.choices || [];
                    return (
                      <div className="mt-3 space-y-2">
                        {choices.map((choice, i) => (
                          <label key={i} className="flex items-center gap-2 text-sm text-dark-300 cursor-pointer">
                            <input type="radio" name={`choice-${activity.id}`} className="accent-brand-500" />
                            {choice}
                          </label>
                        ))}
                      </div>
                    );
                  } catch { return null; }
                })()}

                {activity.type === 'ASSIGNMENT' && (
                  <div className="mt-3">
                    {activity.submission ? (
                      <div className={`p-3 rounded-lg text-sm ${
                        activity.submission.status === 'GRADED'
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'bg-yellow-500/10 border border-yellow-500/20'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {activity.submission.status === 'GRADED' ? (
                            <><FiCheckCircle size={14} className="text-green-400" /> <span className="text-green-400 font-medium">Calificada</span></>
                          ) : (
                            <><FiClock size={14} className="text-yellow-400" /> <span className="text-yellow-400 font-medium">Enviada — Pendiente</span></>
                          )}
                        </div>
                        {activity.submission.score !== null && (
                          <p className="text-dark-300">Puntuación: {activity.submission.score}/{activity.maxScore}</p>
                        )}
                        {activity.submission.feedback && (
                          <p className="text-dark-400 mt-1">Retroalimentación: {activity.submission.feedback}</p>
                        )}
                      </div>
                    ) : session ? (
                      <div>
                        <textarea
                          value={submissionText[activity.id] || ''}
                          onChange={(e) => setSubmissionText((prev) => ({ ...prev, [activity.id]: e.target.value }))}
                          placeholder="Escribe tu respuesta o sube un archivo..."
                          rows={3}
                          className="input resize-none text-sm"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => submitActivity(activity.id)}
                            disabled={submittingId === activity.id}
                            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                          >
                            {submittingId === activity.id ? (
                              <FiLoader size={12} className="animate-spin" />
                            ) : (
                              <FiSend size={12} />
                            )}
                            Enviar
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {!['PAGE', 'LINK', 'CHOICE', 'ASSIGNMENT'].includes(activity.type) && (
                  <div className="mt-3 p-3 bg-dark-800/30 rounded-lg">
                    <p className="text-xs text-dark-500 flex items-center gap-1">
                      <FiAlertCircle size={12} /> Actividad de tipo {TYPE_LABELS[activity.type]}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
