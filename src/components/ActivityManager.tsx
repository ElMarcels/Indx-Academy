'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiPlus, FiTrash2, FiEdit2, FiFileText, FiLink, FiList,
  FiCalendar, FiAward, FiLoader, FiBook, FiDatabase, FiGlobe,
} from 'react-icons/fi';

type ActivityType =
  | 'PAGE'
  | 'ASSIGNMENT'
  | 'FILE'
  | 'LINK'
  | 'CHOICE'
  | 'WORKSHOP'
  | 'WIKI'
  | 'DATABASE'
  | 'GLOSSARY';

interface Activity {
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  maxScore: number | null;
  dueDate: string | null;
  config: Record<string, unknown>;
  order: number;
  createdAt: string;
}

interface ActivityManagerProps {
  lessonId: string;
}

const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: 'PAGE', label: 'Página' },
  { value: 'ASSIGNMENT', label: 'Tarea' },
  { value: 'FILE', label: 'Archivo' },
  { value: 'LINK', label: 'Enlace' },
  { value: 'CHOICE', label: 'Elección múltiple' },
  { value: 'WORKSHOP', label: 'Taller' },
  { value: 'WIKI', label: 'Wiki' },
  { value: 'DATABASE', label: 'Base de datos' },
  { value: 'GLOSSARY', label: 'Glosario' },
];

const TYPE_ICONS: Record<ActivityType, typeof FiFileText> = {
  PAGE: FiFileText,
  ASSIGNMENT: FiAward,
  FILE: FiBook,
  LINK: FiLink,
  CHOICE: FiList,
  WORKSHOP: FiList,
  WIKI: FiBook,
  DATABASE: FiDatabase,
  GLOSSARY: FiGlobe,
};

const TYPE_COLORS: Record<ActivityType, string> = {
  PAGE: 'badge-blue',
  ASSIGNMENT: 'badge-green',
  FILE: 'badge-purple',
  LINK: 'badge-blue',
  CHOICE: 'badge-yellow',
  WORKSHOP: 'badge-green',
  WIKI: 'badge-purple',
  DATABASE: 'badge-blue',
  GLOSSARY: 'badge-yellow',
};

const EMPTY_FORM = {
  title: '',
  description: '',
  type: 'PAGE' as ActivityType,
  maxScore: '',
  dueDate: '',
  config: {} as Record<string, unknown>,
};

function TypeConfigFields({
  type,
  config,
  onChange,
}: {
  type: ActivityType;
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  function update(key: string, value: unknown) {
    onChange({ ...config, [key]: value });
  }

  switch (type) {
    case 'PAGE':
      return (
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1">Contenido (Markdown)</label>
          <textarea
            value={(config.content as string) || ''}
            onChange={(e) => update('content', e.target.value)}
            placeholder="# Título&#10;Escribe el contenido de la página aquí..."
            className="input min-h-[160px] font-mono text-sm resize-y"
          />
        </div>
      );

    case 'ASSIGNMENT':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Instrucciones</label>
            <textarea
              value={(config.instructions as string) || ''}
              onChange={(e) => update('instructions', e.target.value)}
              placeholder="Instrucciones para la tarea..."
              className="input min-h-[80px] text-sm resize-y"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-dark-300">
              <input
                type="checkbox"
                checked={!!config.allowLateSubmission}
                onChange={(e) => update('allowLateSubmission', e.target.checked)}
                className="rounded border-dark-600 bg-dark-800 text-brand-500 focus:ring-brand-500/50"
              />
              Permitir entrega tardía
            </label>
            <label className="flex items-center gap-2 text-sm text-dark-300">
              <input
                type="checkbox"
                checked={!!config.groupSubmission}
                onChange={(e) => update('groupSubmission', e.target.checked)}
                className="rounded border-dark-600 bg-dark-800 text-brand-500 focus:ring-brand-500/50"
              />
              Entrega en grupo
            </label>
          </div>
        </div>
      );

    case 'FILE':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">URL del archivo</label>
            <input
              value={(config.fileUrl as string) || ''}
              onChange={(e) => update('fileUrl', e.target.value)}
              placeholder="https://ejemplo.com/archivo.pdf"
              className="input text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Nombre del archivo</label>
            <input
              value={(config.fileName as string) || ''}
              onChange={(e) => update('fileName', e.target.value)}
              placeholder="documento.pdf"
              className="input text-sm"
            />
          </div>
        </div>
      );

    case 'LINK':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">URL del enlace</label>
            <input
              value={(config.url as string) || ''}
              onChange={(e) => update('url', e.target.value)}
              placeholder="https://ejemplo.com"
              className="input text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-dark-300">
              <input
                type="checkbox"
                checked={!!config.openInNewTab}
                onChange={(e) => update('openInNewTab', e.target.checked)}
                className="rounded border-dark-600 bg-dark-800 text-brand-500 focus:ring-brand-500/50"
              />
              Abrir en nueva pestaña
            </label>
          </div>
        </div>
      );

    case 'CHOICE': {
      const options = (config.options as string[]) || ['', ''];
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Opciones</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-dark-500 w-5">{i + 1}.</span>
                  <input
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[i] = e.target.value;
                      update('options', next);
                    }}
                    placeholder={`Opción ${i + 1}`}
                    className="input text-sm"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => update('options', options.filter((_, j) => j !== i))}
                      className="text-dark-500 hover:text-red-400 transition-colors p-1"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => update('options', [...options, ''])}
              className="btn-secondary text-xs py-1.5 px-3 mt-2 flex items-center gap-1"
            >
              <FiPlus size={12} /> Agregar opción
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-dark-300">
            <input
              type="checkbox"
              checked={!!config.multipleAnswers}
              onChange={(e) => update('multipleAnswers', e.target.checked)}
              className="rounded border-dark-600 bg-dark-800 text-brand-500 focus:ring-brand-500/50"
            />
            Permitir múltiples respuestas
          </label>
        </div>
      );
    }

    case 'WORKSHOP':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Criterios de evaluación</label>
            <textarea
              value={(config.evaluationCriteria as string) || ''}
              onChange={(e) => update('evaluationCriteria', e.target.value)}
              placeholder="Describe los criterios para evaluar los trabajos de pares..."
              className="input min-h-[80px] text-sm resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Revisión por par</label>
            <select
              value={(config.peerReviewMode as string) || 'SINGLE'}
              onChange={(e) => update('peerReviewMode', e.target.value)}
              className="input text-sm"
            >
              <option value="SINGLE">Una revisión por estudiante</option>
              <option value="MULTIPLE">Múltiples revisiones</option>
              <option value="RANDOM">Revisión aleatoria</option>
            </select>
          </div>
        </div>
      );

    case 'WIKI':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Página inicial</label>
            <textarea
              value={(config.initialPage as string) || ''}
              onChange={(e) => update('initialPage', e.target.value)}
              placeholder="Contenido de la primera página del wiki..."
              className="input min-h-[80px] text-sm resize-y"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-dark-300">
              <input
                type="checkbox"
                checked={config.locked !== true}
                onChange={(e) => update('locked', !e.target.checked)}
                className="rounded border-dark-600 bg-dark-800 text-brand-500 focus:ring-brand-500/50"
              />
              Editable por estudiantes
            </label>
          </div>
        </div>
      );

    case 'DATABASE': {
      const fields = (config.fields as { name: string; fieldType: string }[]) || [];
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Campos de la base de datos</label>
            <div className="space-y-2">
              {fields.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={f.name}
                    onChange={(e) => {
                      const next = [...fields];
                      next[i] = { ...next[i], name: e.target.value };
                      update('fields', next);
                    }}
                    placeholder="Nombre del campo"
                    className="input text-sm flex-1"
                  />
                  <select
                    value={f.fieldType}
                    onChange={(e) => {
                      const next = [...fields];
                      next[i] = { ...next[i], fieldType: e.target.value };
                      update('fields', next);
                    }}
                    className="input text-sm w-32"
                  >
                    <option value="TEXT">Texto</option>
                    <option value="NUMBER">Número</option>
                    <option value="DATE">Fecha</option>
                    <option value="URL">URL</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => update('fields', fields.filter((_, j) => j !== i))}
                    className="text-dark-500 hover:text-red-400 transition-colors p-1"
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => update('fields', [...fields, { name: '', fieldType: 'TEXT' }])}
              className="btn-secondary text-xs py-1.5 px-3 mt-2 flex items-center gap-1"
            >
              <FiPlus size={12} /> Agregar campo
            </button>
          </div>
        </div>
      );
    }

    case 'GLOSSARY': {
      const entries = (config.entries as { term: string; definition: string }[]) || [];
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Términos</label>
            <div className="space-y-2">
              {entries.map((e, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={e.term}
                    onChange={(ev) => {
                      const next = [...entries];
                      next[i] = { ...next[i], term: ev.target.value };
                      update('entries', next);
                    }}
                    placeholder="Término"
                    className="input text-sm flex-1"
                  />
                  <input
                    value={e.definition}
                    onChange={(ev) => {
                      const next = [...entries];
                      next[i] = { ...next[i], definition: ev.target.value };
                      update('entries', next);
                    }}
                    placeholder="Definición"
                    className="input text-sm flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => update('entries', entries.filter((_, j) => j !== i))}
                    className="text-dark-500 hover:text-red-400 transition-colors p-1"
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => update('entries', [...entries, { term: '', definition: '' }])}
              className="btn-secondary text-xs py-1.5 px-3 mt-2 flex items-center gap-1"
            >
              <FiPlus size={12} /> Agregar término
            </button>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

export function ActivityManager({ lessonId }: ActivityManagerProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<'order' | 'title' | 'type'>('order');
  const [sortAsc, setSortAsc] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}/activities`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch {
      toast.error('Error al cargar actividades');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(a: Activity) {
    setEditingId(a.id);
    setForm({
      title: a.title,
      description: a.description,
      type: a.type,
      maxScore: a.maxScore != null ? String(a.maxScore) : '',
      dueDate: a.dueDate ? a.dueDate.slice(0, 16) : '',
      config: a.config || {},
    });
    setFormOpen(true);
  }

  function handleSort(key: 'order' | 'title' | 'type') {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const sorted = [...activities].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'order') cmp = a.order - b.order;
    else if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
    else cmp = a.type.localeCompare(b.type);
    return sortAsc ? cmp : -cmp;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        maxScore: form.maxScore ? Number(form.maxScore) : null,
        dueDate: form.dueDate || null,
        config: form.config,
      };

      const res = await fetch(
        editingId
          ? `/api/lessons/${lessonId}/activities/${editingId}`
          : `/api/lessons/${lessonId}/activities`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (res.ok) {
        toast.success(editingId ? 'Actividad actualizada' : 'Actividad creada');
        setFormOpen(false);
        fetchActivities();
      } else {
        toast.error('Error al guardar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/activities/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Actividad eliminada');
        setActivities((prev) => prev.filter((a) => a.id !== id));
      } else {
        toast.error('Error al eliminar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <FiLoader size={24} className="text-brand-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Actividades</h3>
        <button onClick={openCreate} className="btn-primary text-sm py-2 flex items-center gap-2">
          <FiPlus size={14} />
          Nueva Actividad
        </button>
      </div>

      {activities.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-dark-500">
          <span>Ordenar:</span>
          {(['order', 'title', 'type'] as const).map((key) => (
            <button
              key={key}
              onClick={() => handleSort(key)}
              className={`px-2 py-1 rounded-lg transition-colors ${
                sortKey === key
                  ? 'bg-brand-600/15 text-brand-400'
                  : 'hover:text-dark-300'
              }`}
            >
              {key === 'order' ? 'Posición' : key === 'title' ? 'Título' : 'Tipo'}
              {sortKey === key && (sortAsc ? ' ▲' : ' ▼')}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sorted.map((activity) => {
            const Icon = TYPE_ICONS[activity.type] || FiFileText;
            return (
              <motion.div
                key={activity.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="card p-4 flex items-center gap-4 group"
              >
                <div className="w-9 h-9 rounded-xl bg-dark-800/80 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-dark-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs ${TYPE_COLORS[activity.type]}`}>
                      {ACTIVITY_TYPES.find((t) => t.value === activity.type)?.label || activity.type}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white truncate">{activity.title}</p>
                </div>

                <div className="hidden sm:flex items-center gap-4 text-xs text-dark-400 flex-shrink-0">
                  {activity.maxScore != null && (
                    <span className="flex items-center gap-1">
                      <FiAward size={12} />
                      {activity.maxScore} pts
                    </span>
                  )}
                  {activity.dueDate && (
                    <span className="flex items-center gap-1">
                      <FiCalendar size={12} />
                      {formatDate(activity.dueDate)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => openEdit(activity)}
                    className="p-1.5 rounded-lg text-dark-500 hover:text-brand-400 hover:bg-dark-800 transition-colors"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(activity.id)}
                    disabled={deletingId === activity.id}
                    className="p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-dark-800 transition-colors disabled:opacity-50"
                  >
                    {deletingId === activity.id ? (
                      <FiLoader size={14} className="animate-spin" />
                    ) : (
                      <FiTrash2 size={14} />
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {activities.length === 0 && (
          <div className="card p-12 text-center">
            <FiFileText size={32} className="mx-auto text-dark-600 mb-3" />
            <p className="text-dark-400 text-sm">No hay actividades en esta lección.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {formOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm"
              onClick={() => setFormOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setFormOpen(false)}
            >
              <form
                onSubmit={handleSubmit}
                className="card w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      {editingId ? 'Editar Actividad' : 'Nueva Actividad'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setFormOpen(false)}
                      className="text-dark-500 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Título *</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Nombre de la actividad"
                      className="input"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Descripción</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Descripción breve..."
                      className="input min-h-[60px] text-sm resize-y"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Tipo</label>
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          type: e.target.value as ActivityType,
                          config: {},
                        }))
                      }
                      className="input"
                    >
                      {ACTIVITY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Puntuación máxima</label>
                      <input
                        type="number"
                        min="0"
                        value={form.maxScore}
                        onChange={(e) => setForm((f) => ({ ...f, maxScore: e.target.value }))}
                        placeholder="100"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Fecha límite</label>
                      <input
                        type="datetime-local"
                        value={form.dueDate}
                        onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="border-t border-dark-800/50 pt-4">
                    <p className="text-xs text-dark-500 mb-3 uppercase tracking-wide font-medium">
                      Configuración del tipo
                    </p>
                    <TypeConfigFields
                      type={form.type}
                      config={form.config}
                      onChange={(c) => setForm((f) => ({ ...f, config: c }))}
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setFormOpen(false)}
                      className="btn-secondary text-sm py-2 px-4"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                    >
                      {saving && <FiLoader size={14} className="animate-spin" />}
                      {editingId ? 'Actualizar' : 'Crear'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
