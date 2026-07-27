'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiUserPlus,
  FiTrash2,
  FiSearch,
  FiLoader,
  FiShield,
  FiX,
  FiCheck,
} from 'react-icons/fi';
import { CourseTeacher } from '@/types';

interface CourseTeachersManagerProps {
  courseId: string;
}

interface SearchUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  TEACHER: 'Profesor',
  ASSISTANT: 'Asistente',
};

const ROLE_COLORS: Record<string, string> = {
  TEACHER: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  ASSISTANT: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
};

export function CourseTeachersManager({ courseId }: CourseTeachersManagerProps) {
  const [teachers, setTeachers] = useState<CourseTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<CourseTeacher | null>(null);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/teachers`);
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.teachers);
      }
    } catch {
      toast.error('Error al cargar profesores');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    if (!dialogOpen) {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [dialogOpen]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(searchQuery)}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          toast.error('Error al buscar usuarios');
        }
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  async function addTeacher(userId: string) {
    setAddingId(userId);
    try {
      const res = await fetch(`/api/courses/${courseId}/teachers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setTeachers((prev) => [...prev, data.teacher]);
        toast.success('Profesor agregado');
        setDialogOpen(false);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al agregar');
      }
    } catch {
      toast.error('Error al agregar profesor');
    } finally {
      setAddingId(null);
    }
  }

  async function changeRole(teacherId: string, newRole: string) {
    try {
      const res = await fetch(
        `/api/courses/${courseId}/teachers/${teacherId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setTeachers((prev) =>
          prev.map((t) => (t.id === teacherId ? data.teacher : t))
        );
        toast.success('Rol actualizado');
      } else {
        toast.error('Error al cambiar rol');
      }
    } catch {
      toast.error('Error al cambiar rol');
    }
  }

  async function removeTeacher(teacherId: string) {
    setRemovingId(teacherId);
    try {
      const res = await fetch(
        `/api/courses/${courseId}/teachers/${teacherId}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
        toast.success('Profesor eliminado');
        setConfirmRemove(null);
      } else {
        toast.error('Error al eliminar');
      }
    } catch {
      toast.error('Error al eliminar profesor');
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center gap-2 py-8">
          <FiLoader size={16} className="animate-spin text-dark-500" />
          <span className="text-dark-500 text-sm">Cargando profesores...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500/15 rounded-xl flex items-center justify-center">
            <FiShield size={16} className="text-brand-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">
              Profesores del Curso
            </h3>
            <p className="text-dark-500 text-xs">
              {teachers.length} asignado{teachers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="btn-primary text-xs py-2 px-3 flex items-center gap-2"
        >
          <FiUserPlus size={14} />
          Agregar Profesor
        </button>
      </div>

      {teachers.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-dark-800 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FiUserPlus size={20} className="text-dark-600" />
          </div>
          <p className="text-dark-500 text-sm">
            No hay profesores asignados aún
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {teachers.map((teacher) => (
            <motion.div
              key={teacher.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center justify-between p-3 bg-dark-800/50 rounded-xl hover:bg-dark-800/80 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full overflow-hidden">
                    {teacher.user.image ? (
                      <img
                        src={teacher.user.image}
                        alt={teacher.user.name || ''}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-500/30 via-accent-500/20 to-emerald-500/30 flex items-center justify-center">
                        <span className="text-sm font-bold text-white/80">
                          {(teacher.user.name || '?')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {teacher.user.name || 'Sin nombre'}
                  </p>
                  <p className="text-dark-500 text-xs truncate">
                    {teacher.user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                <select
                  value={teacher.role}
                  onChange={(e) => changeRole(teacher.id, e.target.value)}
                  className="bg-dark-700 border border-dark-600 text-dark-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-500 transition-colors cursor-pointer appearance-none"
                >
                  <option value="TEACHER">Profesor</option>
                  <option value="ASSISTANT">Asistente</option>
                </select>

                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${ROLE_COLORS[teacher.role] || ROLE_COLORS.TEACHER}`}
                >
                  {ROLE_LABELS[teacher.role] || teacher.role}
                </span>

                <span className="text-[10px] text-dark-600 whitespace-nowrap">
                  {new Date(teacher.addedAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>

                <button
                  onClick={() => setConfirmRemove(teacher)}
                  className="text-dark-600 hover:text-red-400 transition-colors p-1"
                  title="Eliminar profesor"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Teacher Dialog */}
      <AnimatePresence>
        {dialogOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm"
              onClick={() => setDialogOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) =>
                e.target === e.currentTarget && setDialogOpen(false)
              }
            >
              <div className="card p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-500/15 rounded-xl flex items-center justify-center">
                      <FiUserPlus size={18} className="text-brand-400" />
                    </div>
                    <h3 className="text-white font-semibold">
                      Agregar Profesor
                    </h3>
                  </div>
                  <button
                    onClick={() => setDialogOpen(false)}
                    className="text-dark-500 hover:text-white transition-colors p-1"
                  >
                    <FiX size={16} />
                  </button>
                </div>

                <div className="relative mb-4">
                  <FiSearch
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre o email..."
                    className="w-full bg-dark-800 border border-dark-600 text-white text-sm rounded-xl pl-9 pr-4 py-2.5 placeholder:text-dark-500 focus:outline-none focus:border-brand-500 transition-colors"
                    autoFocus
                  />
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {searchQuery.trim().length < 2 ? (
                    <div className="text-center py-8">
                      <FiSearch
                        size={20}
                        className="text-dark-600 mx-auto mb-2"
                      />
                      <p className="text-dark-500 text-xs">
                        Escribe al menos 2 caracteres para buscar
                      </p>
                    </div>
                  ) : searchLoading ? (
                    <div className="flex items-center justify-center gap-2 py-8">
                      <FiLoader
                        size={14}
                        className="animate-spin text-dark-500"
                      />
                      <span className="text-dark-500 text-xs">Buscando...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-dark-500 text-xs">
                        No se encontraron usuarios
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {searchResults.map((user) => {
                        const alreadyAdded = teachers.some(
                          (t) => t.userId === user.id
                        );
                        return (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                              alreadyAdded
                                ? 'opacity-50'
                                : 'hover:bg-dark-800/80 cursor-pointer'
                            }`}
                            onClick={() => {
                              if (!alreadyAdded && addingId !== user.id) {
                                addTeacher(user.id);
                              }
                            }}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                {user.image ? (
                                  <img
                                    src={user.image}
                                    alt={user.name || ''}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-brand-500/30 via-accent-500/20 to-emerald-500/30 flex items-center justify-center">
                                    <span className="text-xs font-bold text-white/80">
                                      {(user.name || '?')[0].toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-white text-sm font-medium truncate">
                                  {user.name || 'Sin nombre'}
                                </p>
                                <p className="text-dark-500 text-xs truncate">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex-shrink-0 ml-2">
                              {alreadyAdded ? (
                                <span className="text-dark-600 text-[10px] flex items-center gap-1">
                                  <FiCheck size={10} /> Asignado
                                </span>
                              ) : addingId === user.id ? (
                                <FiLoader
                                  size={14}
                                  className="animate-spin text-brand-400"
                                />
                              ) : (
                                <FiUserPlus
                                  size={14}
                                  className="text-dark-500"
                                />
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Remove Confirmation */}
      <AnimatePresence>
        {confirmRemove && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm"
              onClick={() => setConfirmRemove(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) =>
                e.target === e.currentTarget && setConfirmRemove(null)
              }
            >
              <div className="card p-6 w-full max-w-sm shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/15 rounded-xl flex items-center justify-center">
                      <FiTrash2 size={18} className="text-red-400" />
                    </div>
                    <h3 className="text-white font-semibold">
                      Eliminar Profesor
                    </h3>
                  </div>
                  <button
                    onClick={() => setConfirmRemove(null)}
                    className="text-dark-500 hover:text-white transition-colors p-1"
                  >
                    <FiX size={16} />
                  </button>
                </div>
                <p className="text-dark-300 text-sm mb-6 pl-[52px]">
                  Se eliminará a{' '}
                  <span className="text-white font-medium">
                    {confirmRemove.user.name || 'este usuario'}
                  </span>{' '}
                  como profesor de este curso.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setConfirmRemove(null)}
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => removeTeacher(confirmRemove.id)}
                    disabled={removingId === confirmRemove.id}
                    className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 text-sm flex items-center gap-2"
                  >
                    <FiTrash2 size={14} />
                    {removingId === confirmRemove.id
                      ? 'Eliminando...'
                      : 'Eliminar'}
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
