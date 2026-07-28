'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiEdit2, FiTrash2, FiLayers, FiX, FiChevronDown, FiArrowLeft, FiCheck,
} from 'react-icons/fi';

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface PathCourse {
  order: number;
  course: Course;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  level: string;
  courses: PathCourse[];
}

export default function AdminPathsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [managingId, setManagingId] = useState<string | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [form, setForm] = useState({ title: '', description: '', level: 'BEGINNER' });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadPaths();
      loadCourses();
    }
  }, [status]);

  async function loadPaths() {
    try {
      const res = await fetch('/api/paths');
      if (res.ok) {
        const data = await res.json();
        setPaths(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function loadCourses() {
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const data = await res.json();
        setAllCourses(data);
      }
    } catch {
      // silent
    }
  }

  async function createPath() {
    if (!form.title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const path = await res.json();
        setPaths((prev) => [...prev, { ...path, courses: [] }]);
        setShowCreate(false);
        setForm({ title: '', description: '', level: 'BEGINNER' });
        toast.success('Ruta creada');
      } else {
        toast.error('Error al crear ruta');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setCreating(false);
    }
  }

  async function updatePath(pathId: string) {
    if (!form.title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    try {
      const res = await fetch(`/api/paths/${pathId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setPaths((prev) =>
          prev.map((p) => (p.id === pathId ? { ...p, ...form } : p))
        );
        setEditingId(null);
        toast.success('Ruta actualizada');
      } else {
        toast.error('Error al actualizar');
      }
    } catch {
      toast.error('Error de conexión');
    }
  }

  async function deletePath(pathId: string) {
    if (!confirm('¿Seguro que quieres eliminar esta ruta?')) return;
    try {
      const res = await fetch(`/api/paths/${pathId}`, { method: 'DELETE' });
      if (res.ok) {
        setPaths((prev) => prev.filter((p) => p.id !== pathId));
        toast.success('Ruta eliminada');
      }
    } catch {
      toast.error('Error al eliminar');
    }
  }

  async function addCourseToPath(pathId: string, courseId: string) {
    const path = paths.find((p) => p.id === pathId);
    if (!path) return;
    const nextOrder = path.courses.length > 0
      ? Math.max(...path.courses.map((c) => c.order)) + 1
      : 1;

    try {
      const res = await fetch(`/api/paths/${pathId}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, order: nextOrder }),
      });
      if (res.ok) {
        const course = allCourses.find((c) => c.id === courseId);
        if (course) {
          setPaths((prev) =>
            prev.map((p) =>
              p.id === pathId
                ? { ...p, courses: [...p.courses, { order: nextOrder, course }] }
                : p
            )
          );
        }
        toast.success('Curso añadido a la ruta');
      } else {
        toast.error('Error al añadir curso');
      }
    } catch {
      toast.error('Error de conexión');
    }
  }

  async function removeCourseFromPath(pathId: string, courseId: string) {
    try {
      const res = await fetch(`/api/paths/${pathId}/courses`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      if (res.ok) {
        setPaths((prev) =>
          prev.map((p) =>
            p.id === pathId
              ? { ...p, courses: p.courses.filter((c) => c.course.id !== courseId) }
              : p
          )
        );
        toast.success('Curso eliminado de la ruta');
      }
    } catch {
      toast.error('Error al eliminar curso');
    }
  }

  function startEditing(path: LearningPath) {
    setForm({ title: path.title, description: path.description, level: path.level });
    setEditingId(path.id);
    setShowCreate(false);
  }

  function startCreate() {
    setForm({ title: '', description: '', level: 'BEGINNER' });
    setShowCreate(true);
    setEditingId(null);
  }

  if (loading) {
    return (
      <div className="py-12 section">
        <div className="animate-pulse space-y-4">
          <div className="h-8 skeleton w-1/4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 skeleton rounded-2xl shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const levelLabels: Record<string, string> = {
    BEGINNER: 'Principiante',
    INTERMEDIATE: 'Intermedio',
    ADVANCED: 'Avanzado',
  };

  return (
    <div className="py-12">
      <div className="section">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/admin" className="flex items-center gap-2 text-dark-400 hover:text-white text-sm mb-4 transition-colors">
            <FiArrowLeft size={16} /> Panel admin
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="page-title">Rutas de Aprendizaje</h1>
              <p className="text-dark-400">{paths.length} rutas en total</p>
            </div>
            <button onClick={startCreate} className="btn-primary flex items-center gap-2">
              <FiPlus size={16} /> Nueva Ruta
            </button>
          </div>

          {/* Create / Edit form */}
          <AnimatePresence>
            {(showCreate || editingId) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      {editingId ? 'Editar ruta' : 'Nueva ruta'}
                    </h3>
                    <button
                      onClick={() => { setShowCreate(false); setEditingId(null); }}
                      className="text-dark-500 hover:text-white transition-colors"
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-dark-400 mb-1.5 block">Título</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="Ej: Fundamentos de Python"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-dark-400 mb-1.5 block">Nivel</label>
                      <select
                        value={form.level}
                        onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                        className="input"
                      >
                        <option value="BEGINNER">Principiante</option>
                        <option value="INTERMEDIATE">Intermedio</option>
                        <option value="ADVANCED">Avanzado</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-sm text-dark-400 mb-1.5 block">Descripción</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Describe el objetivo de esta ruta..."
                        rows={3}
                        className="input resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={() => { setShowCreate(false); setEditingId(null); }}
                      className="btn-secondary text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => editingId ? updatePath(editingId) : createPath()}
                      disabled={creating}
                      className="btn-primary text-sm"
                    >
                      {creating ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear ruta'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Paths list */}
          <div className="space-y-3">
            {paths.map((path) => (
              <motion.div
                key={path.id}
                className="card overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                layout
              >
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-accent-500/20 to-brand-500/20 rounded-xl flex items-center justify-center shrink-0">
                        <FiLayers size={20} className="text-accent-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-white font-semibold truncate">{path.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-dark-500 mt-0.5">
                          <span className="capitalize">{levelLabels[path.level] || path.level}</span>
                          <span>{path.courses.length} cursos</span>
                          {path.description && (
                            <span className="truncate max-w-xs">{path.description}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setManagingId(managingId === path.id ? null : path.id)}
                        className="text-xs py-1.5 px-3 rounded-lg border border-brand-500/30 text-brand-400 hover:bg-brand-500/10 transition-colors flex items-center gap-1"
                      >
                        <FiChevronDown size={12} className={`transition-transform ${managingId === path.id ? 'rotate-180' : ''}`} />
                        Cursos
                      </button>
                      <button
                        onClick={() => startEditing(path)}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                      >
                        <FiEdit2 size={12} /> Editar
                      </button>
                      <button
                        onClick={() => deletePath(path.id)}
                        className="text-xs py-1.5 px-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {managingId === path.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-dark-800/50 pt-4 space-y-3">
                        <h4 className="text-sm font-semibold text-dark-300">Cursos en esta ruta</h4>
                        {path.courses.length === 0 ? (
                          <p className="text-sm text-dark-500 italic">No hay cursos en esta ruta</p>
                        ) : (
                          <div className="space-y-2">
                            {[...path.courses]
                              .sort((a, b) => a.order - b.order)
                              .map((entry) => (
                                <div
                                  key={entry.course.id}
                                  className="flex items-center justify-between bg-dark-800/50 rounded-xl p-3"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-400">
                                      {entry.order}
                                    </div>
                                    <span className="text-sm text-dark-200">{entry.course.title}</span>
                                  </div>
                                  <button
                                    onClick={() => removeCourseFromPath(path.id, entry.course.id)}
                                    className="p-1.5 text-dark-500 hover:text-red-400 transition-colors"
                                  >
                                    <FiTrash2 size={12} />
                                  </button>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Add course */}
                        <div className="pt-2 border-t border-dark-800/50">
                          <h4 className="text-sm font-semibold text-dark-300 mb-2">Añadir curso</h4>
                          <div className="flex flex-wrap gap-2">
                            {allCourses
                              .filter((c) => !path.courses.some((pc) => pc.course.id === c.id))
                              .map((course) => (
                                <button
                                  key={course.id}
                                  onClick={() => addCourseToPath(path.id, course.id)}
                                  className="text-xs py-1.5 px-3 rounded-lg border border-dark-700/50 text-dark-300 hover:border-brand-500/30 hover:text-brand-400 hover:bg-brand-500/5 transition-all flex items-center gap-1"
                                >
                                  <FiPlus size={12} /> {course.title}
                                </button>
                              ))}
                            {allCourses.filter((c) => !path.courses.some((pc) => pc.course.id === c.id)).length === 0 && (
                              <p className="text-xs text-dark-500 italic">Todos los cursos ya están en esta ruta</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {paths.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FiLayers size={24} className="text-dark-500" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">No hay rutas creadas</h2>
                <p className="text-dark-400 mb-6">Crea la primera ruta de aprendizaje.</p>
                <button onClick={startCreate} className="btn-primary">Crear ruta</button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
