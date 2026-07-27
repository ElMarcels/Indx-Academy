'use client';

import { useState, useEffect } from 'react';
import { FiTarget, FiCheck, FiArrowRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import type { PathQuizQuestion } from '@/types';

interface PathQuizProps {
  pathId: string;
  questions: PathQuizQuestion[];
  onComplete?: (result: { score: number; total: number; recommendedLevel: string }) => void;
}

export function PathQuiz({ pathId, questions, onComplete }: PathQuizProps) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; recommendedLevel: string } | null>(null);
  const [loading, setLoading] = useState(false);

  function selectAnswer(index: number) {
    const newAnswers = [...answers];
    newAnswers[current] = index;
    setAnswers(newAnswers);
  }

  function next() {
    if (answers[current] === undefined) {
      toast.error('Selecciona una respuesta');
      return;
    }
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      submitQuiz();
    }
  }

  async function submitQuiz() {
    setLoading(true);
    try {
      const res = await fetch(`/api/paths/${pathId}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setSubmitted(true);
        onComplete?.(data);
      } else {
        toast.error(data.error || 'Error');
      }
    } catch {
      toast.error('Error al enviar');
    }
    setLoading(false);
  }

  if (submitted && result) {
    const levelLabels: Record<string, string> = {
      BEGINNER: 'Principiante',
      INTERMEDIATE: 'Intermedio',
      ADVANCED: 'Avanzado',
    };
    const levelColors: Record<string, string> = {
      BEGINNER: 'text-emerald-400',
      INTERMEDIATE: 'text-yellow-400',
      ADVANCED: 'text-brand-400',
    };

    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-8 text-center">
        <FiTarget size={40} className="text-brand-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">¡Cuestionario completado!</h3>
        <p className="text-dark-400 mb-4">
          Obtuviste <span className="text-white font-semibold">{result.score}</span> de{' '}
          <span className="text-white font-semibold">{result.total}</span> respuestas correctas
        </p>
        <div className="mb-6">
          <span className="text-sm text-dark-500">Tu nivel recomendado: </span>
          <span className={`text-lg font-bold ${levelColors[result.recommendedLevel] || 'text-white'}`}>
            {levelLabels[result.recommendedLevel] || result.recommendedLevel}
          </span>
        </div>
        <div className="w-full bg-dark-800 rounded-full h-3 mb-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(result.score / result.total) * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="bg-gradient-to-r from-brand-500 to-accent-500 h-3 rounded-full"
          />
        </div>
      </motion.div>
    );
  }

  const q = questions[current];
  if (!q) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-dark-400">
        <span>Pregunta {current + 1} de {questions.length}</span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i === current ? 'bg-brand-400' : i < current ? 'bg-emerald-400' : 'bg-dark-700'}`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <div className="card p-6">
            <h3 className="text-white font-medium mb-4">{q.question}</h3>
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  className={`w-full text-left p-3 rounded-xl text-sm transition-all ${
                    answers[current] === i
                      ? 'bg-brand-500/20 text-brand-400 ring-1 ring-brand-500/30'
                      : 'bg-dark-800/50 text-dark-300 hover:bg-dark-800'
                  }`}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-end">
        <button onClick={next} disabled={loading} className="btn-primary text-sm flex items-center gap-2">
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : current === questions.length - 1 ? (
            <><FiCheck size={14} /> Finalizar</>
          ) : (
            <><FiArrowRight size={14} /> Siguiente</>
          )}
        </button>
      </div>
    </div>
  );
}
