'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiDownload,
  FiUpload,
  FiLayers,
  FiLoader,
  FiRotateCw,
} from 'react-icons/fi';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface Flashcard {
  id: string;
  term: string;
  definition: string;
  example: string | null;
  order: number;
}

interface CourseFlashcardsManagerProps {
  courseId: string;
}

const EMPTY_FORM = { term: '', definition: '', example: '', order: 0 };

export function CourseFlashcardsManager({ courseId }: CourseFlashcardsManagerProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Flashcard | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFlashcards();
  }, [courseId]);

  async function loadFlashcards() {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/flashcards`);
      if (res.ok) {
        const data = await res.json();
        setFlashcards(data.flashcards || data || []);
      }
    } catch {
      toast.error('Error al cargar flashcards');
    }
    setLoading(false);
  }

  function openNewForm() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, order: flashcards.length });
    setShowForm(true);
  }

  function openEditForm(card: Flashcard) {
    setEditingId(card.id);
    setForm({
      term: card.term,
      definition: card.definition,
      example: card.example || '',
      order: card.order,
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit() {
    if (!form.term.trim()) {
      toast.error('El término es obligatorio');
      return;
    }
    if (!form.definition.trim()) {
      toast.error('La definición es obligatoria');
      return;
    }

    setSaving(true);
    try {
      const isEditing = !!editingId;
      const res = await fetch(
        isEditing
          ? `/api/courses/${courseId}/flashcards/${editingId}`
          : `/api/courses/${courseId}/flashcards`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            term: form.term.trim(),
            definition: form.definition.trim(),
            example: form.example.trim() || null,
            order: form.order,
          }),
        }
      );

      if (res.ok) {
        toast.success(isEditing ? 'Flashcard actualizada' : 'Flashcard creada');
        cancelForm();
        loadFlashcards();
      } else {
        toast.error('Error al guardar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/courses/${courseId}/flashcards/${deleteTarget.id}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        toast.success('Flashcard eliminada');
        setFlashcards((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        toast.error('Error al eliminar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setDeleting(false);
    }
  }

  function exportFlashcards() {
    const data = flashcards.map(({ term, definition, example, order }) => ({
      term,
      definition,
      example,
      order,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcards-${courseId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Flashcards exportadas');
  }

  async function importFlashcards(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        toast.error('Formato inválido: se esperaba un array');
        return;
      }

      let imported = 0;
      for (const item of data) {
        if (!item.term || !item.definition) continue;
        const res = await fetch(`/api/courses/${courseId}/flashcards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            term: item.term,
            definition: item.definition,
            example: item.example || null,
            order: item.order ?? imported,
          }),
        });
        if (res.ok) imported++;
      }

      toast.success(`${imported} flashcard(s) importada(s)`);
      loadFlashcards();
    } catch {
      toast.error('Error al leer el archivo');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <FiLoader size={24} className="text-brand-400 animate-spin mx-auto mb-3" />
        <p className="text-dark-400 text-sm">Cargando flashcards...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <FiLayers size={20} className="text-brand-400" />
          <h3 className="text-white font-semibold">Flashcards del Curso</h3>
          <span className="badge-blue text-[10px]">{flashcards.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
            title={view === 'grid' ? 'Vista lista' : 'Vista cuadrícula'}
          >
            <FiRotateCw size={12} />
            {view === 'grid' ? 'Lista' : 'Cuadrícula'}
          </button>
          <button onClick={exportFlashcards} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1" title="Exportar JSON">
            <FiDownload size={12} /> Exportar
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={importFlashcards}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
            title="Importar JSON"
          >
            <FiUpload size={12} /> Importar
          </button>
          <button onClick={openNewForm} className="btn-primary text-sm py-2 flex items-center gap-2">
            <FiPlus size={14} /> Nueva Flashcard
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card p-5 space-y-3">
              <h4 className="text-white font-semibold text-sm">
                {editingId ? 'Editar Flashcard' : 'Nueva Flashcard'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={form.term}
                  onChange={(e) => setForm((p) => ({ ...p, term: e.target.value }))}
                  placeholder="Término *"
                  className="input text-sm"
                />
                <input
                  value={form.order}
                  onChange={(e) => setForm((p) => ({ ...p, order: parseInt(e.target.value) || 0 }))}
                  placeholder="Orden"
                  type="number"
                  className="input text-sm"
                />
              </div>
              <textarea
                value={form.definition}
                onChange={(e) => setForm((p) => ({ ...p, definition: e.target.value }))}
                placeholder="Definición *"
                rows={2}
                className="input text-sm resize-none"
              />
              <input
                value={form.example}
                onChange={(e) => setForm((p) => ({ ...p, example: e.target.value }))}
                placeholder="Ejemplo (opcional)"
                className="input text-sm"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={cancelForm} className="btn-secondary text-sm py-1.5 px-4">
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="btn-primary text-sm py-1.5 px-4 flex items-center gap-2"
                >
                  {saving ? <FiLoader size={14} className="animate-spin" /> : null}
                  {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {flashcards.length === 0 && !showForm ? (
        <div className="card p-8 text-center">
          <FiLayers size={32} className="text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400 text-sm mb-4">No hay flashcards en este curso.</p>
          <button onClick={openNewForm} className="btn-primary text-sm flex items-center gap-2 mx-auto">
            <FiPlus size={14} /> Crear primera flashcard
          </button>
        </div>
      ) : (
        <div
          className={
            view === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
              : 'space-y-2'
          }
        >
          {flashcards.map((card) => (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group"
            >
              {view === 'grid' ? (
                <div
                  className="card p-4 h-full flex flex-col cursor-pointer"
                  onClick={() => setPreviewId(previewId === card.id ? null : card.id)}
                >
                  <div className="flex-1 min-h-[120px] perspective-1000">
                    <motion.div
                      animate={{ rotateY: previewId === card.id ? 180 : 0 }}
                      transition={{ duration: 0.5 }}
                      className="relative w-full h-full"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center text-center p-3"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <p className="text-white font-semibold text-sm mb-1">{card.term}</p>
                        <p className="text-dark-500 text-[10px]">Toca para previsualizar</p>
                      </div>
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center text-center p-3"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      >
                        <p className="text-dark-200 text-xs leading-relaxed mb-2">{card.definition}</p>
                        {card.example && (
                          <p className="text-dark-500 text-[10px] italic">&ldquo;{card.example}&rdquo;</p>
                        )}
                      </div>
                    </motion.div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-dark-700/30">
                    <span className="text-[10px] text-dark-500">#{card.order}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditForm(card);
                        }}
                        className="text-dark-500 hover:text-brand-400 transition-colors p-1"
                      >
                        <FiEdit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(card);
                        }}
                        className="text-dark-500 hover:text-red-400 transition-colors p-1"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card p-3 flex items-center gap-4">
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setPreviewId(previewId === card.id ? null : card.id)}
                  >
                    {previewId === card.id ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <p className="text-dark-200 text-xs leading-relaxed">{card.definition}</p>
                        {card.example && (
                          <p className="text-dark-500 text-[10px] italic mt-1">&ldquo;{card.example}&rdquo;</p>
                        )}
                      </motion.div>
                    ) : (
                      <p className="text-white font-semibold text-sm truncate">{card.term}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-dark-500 flex-shrink-0">#{card.order}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditForm(card)}
                      className="text-dark-500 hover:text-brand-400 transition-colors p-1"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(card)}
                      className="text-dark-500 hover:text-red-400 transition-colors p-1"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Eliminar Flashcard"
        message={`¿Eliminar "${deleteTarget?.term}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
