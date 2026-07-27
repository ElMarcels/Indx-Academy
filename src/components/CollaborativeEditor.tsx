'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { FiSave, FiUsers, FiPlus, FiTrash2, FiCode } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import type { CollaborativeProject } from '@/types';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
];

interface CollaborativeEditorProps {
  groupId?: string;
}

export function CollaborativeEditor({ groupId }: CollaborativeEditorProps) {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<CollaborativeProject[]>([]);
  const [activeProject, setActiveProject] = useState<CollaborativeProject | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProjects(); }, [groupId]);

  async function loadProjects() {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch { /* silent */ }
    setLoading(false);
  }

  async function createProject() {
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDesc, language, groupId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Proyecto creado');
        setProjects((prev) => [data.project, ...prev]);
        setActiveProject(data.project);
        setCode(data.project.code || '');
        setShowCreate(false);
        setNewName('');
        setNewDesc('');
      }
    } catch {
      toast.error('Error al crear');
    }
  }

  async function saveCode() {
    if (!activeProject) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${activeProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        toast.success('Guardado');
      }
    } catch {
      toast.error('Error al guardar');
    }
    setSaving(false);
  }

  async function deleteProject(id: string) {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (activeProject?.id === id) setActiveProject(null);
        toast.success('Eliminado');
      }
    } catch {
      toast.error('Error al eliminar');
    }
  }

  function selectProject(project: CollaborativeProject) {
    setActiveProject(project);
    setCode(project.code || '');
    setLanguage(project.language || 'javascript');
  }

  if (loading) {
    return <div className="card p-6 text-center text-dark-400">Cargando proyectos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FiCode size={18} className="text-brand-400" />
          Proyectos colaborativos
        </h3>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm flex items-center gap-1">
          <FiPlus size={14} /> Nuevo proyecto
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="card p-4 space-y-3">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre del proyecto" className="input w-full" />
              <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Descripción (opcional)" className="input w-full" />
              <div className="flex gap-2">
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input flex-1">
                  {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <button onClick={createProject} className="btn-primary text-sm">Crear</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {projects.length === 0 ? (
        <div className="card p-6 text-center text-dark-400">
          <FiCode size={24} className="mx-auto mb-2 text-dark-600" />
          <p className="text-sm">Crea un proyecto para empezar a codear en equipo.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => selectProject(p)}
              className={`card p-3 cursor-pointer transition-all hover:scale-[1.02] ${
                activeProject?.id === p.id ? 'ring-2 ring-brand-400' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-white font-medium truncate">{p.name}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} className="text-dark-500 hover:text-red-400">
                  <FiTrash2 size={12} />
                </button>
              </div>
              {p.description && <p className="text-xs text-dark-500 truncate mt-1">{p.description}</p>}
              <div className="flex items-center gap-2 mt-2 text-[10px] text-dark-600">
                <span className="badge-brand">{p.language}</span>
                {p.members && <span className="flex items-center gap-1"><FiUsers size={10} /> {p.members.length}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeProject && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-medium">{activeProject.name}</h4>
            <div className="flex items-center gap-2">
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input text-xs py-1 px-2">
                {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <button onClick={saveCode} disabled={saving} className="btn-primary text-xs flex items-center gap-1">
                {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSave size={12} />}
                Guardar
              </button>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden border border-dark-700" style={{ height: 400 }}>
            <MonacoEditor
              height="100%"
              language={language}
              value={code}
              onChange={(v) => setCode(v || '')}
              theme="vs-dark"
              options={{ fontSize: 14, minimap: { enabled: false }, wordWrap: 'on', padding: { top: 12 } }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
