'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiXCircle, FiRotateCcw, FiAward } from 'react-icons/fi';
import { useSession } from 'next-auth/react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  order: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  questions: QuizQuestion[];
}

interface QuizProps {
  quizId: string;
}

export function QuizComponent({ quizId }: QuizProps) {
  const { data: session } = useSession();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/quizzes/${quizId}`);
        if (res.ok) {
          const data = await res.json();
          setQuiz(data.quiz);
          setSelectedAnswers(new Array(data.quiz.questions.length).fill(null));
        }
      } catch {
        toast.error('Error al cargar el quiz');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [quizId]);

  function selectAnswer(qIndex: number, oIndex: number) {
    if (showResult) return;
    const updated = [...selectedAnswers];
    updated[qIndex] = oIndex;
    setSelectedAnswers(updated);
  }

  async function submitQuiz() {
    if (!session) {
      toast.error('Debes iniciar sesión');
      return;
    }
    if (selectedAnswers.includes(null)) {
      toast.error('Responde todas las preguntas antes de enviar');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: selectedAnswers }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setShowResult(true);
        toast.success(data.passed ? '¡Aprobaste el quiz!' : 'No alcanzaste la puntuación mínima');
      } else {
        toast.error('Error al enviar el quiz');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  function resetQuiz() {
    setCurrentQ(0);
    setSelectedAnswers(new Array(quiz?.questions.length || 0).fill(null));
    setShowResult(false);
    setResult(null);
  }

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-6 bg-dark-800 rounded w-1/3 mb-4" />
        <div className="h-4 bg-dark-800 rounded w-2/3 mb-2" />
        <div className="h-4 bg-dark-800 rounded w-1/2" />
      </div>
    );
  }

  if (!quiz) return null;

  const question = quiz.questions[currentQ];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">{quiz.title}</h3>
        <span className="badge-blue">
          {currentQ + 1} / {quiz.questions.length}
        </span>
      </div>

      {quiz.description && (
        <p className="text-dark-400 text-sm mb-4">{quiz.description}</p>
      )}

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-dark-800 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full"
          animate={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <p className="text-white font-medium mb-4">{question.question}</p>
          <div className="space-y-2">
            {question.options.map((option, oIndex) => {
              const selected = selectedAnswers[currentQ] === oIndex;
              const isCorrect = showResult && oIndex === question.correctIndex;
              const isWrong = showResult && selected && oIndex !== question.correctIndex;

              return (
                <button
                  key={oIndex}
                  onClick={() => selectAnswer(currentQ, oIndex)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                    isCorrect
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                      : isWrong
                      ? 'border-red-500/50 bg-red-500/10 text-red-400'
                      : selected
                      ? 'border-brand-500/50 bg-brand-500/10 text-brand-400'
                      : 'border-dark-700/50 bg-dark-800/50 text-dark-300 hover:border-dark-600 hover:text-white'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {String.fromCharCode(65 + oIndex)}
                  </span>
                  <span className="text-sm">{option}</span>
                  {isCorrect && <FiCheckCircle size={16} className="ml-auto text-emerald-400" />}
                  {isWrong && <FiXCircle size={16} className="ml-auto text-red-400" />}
                </button>
              );
            })}
          </div>

          {showResult && question.explanation && (
            <div className="mt-4 p-4 bg-brand-500/5 border border-brand-500/20 rounded-xl">
              <p className="text-sm text-dark-300">
                <span className="text-brand-400 font-semibold">Explicación: </span>
                {question.explanation}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-dark-800/50">
        <button
          onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
          disabled={currentQ === 0}
          className="btn-secondary text-sm py-2 disabled:opacity-30"
        >
          Anterior
        </button>

        {currentQ === quiz.questions.length - 1 ? (
          showResult ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm text-dark-400">Resultado</div>
                <div className={`text-lg font-bold ${result?.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {result?.score}/{result?.total}
                </div>
              </div>
              <button onClick={resetQuiz} className="btn-secondary text-sm py-2 flex items-center gap-2">
                <FiRotateCcw size={14} /> Reintentar
              </button>
            </div>
          ) : (
            <button
              onClick={submitQuiz}
              disabled={submitting || selectedAnswers.includes(null)}
              className="btn-primary text-sm py-2 flex items-center gap-2"
            >
              <FiAward size={14} />
              {submitting ? 'Enviando...' : 'Enviar'}
            </button>
          )
        ) : (
          <button
            onClick={() => setCurrentQ(Math.min(quiz.questions.length - 1, currentQ + 1))}
            className="btn-primary text-sm py-2"
          >
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
}
