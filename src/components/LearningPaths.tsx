'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiChevronDown,
  FiPlus,
  FiX,
  FiBookOpen,
  FiUsers,
  FiLayers,
  FiArrowRight,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Course {
  id: string;
  title: string;
  slug: string;
  level: string;
  thumbnail: string | null;
  _count?: { enrollments: number };
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  level: string;
  thumbnail: string | null;
  courses: { order: number; course: Course }[];
}

const levelLabels: Record<string, string> = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
};

const levelColors: Record<string, string> = {
  BEGINNER: 'badge-green',
  INTERMEDIATE: 'badge-blue',
  ADVANCED: 'badge-purple',
};

export function LearningPaths() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPath, setNewPath] = useState({
    title: '',
    description: '',
    level: 'BEGINNER',
  });

  useEffect(() => {
    fetchPaths();
  }, []);

  const fetchPaths = async () => {
    try {
      const res = await fetch('/api/paths');
      if (res.ok) {
        const data = await res.json();
        setPaths(data);
      }
    } catch {
      toast.error('Error al cargar rutas de aprendizaje');
    } finally {
      setLoading(false);
    }
  };

  const createPath = async () => {
    if (!newPath.title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPath),
      });
      if (res.ok) {
        const path = await res.json();
        setPaths((prev) => [...prev, { ...path, courses: [] }]);
        setShowCreate(false);
        setNewPath({ title: '', description: '', level: 'BEGINNER' });
        toast.success('Ruta creada');
      } else {
        toast.error('Error al crear ruta');
      }
    } catch {
      toast.error('Error al crear ruta');
    } finally {
      setCreating(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6 shimmer h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-500/15 rounded-xl">
            <FiLayers size={20} className="text-accent-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Rutas de Aprendizaje</h2>
            <p className="text-sm text-dark-400">Sigue una ruta guiada para dominar un tema</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex items-center gap-2">
          <FiPlus size={16} />
          <span className="hidden sm:inline">Nueva ruta</span>
        </button>
      </div>

      {paths.length === 0 && (
        <div className="card p-12 text-center">
          <FiLayers size={40} className="text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">No hay rutas disponibles aún</p>
        </div>
      )}

      <div className="space-y-3">
        {paths.map((path, index) => {
          const isExpanded = expandedId === path.id;
          const sortedCourses = [...path.courses].sort((a, b) => a.order - b.order);

          return (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="card overflow-visible"
            >
              <button
                onClick={() => toggleExpand(path.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-dark-800/30 transition-colors group"
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-dark-500 group-hover:text-dark-300 shrink-0"
                >
                  <FiChevronDown size={20} />
                </motion.div>

                {path.thumbnail ? (
                  <img
                    src={path.thumbnail}
                    alt={path.title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-600/20 to-accent-600/20 flex items-center justify-center shrink-0">
                    <FiLayers size={24} className="text-brand-500/40" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold truncate">{path.title}</h3>
                    <span className={levelColors[path.level] || 'badge-blue'}>
                      {levelLabels[path.level] || path.level}
                    </span>
                  </div>
                  <p className="text-sm text-dark-400 line-clamp-1">{path.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-dark-500">
                    <span className="flex items-center gap-1">
                      <FiBookOpen size={12} />
                      {path.courses.length} cursos
                    </span>
                  </div>
                </div>

                <FiArrowRight
                  size={18}
                  className={`text-dark-600 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-3">
                      {sortedCourses.length === 0 ? (
                        <p className="text-sm text-dark-500 italic py-4 text-center">
                          No hay cursos en esta ruta aún
                        </p>
                      ) : (
                        sortedCourses.map((entry, i) => (
                          <div key={entry.course.id} className="flex items-center gap-4">
                            <div className="relative flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-400 shrink-0">
                                {entry.order}
                              </div>
                              {i < sortedCourses.length - 1 && (
                                <div className="w-px h-6 bg-dark-700/50 mt-1" />
                              )}
                            </div>

                            <Link
                              href={`/cursos/${entry.course.slug}`}
                              className="flex-1 flex items-center gap-3 p-3 rounded-xl hover:bg-dark-800/50 transition-colors group"
                            >
                              {entry.course.thumbnail ? (
                                <img
                                  src={entry.course.thumbnail}
                                  alt={entry.course.title}
                                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-dark-800 flex items-center justify-center shrink-0">
                                  <FiBookOpen size={16} className="text-dark-600" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-dark-200 group-hover:text-white transition-colors truncate">
                                  {entry.course.title}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span
                                    className={`text-[11px] ${
                                      levelColors[entry.course.level] || 'badge-blue'
                                    }`}
                                  >
                                    {levelLabels[entry.course.level] || entry.course.level}
                                  </span>
                                  {entry.course._count && (
                                    <span className="text-[11px] text-dark-500 flex items-center gap-1">
                                      <FiUsers size={10} />
                                      {entry.course._count.enrollments}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setShowCreate(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">Nueva ruta de aprendizaje</h3>
                  <button
                    onClick={() => setShowCreate(false)}
                    className="text-dark-500 hover:text-white transition-colors"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-dark-400 mb-1.5 block">Título</label>
                    <input
                      type="text"
                      value={newPath.title}
                      onChange={(e) => setNewPath((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Ej: Fundamentos de Python"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-dark-400 mb-1.5 block">Descripción</label>
                    <textarea
                      value={newPath.description}
                      onChange={(e) => setNewPath((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Describe el objetivo de esta ruta..."
                      rows={3}
                      className="input resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-dark-400 mb-1.5 block">Nivel</label>
                    <select
                      value={newPath.level}
                      onChange={(e) => setNewPath((p) => ({ ...p, level: e.target.value }))}
                      className="input"
                    >
                      <option value="BEGINNER">Principiante</option>
                      <option value="INTERMEDIATE">Intermedio</option>
                      <option value="ADVANCED">Avanzado</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">
                    Cancelar
                  </button>
                  <button onClick={createPath} disabled={creating} className="btn-primary text-sm">
                    {creating ? 'Creando...' : 'Crear ruta'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
