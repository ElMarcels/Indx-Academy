'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiPlus, FiTrash2, FiEdit2, FiChevronDown, FiChevronUp, FiLayers, FiArrowUp, FiArrowDown, FiLoader, FiX, FiCheck,
} from 'react-icons/fi';

interface SubmoduleItem {
  id: string;
  title: string;
  order: number;
  lessons: { id: string; title: string; order: number; isFree: boolean }[];
}

interface Props {
  moduleId: string;
}

export function SubmoduleManager({ moduleId }: Props) {
  const [submodules, setSubmodules] = useState<SubmoduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSubmodules = useCallback(async () => {
    try {
      const res = await fetch(`/api/modules/${moduleId}/submodules`);
      if (res.ok) {
        const data = await res.json();
        setSubmodules(data.submodules || []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => { fetchSubmodules(); }, [fetchSubmodules]);

  async function createSubmodule() {
    if (!newTitle.trim()) return;
    setActionLoading('create');
    try {
      const res = await fetch(`/api/modules/${moduleId}/submodules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), order: submodules.length + 1 }),
      });
      if (res.ok) {
        setNewTitle('');
        setCreating(false);
        toast.success('Submódulo creado');
        fetchSubmodules();
      } else {
        toast.error('Error al crear');
      }
    } catch { toast.error('Error de conexión'); } finally { setActionLoading(null); }
  }

  async function updateSubmodule(id: string) {
    if (!editTitle.trim()) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/modules/${moduleId}/submodules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      if (res.ok) {
        setEditingId(null);
        toast.success('Actualizado');
        fetchSubmodules();
      } else { toast.error('Error'); }
    } catch { toast.error('Error de conexión'); } finally { setActionLoading(null); }
  }

  async function deleteSubmodule(id: string) {
    if (!confirm('¿Eliminar este submódulo? Las lecciones no se eliminarán.')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/modules/${moduleId}/submodules/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Eliminado'); fetchSubmodules(); }
      else { toast.error('Error'); }
    } catch { toast.error('Error de conexión'); } finally { setActionLoading(null); }
  }

  async function reorder(id: string, direction: 'up' | 'down') {
    const idx = submodules.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= submodules.length) return;
    const swapped = [...submodules];
    const tempOrder = swapped[idx].order;
    swapped[idx] = { ...swapped[idx], order: swapped[target].order };
    swapped[target] = { ...swapped[target], order: tempOrder };
    [swapped[idx], swapped[target]] = [swapped[target], swapped[idx]];
    setSubmodules(swapped);
  }

  if (loading) {
    return (
      <div className="card p-4 animate-pulse space-y-3">
        <div className="h-4 bg-dark-800 rounded w-1/3" />
        <div className="h-8 bg-dark-800 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <FiLayers size={14} className="text-brand-400" /> Submódulos
          <span className="badge-blue text-[10px]">{submodules.length}</span>
        </h3>
        <button
          onClick={() => setCreating(true)}
          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
        >
          <FiPlus size={12} /> Nuevo
        </button>
      </div>

      <AnimatePresence>
        {creating && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="card p-3 flex gap-2">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createSubmodule()}
                placeholder="Título del submódulo..."
                className="input flex-1 text-sm"
                autoFocus
              />
              <button onClick={createSubmodule} disabled={actionLoading === 'create'} className="btn-primary text-xs px-3">
                {actionLoading === 'create' ? <FiLoader size={12} className="animate-spin" /> : <FiCheck size={12} />}
              </button>
              <button onClick={() => { setCreating(false); setNewTitle(''); }} className="btn-secondary text-xs px-3">
                <FiX size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {submodules.length === 0 ? (
        <div className="card p-6 text-center">
          <FiLayers size={24} className="text-dark-600 mx-auto mb-2" />
          <p className="text-dark-400 text-sm">Sin submódulos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {submodules.map((sub, idx) => (
            <motion.div key={sub.id} layout className="card overflow-hidden">
              <div className="p-3 flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => reorder(sub.id, 'up')}
                    disabled={idx === 0}
                    className="text-dark-500 hover:text-white disabled:opacity-20 transition-colors"
                  >
                    <FiArrowUp size={10} />
                  </button>
                  <button
                    onClick={() => reorder(sub.id, 'down')}
                    disabled={idx === submodules.length - 1}
                    className="text-dark-500 hover:text-white disabled:opacity-20 transition-colors"
                  >
                    <FiArrowDown size={10} />
                  </button>
                </div>

                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                >
                  {editingId === sub.id ? (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && updateSubmodule(sub.id)}
                        className="input text-sm flex-1"
                        autoFocus
                      />
                      <button onClick={() => updateSubmodule(sub.id)} className="text-green-400 hover:text-green-300">
                        <FiCheck size={14} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-dark-500 hover:text-white">
                        <FiX size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-dark-500 w-5">#{sub.order}</span>
                      <span className="text-sm font-medium text-white">{sub.title}</span>
                      <span className="text-[10px] text-dark-500">{sub.lessons.length} lecciones</span>
                      {expandedId === sub.id ? <FiChevronUp size={12} className="text-dark-500" /> : <FiChevronDown size={12} className="text-dark-500" />}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditingId(sub.id); setEditTitle(sub.title); }}
                    className="p-1 text-dark-500 hover:text-brand-400 transition-colors"
                  >
                    <FiEdit2 size={12} />
                  </button>
                  <button
                    onClick={() => deleteSubmodule(sub.id)}
                    disabled={actionLoading === sub.id}
                    className="p-1 text-dark-500 hover:text-red-400 transition-colors"
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedId === sub.id && sub.lessons.length > 0 && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-dark-800/50">
                    <div className="p-3 pl-12 space-y-1">
                      {sub.lessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center gap-2 text-xs text-dark-400 py-1">
                          <span className="text-dark-600">#{lesson.order}</span>
                          <span>{lesson.title}</span>
                          {lesson.isFree && <span className="badge-green text-[8px]">Gratis</span>}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
