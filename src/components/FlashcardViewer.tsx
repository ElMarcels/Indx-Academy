'use client';

import { useState, useEffect } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiBook } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Flashcard {
  id: string;
  term: string;
  definition: string;
  example: string | null;
  category: string | null;
  isNew?: boolean;
}

const QUALITY_LABELS = [
  { value: 0, label: 'No la sé', color: 'text-red-400 bg-red-500/10' },
  { value: 1, label: 'Difícil', color: 'text-orange-400 bg-orange-500/10' },
  { value: 2, label: 'Regular', color: 'text-yellow-400 bg-yellow-500/10' },
  { value: 3, label: 'Bien', color: 'text-blue-400 bg-blue-500/10' },
  { value: 4, label: 'Fácil', color: 'text-emerald-400 bg-emerald-500/10' },
  { value: 5, label: 'Perfecta', color: 'text-emerald-300 bg-emerald-500/10' },
];

export function FlashcardViewer() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ totalReviewed: 0, dueCount: 0, newCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCards(); }, []);

  async function loadCards() {
    setLoading(true);
    try {
      const res = await fetch('/api/flashcards');
      const data = await res.json();
      const allCards = [...(data.due || []), ...(data.newTerms || [])];
      setCards(allCards);
      setStats({ totalReviewed: data.totalReviewed || 0, dueCount: (data.due || []).length, newCount: (data.newTerms || []).length });
      setCurrentIndex(0);
      setFlipped(false);
    } catch { /* silent */ }
    setLoading(false);
  }

  async function rate(quality: number) {
    const card = cards[currentIndex];
    if (!card) return;

    try {
      await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ glossaryId: card.id, quality }),
      });

      setCards((prev) => prev.filter((_, i) => i !== currentIndex));
      setFlipped(false);
      if (currentIndex >= cards.length - 1) {
        setCurrentIndex(Math.max(0, cards.length - 2));
      }
      setStats((prev) => ({ ...prev, totalReviewed: prev.totalReviewed + 1 }));
    } catch {
      toast.error('Error al guardar');
    }
  }

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <div className="w-8 h-8 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="card p-8 text-center">
        <FiBook size={32} className="text-emerald-400 mx-auto mb-3" />
        <h3 className="text-white font-semibold mb-1">¡Todo al día!</h3>
        <p className="text-dark-400 text-sm mb-4">No hay tarjetas pendientes de repaso.</p>
        <div className="flex items-center justify-center gap-4 text-xs text-dark-500">
          <span>Total repasadas: {stats.totalReviewed}</span>
        </div>
        <button onClick={loadCards} className="btn-outline text-sm mt-4 flex items-center gap-2 mx-auto">
          <FiRefreshCw size={14} /> Actualizar
        </button>
      </div>
    );
  }

  const card = cards[currentIndex];
  if (!card) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-dark-400">
        <span>{currentIndex + 1} / {cards.length} tarjetas</span>
        <div className="flex gap-3">
          <span className="text-yellow-400">{stats.dueCount} para repasar</span>
          <span className="text-blue-400">{stats.newCount} nuevas</span>
          <span className="text-dark-500">Repasadas: {stats.totalReviewed}</span>
        </div>
      </div>

      <div className="perspective-1000 cursor-pointer" onClick={() => setFlipped(!flipped)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${card.id}-${flipped}`}
            initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="card p-8 min-h-[250px] flex flex-col items-center justify-center text-center"
          >
            {card.category && (
              <span className="badge-brand text-[10px] mb-3">{card.category}</span>
            )}
            <h3 className="text-xl font-bold text-white mb-3">{card.term}</h3>
            {flipped ? (
              <div className="space-y-3">
                <p className="text-dark-300 text-sm leading-relaxed">{card.definition}</p>
                {card.example && (
                  <p className="text-dark-500 text-xs italic">&ldquo;{card.example}&rdquo;</p>
                )}
              </div>
            ) : (
              <p className="text-dark-500 text-sm">Toca para ver la definición</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {flipped && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <p className="text-center text-dark-400 text-xs">¿Qué tan bien la sabías?</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {QUALITY_LABELS.map((q) => (
              <button
                key={q.value}
                onClick={() => rate(q.value)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${q.color}`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {!flipped && (
        <div className="flex justify-center">
          <button onClick={() => setFlipped(true)} className="btn-primary text-sm flex items-center gap-2">
            <FiCheck size={14} /> Voltear tarjeta
          </button>
        </div>
      )}
    </div>
  );
}
