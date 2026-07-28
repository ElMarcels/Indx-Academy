'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Glossary } from '@/components/Glossary';
import { FlashcardViewer } from '@/components/FlashcardViewer';
import { FiBook, FiLayers } from 'react-icons/fi';

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  example: string | null;
  category: string | null;
}

export default function GlosarioPage() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'glossary' | 'flashcards'>('glossary');

  useEffect(() => {
    async function fetchTerms() {
      try {
        const res = await fetch('/api/glossary');
        if (res.ok) {
          const data = await res.json();
          setTerms(data.terms || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchTerms();
  }, []);

  if (loading) {
    return (
      <div className="py-12 section">
        <div className="animate-pulse space-y-4">
          <div className="h-8 skeleton w-1/3" />
          <div className="h-4 skeleton w-1/2" />
          <div className="h-10 skeleton rounded-xl" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 skeleton rounded-xl shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="section max-w-4xl">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand-500/15 rounded-xl">
              <FiBook size={20} className="text-brand-400" />
            </div>
            <h1 className="page-title">Glosario Técnico</h1>
          </div>
          <p className="text-dark-400">
            Referencia de términos técnicos utilizados en los cursos.
          </p>
          <p className="text-sm text-dark-500 mt-1">
            {terms.length} {terms.length === 1 ? 'término registrado' : 'términos registrados'}
          </p>
        </motion.div>

        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setView('glossary')}
            className={view === 'glossary' ? 'tab-btn-active' : 'tab-btn'}
          >
            <FiBook size={14} className="inline mr-1.5" /> Glosario
          </button>
          <button
            onClick={() => setView('flashcards')}
            className={view === 'flashcards' ? 'tab-btn-active' : 'tab-btn'}
          >
            <FiLayers size={14} className="inline mr-1.5" /> Flashcards
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {view === 'glossary' ? (
            <Glossary terms={terms} />
          ) : (
            <FlashcardViewer />
          )}
        </motion.div>
      </div>
    </div>
  );
}
