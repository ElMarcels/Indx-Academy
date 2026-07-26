'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { FiCode, FiSend, FiCheck, FiClock } from 'react-icons/fi';

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  points: number;
  submissions?: {
    id: string;
    status: string;
    content: string;
    feedback: string | null;
    createdAt: string;
  }[];
}

interface ChallengeProps {
  courseId: string;
}

const difficultyColors: Record<string, string> = {
  EASY: 'badge-green',
  MEDIUM: 'badge-yellow',
  HARD: 'badge-red',
};

export function ChallengeList({ courseId }: ChallengeProps) {
  const { data: session } = useSession();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [solution, setSolution] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/courses/${courseId}/challenges`);
        if (res.ok) {
          const data = await res.json();
          setChallenges(data.challenges);
        }
      } catch {
        toast.error('Error al cargar desafíos');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  async function submitSolution(challengeId: string) {
    if (!session) {
      toast.error('Debes iniciar sesión');
      return;
    }
    if (!solution.trim()) {
      toast.error('Escribe tu solución');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/challenges/${challengeId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: solution }),
      });
      if (res.ok) {
        toast.success('¡Solución enviada!');
        setSolution('');
        setExpandedId(null);
        const data = await res.json();
        setChallenges((prev) =>
          prev.map((c) =>
            c.id === challengeId
              ? { ...c, submissions: [...(c.submissions || []), data.submission] }
              : c
          )
        );
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al enviar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-5 bg-dark-800 rounded w-1/3 mb-3" />
            <div className="h-4 bg-dark-800 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="card p-8 text-center">
        <FiCode size={32} className="text-dark-600 mx-auto mb-3" />
        <p className="text-dark-400">No hay desafíos disponibles para este curso aún.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {challenges.map((challenge) => {
        const isExpanded = expandedId === challenge.id;
        const lastSubmission = challenge.submissions?.[0];
        const hasApproved = challenge.submissions?.some((s) => s.status === 'APPROVED');

        return (
          <motion.div
            key={challenge.id}
            layout
            className="card overflow-hidden"
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : challenge.id)}
              className="w-full p-6 text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent-500/10 rounded-xl flex items-center justify-center">
                  <FiCode size={18} className="text-accent-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{challenge.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={difficultyColors[challenge.difficulty] || 'badge-blue'}>
                      {challenge.difficulty}
                    </span>
                    <span className="text-xs text-dark-500">{challenge.points} puntos</span>
                    {hasApproved && (
                      <span className="badge-green flex items-center gap-1">
                        <FiCheck size={10} /> Aprobado
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-dark-500 text-sm">
                {isExpanded ? '▲' : '▼'}
              </span>
            </button>

            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-6 pb-6 border-t border-dark-800/50"
              >
                <p className="text-dark-300 text-sm mt-4 mb-4 whitespace-pre-wrap">
                  {challenge.description}
                </p>

                {lastSubmission && (
                  <div className={`p-4 rounded-xl mb-4 border ${
                    lastSubmission.status === 'APPROVED'
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : lastSubmission.status === 'REJECTED'
                      ? 'bg-red-500/5 border-red-500/20'
                      : 'bg-yellow-500/5 border-yellow-500/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <FiClock size={12} className="text-dark-500" />
                      <span className="text-xs text-dark-500">
                        Último envío: {new Date(lastSubmission.createdAt).toLocaleDateString('es-ES')}
                      </span>
                      <span className={`text-xs font-semibold ${
                        lastSubmission.status === 'APPROVED' ? 'text-emerald-400' :
                        lastSubmission.status === 'REJECTED' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {lastSubmission.status === 'APPROVED' ? 'Aprobado' :
                         lastSubmission.status === 'REJECTED' ? 'Rechazado' : 'Pendiente'}
                      </span>
                    </div>
                    {lastSubmission.feedback && (
                      <p className="text-sm text-dark-300 mt-1">{lastSubmission.feedback}</p>
                    )}
                  </div>
                )}

                {!hasApproved && (
                  <div className="space-y-3">
                    <textarea
                      value={solution}
                      onChange={(e) => setSolution(e.target.value)}
                      placeholder="Escribe tu solución aquí..."
                      rows={6}
                      className="input font-mono text-sm"
                    />
                    <button
                      onClick={() => submitSolution(challenge.id)}
                      disabled={submitting || !solution.trim()}
                      className="btn-primary text-sm py-2 flex items-center gap-2"
                    >
                      <FiSend size={14} />
                      {submitting ? 'Enviando...' : 'Enviar solución'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
