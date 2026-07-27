'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiLayers, FiRotateCw, FiCheckCircle, FiArrowRight, FiLoader,
} from 'react-icons/fi';

interface Flashcard {
  id: string;
  term: string;
  definition: string;
  example: string | null;
  order: number;
  review?: {
    quality: number;
    interval: number;
    nextReview: string;
  } | null;
}

interface Props {
  courseId: string;
}

export function CourseFlashcardViewer({ courseId }: Props) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);

  const fetchFlashcards = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/flashcards`);
      if (res.ok) {
        const data = await res.json();
        setFlashcards(data.flashcards || []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchFlashcards(); }, [fetchFlashcards]);

  async function submitReview(quality: number) {
    const card = flashcards[currentIndex];
    if (!card) return;
    setReviewing(card.id);
    try {
      const res = await fetch(`/api/courses/${courseId}/flashcards/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcardId: card.id, quality }),
      });
      if (res.ok) {
        setFlipped(false);
        if (currentIndex < flashcards.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          toast.success('¡Has completado todas las flashcards!');
          setCurrentIndex(0);
        }
      } else {
        toast.error('Error al guardar');
      }
    } catch { toast.error('Error de conexión'); } finally { setReviewing(null); }
  }

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-6 bg-dark-800 rounded w-1/3 mb-4" />
        <div className="h-40 bg-dark-800 rounded-xl" />
      </div>
    );
  }

  if (flashcards.length === 0) return null;

  const card = flashcards[currentIndex];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <FiLayers size={18} className="text-brand-400" /> Flashcards del Curso
        <span className="badge-blue text-[10px]">{flashcards.length}</span>
      </h3>

      <div className="flex items-center justify-between text-xs text-dark-500">
        <span>{currentIndex + 1} / {flashcards.length}</span>
        {card.review && (
          <span className="flex items-center gap-1 text-green-400">
            <FiCheckCircle size={10} /> Revisada
          </span>
        )}
      </div>

      <div
        className="relative h-48 cursor-pointer perspective-1000"
        onClick={() => setFlipped(!flipped)}
      >
        <motion.div
          className="absolute inset-0 rounded-2xl p-6 flex items-center justify-center backface-hidden"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.4 }}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="card w-full h-full flex items-center justify-center text-center p-6">
            <div>
              <p className="text-lg font-semibold text-white">{card.term}</p>
              <p className="text-xs text-dark-500 mt-2">Toca para ver la definición</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute inset-0 rounded-2xl p-6 flex items-center justify-center backface-hidden"
          animate={{ rotateY: flipped ? 0 : -180 }}
          transition={{ duration: 0.4 }}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="card w-full h-full flex items-center justify-center text-center p-6 bg-brand-500/5 border-brand-500/20">
            <div>
              <p className="text-sm text-dark-200">{card.definition}</p>
              {card.example && (
                <p className="text-xs text-dark-400 mt-2 italic">"{card.example}"</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {flipped && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2"
        >
          <span className="text-xs text-dark-500 mr-2">¿Qué tan bien lo sabías?</span>
          {[1, 3, 5].map((q) => (
            <button
              key={q}
              onClick={() => submitReview(q)}
              disabled={reviewing === card.id}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                q === 1 ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                : q === 3 ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20'
                : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
              }`}
            >
              {q === 1 ? 'Difícil' : q === 3 ? 'Regular' : 'Fácil'}
            </button>
          ))}
        </motion.div>
      )}

      <div className="flex justify-center">
        <button
          onClick={() => { setFlipped(false); setCurrentIndex((prev) => (prev + 1) % flashcards.length); }}
          className="btn-secondary text-xs flex items-center gap-1"
        >
          Siguiente <FiArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
