'use client';

import { useState, useEffect } from 'react';
import { FiStar, FiSend, FiCheck } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Survey, SurveyQuestion } from '@/types';

interface SurveyFormProps {
  courseId: string;
}

export function SurveyForm({ courseId }: SurveyFormProps) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch(`/api/surveys?courseId=${courseId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.survey) {
          setSurvey(data.survey);
          fetch(`/api/surveys/${data.survey.id}/respond`)
            .then((r) => r.json())
            .then((d) => { setAnswered(d.responded); setChecked(true); })
            .catch(() => setChecked(true));
        } else {
          setChecked(true);
        }
      })
      .catch(() => setChecked(true));
  }, [courseId]);

  async function submit() {
    if (!survey) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/surveys/${survey.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, rating: rating || undefined, comment: comment || undefined }),
      });
      if (res.ok) {
        toast.success('¡Gracias por tu feedback!');
        setAnswered(true);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error');
      }
    } catch {
      toast.error('Error al enviar');
    }
    setLoading(false);
  }

  if (!checked) return null;
  if (!survey || answered) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
        <FiStar size={18} className="text-yellow-400" />
        {survey.title}
      </h3>
      {survey.description && (
        <p className="text-dark-400 text-sm mb-4">{survey.description}</p>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-sm text-dark-300 mb-2">¿Cómo valorarías este curso?</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <FaStar
                  size={24}
                  className={`transition-colors ${
                    star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-dark-600'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {survey.questions.map((q: SurveyQuestion, i: number) => (
          <div key={i}>
            <p className="text-sm text-dark-300 mb-2">{q.question}</p>
            {q.type === 'text' ? (
              <textarea
                value={answers[i] || ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                placeholder="Tu respuesta..."
                className="input w-full h-20 resize-none"
              />
            ) : q.type === 'choice' && q.options ? (
              <div className="space-y-2">
                {q.options.map((opt: string, j: number) => (
                  <label key={j} className="flex items-center gap-2 text-sm text-dark-300 cursor-pointer">
                    <input
                      type="radio"
                      name={`q-${i}`}
                      checked={answers[i] === opt}
                      onChange={() => setAnswers((prev) => ({ ...prev, [i]: opt }))}
                      className="accent-brand-400"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ) : q.type === 'stars' ? (
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setAnswers((prev) => ({ ...prev, [i]: s }))}>
                    <FaStar
                      size={18}
                      className={s <= (answers[i] || 0) ? 'text-yellow-400' : 'text-dark-600'}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}

        <div>
          <p className="text-sm text-dark-300 mb-2">Comentario adicional (opcional)</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Cuéntanos tu experiencia..."
            className="input w-full h-20 resize-none"
          />
        </div>
      </div>

      {answered ? (
        <div className="flex items-center gap-2 text-emerald-400 text-sm mt-4">
          <FiCheck /> Ya respondiste esta encuesta
        </div>
      ) : (
        <button onClick={submit} disabled={loading} className="btn-primary text-sm mt-4 flex items-center gap-2">
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <FiSend size={14} />
          )}
          Enviar encuesta
        </button>
      )}
    </motion.div>
  );
}
