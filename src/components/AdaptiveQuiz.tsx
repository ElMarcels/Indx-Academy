'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiXCircle, FiArrowRight, FiAward, FiRotateCcw } from 'react-icons/fi';

interface AdaptiveQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  order: number;
}

interface AdaptiveQuiz {
  id: string;
  title: string;
  description: string | null;
  questions: AdaptiveQuestion[];
}

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

const difficultyConfig: Record<Difficulty, { label: string; badge: string; level: number }> = {
  EASY: { label: 'Fácil', badge: 'badge-green', level: 0 },
  MEDIUM: { label: 'Medio', badge: 'badge-yellow', level: 1 },
  HARD: { label: 'Difícil', badge: 'badge-red', level: 2 },
};

const DIFFICULTY_LEVELS: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

function getDifficultyLevel(d: Difficulty): number {
  return difficultyConfig[d].level;
}

function pickNextDifficulty(prev: Difficulty, correct: boolean): Difficulty {
  const level = getDifficultyLevel(prev);
  if (correct && level < 2) return DIFFICULTY_LEVELS[level + 1];
  if (!correct && level > 0) return DIFFICULTY_LEVELS[level - 1];
  return prev;
}

function buildAdaptiveSequence(questions: AdaptiveQuestion[]): AdaptiveQuestion[] {
  const easy = questions.filter((q) => q.difficulty === 'EASY');
  const medium = questions.filter((q) => q.difficulty === 'MEDIUM');
  const hard = questions.filter((q) => q.difficulty === 'HARD');
  return [...medium, ...easy, ...hard];
}

export function AdaptiveQuiz({ quizId }: { quizId: string }) {
  const [quiz, setQuiz] = useState<AdaptiveQuiz | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<AdaptiveQuestion[]>([]);
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('MEDIUM');
  const [currentQuestion, setCurrentQuestion] = useState<AdaptiveQuestion | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const usedIdsRef = useRef<Set<string>>(new Set());

  const pickNextQuestion = useCallback(
    (from: AdaptiveQuestion[], difficulty: Difficulty, used: Set<string>): AdaptiveQuestion | null => {
      const level = getDifficultyLevel(difficulty);
      for (let spread = 0; spread <= 2; spread++) {
        for (const dir of [0, 1, -1]) {
          const target = level + dir * spread;
          if (target < 0 || target > 2) continue;
          const d = DIFFICULTY_LEVELS[target];
          const candidate = from.find((q) => q.difficulty === d && !used.has(q.id));
          if (candidate) return candidate;
        }
      }
      return null;
    },
    []
  );

  useEffect(() => {
    async function loadQuiz() {
      try {
        const res = await fetch(`/api/quizzes/${quizId}`);
        if (res.ok) {
          const data = await res.json();
          setQuiz(data.quiz);
          const seq = buildAdaptiveSequence(data.quiz.questions);
          setAdaptiveQuestions(seq);
          usedIdsRef.current = new Set();
          const first = pickNextQuestion(seq, 'MEDIUM', usedIdsRef.current);
          setCurrentQuestion(first);
        } else {
          toast.error('Error al cargar el quiz');
        }
      } catch {
        toast.error('Error de conexión');
      } finally {
        setLoading(false);
      }
    }
    loadQuiz();
  }, [quizId]);

  const totalQuestions = quiz?.questions.length || 0;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  function handleSelectOption(index: number) {
    if (answered || !currentQuestion) return;
    setSelectedOption(index);
  }

  function handleSubmitAnswer() {
    if (selectedOption === null || !currentQuestion || !quiz) return;

    const correct = selectedOption === currentQuestion.correctIndex;
    setIsCorrect(correct);
    setAnswered(true);
    if (correct) setScore((s) => s + 1);

    usedIdsRef.current.add(currentQuestion.id);
    setAnsweredCount(usedIdsRef.current.size);

    const nextDiff = pickNextDifficulty(currentQuestion.difficulty, correct);
    setCurrentDifficulty(nextDiff);

    const remaining = quiz.questions.filter((q) => !usedIdsRef.current.has(q.id));
    const next = pickNextQuestion(remaining, nextDiff, usedIdsRef.current);
    setAdaptiveQuestions((prev) => (next && !prev.find((q) => q.id === next.id) ? [...prev, next] : prev));
  }

  function handleNextQuestion() {
    if (!quiz) return;

    if (answeredCount >= totalQuestions) {
      setCompleted(true);
    } else {
      const remaining = quiz.questions.filter((q) => !usedIdsRef.current.has(q.id));
      const next = pickNextQuestion(remaining, currentDifficulty, usedIdsRef.current);
      setCurrentQuestion(next);
      setSelectedOption(null);
      setAnswered(false);
      setIsCorrect(false);
    }
  }

  function resetQuiz() {
    setSelectedOption(null);
    setAnswered(false);
    setIsCorrect(false);
    setScore(0);
    setCompleted(false);
    setCurrentDifficulty('MEDIUM');
    setAnsweredCount(0);
    usedIdsRef.current = new Set();
    if (quiz) {
      const seq = buildAdaptiveSequence(quiz.questions);
      setAdaptiveQuestions(seq);
      const first = pickNextQuestion(seq, 'MEDIUM', usedIdsRef.current);
      setCurrentQuestion(first);
    }
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

  if (!quiz || totalQuestions === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-dark-400">No hay preguntas disponibles</p>
      </div>
    );
  }

  if (completed || !currentQuestion) {
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const passed = percentage >= 70;

    return (
      <motion.div
        className="card p-8 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            passed ? 'bg-emerald-500/20' : 'bg-red-500/20'
          }`}
        >
          <FiAward size={36} className={passed ? 'text-emerald-400' : 'text-red-400'} />
        </motion.div>

        <h3 className="text-2xl font-bold text-white mb-2">
          {passed ? '¡Excelente trabajo!' : 'Sigue practicando'}
        </h3>
        <p className="text-dark-400 mb-6">Has completado el quiz adaptativo</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-dark-800/50">
            <div className="text-3xl font-bold text-white">{score}</div>
            <div className="text-xs text-dark-400 mt-1">Correctas</div>
          </div>
          <div className="p-4 rounded-xl bg-dark-800/50">
            <div className="text-3xl font-bold text-white">{totalQuestions - score}</div>
            <div className="text-xs text-dark-400 mt-1">Incorrectas</div>
          </div>
          <div className="p-4 rounded-xl bg-dark-800/50">
            <div className={`text-3xl font-bold ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
              {percentage}%
            </div>
            <div className="text-xs text-dark-400 mt-1">Puntuación</div>
          </div>
        </div>

        <button onClick={resetQuiz} className="btn-primary inline-flex items-center gap-2">
          <FiRotateCcw size={16} /> Reintentar
        </button>
      </motion.div>
    );
  }

  const config = difficultyConfig[currentQuestion.difficulty];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">{quiz.title}</h3>
        <div className="flex items-center gap-3">
          <span className={config.badge}>{config.label}</span>
          <span className="badge-blue">
            {answeredCount + 1} / {totalQuestions}
          </span>
        </div>
      </div>

      {quiz.description && (
        <p className="text-dark-400 text-sm mb-4">{quiz.description}</p>
      )}

      <div className="w-full h-1.5 bg-dark-800 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-white font-medium text-lg mb-5">{currentQuestion.question}</p>

          <div className="space-y-2">
            {currentQuestion.options.map((option, i) => {
              const selected = selectedOption === i;
              const correctOption = answered && i === currentQuestion.correctIndex;
              const wrongOption = answered && selected && i !== currentQuestion.correctIndex;

              return (
                <motion.button
                  key={i}
                  onClick={() => handleSelectOption(i)}
                  disabled={answered}
                  whileHover={!answered ? { scale: 1.01 } : undefined}
                  whileTap={!answered ? { scale: 0.99 } : undefined}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                    correctOption
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                      : wrongOption
                      ? 'border-red-500/50 bg-red-500/10 text-red-400'
                      : selected
                      ? 'border-brand-500/50 bg-brand-500/10 text-brand-400'
                      : 'border-dark-700/50 bg-dark-800/50 text-dark-300 hover:border-dark-600 hover:text-white'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm">{option}</span>
                  {correctOption && <FiCheckCircle size={16} className="ml-auto text-emerald-400" />}
                  {wrongOption && <FiXCircle size={16} className="ml-auto text-red-400" />}
                </motion.button>
              );
            })}
          </div>

          {answered && currentQuestion.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`mt-4 p-4 rounded-xl border ${
                isCorrect
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-red-500/5 border-red-500/20'
              }`}
            >
              <p className="text-sm text-dark-300">
                <span className={`font-semibold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isCorrect ? 'Correcto: ' : 'Incorrecto: '}
                </span>
                {currentQuestion.explanation}
              </p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-dark-800/50">
        <div className="text-sm text-dark-400">
          Puntos: <span className="text-white font-semibold">{score}</span>
        </div>

        {answered ? (
          <motion.button
            onClick={handleNextQuestion}
            className="btn-primary text-sm py-2 flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {answeredCount + 1 >= totalQuestions ? 'Ver Resultados' : 'Siguiente'}
            <FiArrowRight size={14} />
          </motion.button>
        ) : (
          <button
            onClick={handleSubmitAnswer}
            disabled={selectedOption === null}
            className="btn-primary text-sm py-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Responder
          </button>
        )}
      </div>
    </div>
  );
}
