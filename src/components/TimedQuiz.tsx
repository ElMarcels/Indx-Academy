'use client';

import { useState, useEffect, useRef } from 'react';
import { FiClock, FiAlertTriangle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface TimedQuizProps {
  quizId: string;
  timeLimit: number; // seconds
  onComplete?: () => void;
}

export function TimedQuiz({ quizId, timeLimit, onComplete }: TimedQuizProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [expired, setExpired] = useState(false);
  const [started, setStarted] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (started && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [started, timeLeft]);

  function startTimer() {
    setStarted(true);
    setStartedAt(Date.now());
    setTimeLeft(timeLimit);
  }

  useEffect(() => {
    if (expired) {
      toast.error('¡Tiempo agotado! El quiz se enviará automáticamente.');
      onComplete?.();
    }
  }, [expired]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const percentage = (timeLeft / timeLimit) * 100;
  const isLow = timeLeft <= 30;
  const isCritical = timeLeft <= 10;

  if (!started) {
    return (
      <div className="card p-6 text-center mb-4">
        <FiClock size={32} className="text-yellow-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">Modo Examen</h3>
        <p className="text-dark-400 text-sm mb-2">
          Tienes <span className="text-white font-semibold">{Math.floor(timeLimit / 60)} minuto{timeLimit >= 120 ? 's' : ''}</span> para completar este quiz.
        </p>
        <p className="text-dark-500 text-xs mb-4">Una vez que empieces, el tiempo no se puede pausar.</p>
        <button onClick={startTimer} className="btn-primary text-sm">
          Empezar examen
        </button>
      </div>
    );
  }

  return (
    <div className={`mb-4 p-3 rounded-xl border transition-all ${
      isCritical ? 'border-red-500/50 bg-red-500/10' : isLow ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-dark-700 bg-dark-800/50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCritical ? (
            <FiAlertTriangle size={16} className="text-red-400 animate-pulse" />
          ) : (
            <FiClock size={16} className={isLow ? 'text-yellow-400' : 'text-dark-400'} />
          )}
          <span className={`text-sm font-mono font-bold ${
            isCritical ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-dark-300'
          }`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>

        <div className="flex-1 mx-4 h-1.5 bg-dark-700 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full rounded-full ${
              isCritical ? 'bg-red-500' : isLow ? 'bg-yellow-500' : 'bg-brand-500'
            }`}
          />
        </div>

        <span className="text-xs text-dark-500">{Math.floor(timeLeft / 60)}:{String(seconds).padStart(2, '0')}</span>
      </div>
    </div>
  );
}
