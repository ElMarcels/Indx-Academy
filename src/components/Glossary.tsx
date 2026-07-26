'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiChevronDown, FiChevronUp, FiX, FiBook } from 'react-icons/fi';

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  example: string | null;
  category: string | null;
}

interface GlossaryProps {
  terms: GlossaryTerm[];
}

export function Glossary({ terms }: GlossaryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    terms.forEach((t) => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats).sort();
  }, [terms]);

  const alphabet = useMemo(() => {
    const letters = new Set<string>();
    terms.forEach((t) => {
      letters.add(t.term.charAt(0).toUpperCase());
    });
    return Array.from(letters).sort();
  }, [terms]);

  const filteredTerms = useMemo(() => {
    let result = terms;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.term.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q) ||
          (t.example && t.example.toLowerCase().includes(q))
      );
    }

    if (selectedCategory) {
      result = result.filter((t) => t.category === selectedCategory);
    }

    if (activeLetter) {
      result = result.filter((t) => t.term.charAt(0).toUpperCase() === activeLetter);
    }

    return result.sort((a, b) => a.term.localeCompare(b.term));
  }, [terms, searchQuery, selectedCategory, activeLetter]);

  function toggleExpanded(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  function clearFilters() {
    setSearchQuery('');
    setSelectedCategory(null);
    setActiveLetter(null);
  }

  const hasFilters = searchQuery || selectedCategory || activeLetter;

  return (
    <div className="space-y-4">
      <div className="relative">
        <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar términos..."
          className="input pl-11 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white"
          >
            <FiX size={14} />
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
              !selectedCategory
                ? 'bg-brand-500/20 border-brand-500/40 text-brand-400'
                : 'bg-dark-800/50 border-dark-700/50 text-dark-400 hover:text-white hover:border-dark-600'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-accent-500/20 border-accent-500/40 text-accent-400'
                  : 'bg-dark-800/50 border-dark-700/50 text-dark-400 hover:text-white hover:border-dark-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {alphabet.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {alphabet.map((letter) => (
            <button
              key={letter}
              onClick={() => setActiveLetter(activeLetter === letter ? null : letter)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeLetter === letter
                  ? 'bg-brand-500/20 border border-brand-500/40 text-brand-400'
                  : 'bg-dark-800/50 border border-dark-700/30 text-dark-400 hover:text-white hover:border-dark-600'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      )}

      {hasFilters && (
        <button onClick={clearFilters} className="text-xs text-dark-400 hover:text-white flex items-center gap-1">
          <FiX size={12} /> Limpiar filtros
        </button>
      )}

      {filteredTerms.length === 0 ? (
        <motion.div
          className="card p-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <FiBook size={32} className="text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400">No se encontraron términos</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredTerms.map((term) => {
              const expanded = expandedId === term.id;

              return (
                <motion.div
                  key={term.id}
                  className="card overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  layout
                >
                  <button
                    onClick={() => toggleExpanded(term.id)}
                    className="w-full text-left p-4 flex items-center gap-3 hover:bg-dark-800/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{term.term}</span>
                        {term.category && (
                          <span className="badge-purple text-[10px]">{term.category}</span>
                        )}
                      </div>
                      {!expanded && (
                        <p className="text-sm text-dark-400 truncate mt-0.5">{term.definition}</p>
                      )}
                    </div>
                    {expanded ? (
                      <FiChevronUp size={16} className="text-dark-400 flex-shrink-0" />
                    ) : (
                      <FiChevronDown size={16} className="text-dark-400 flex-shrink-0" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-dark-800/50 pt-3">
                          <p className="text-sm text-dark-300 leading-relaxed">{term.definition}</p>
                          {term.example && (
                            <div className="mt-3 p-3 bg-dark-800/50 rounded-lg border border-dark-700/30">
                              <p className="text-xs text-dark-500 mb-1">Ejemplo:</p>
                              <p className="text-sm text-dark-200 font-mono">{term.example}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
