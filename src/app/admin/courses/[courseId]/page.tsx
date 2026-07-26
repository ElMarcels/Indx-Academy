'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiPlus, FiTrash2, FiFileText, FiEdit2, FiSave, FiPaperclip, FiX,
  FiAward, FiCode, FiUpload,
} from 'react-icons/fi';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { AdminQuizEditor } from '@/components/AdminQuizEditor';
import { AdminChallengeEditor } from '@/components/AdminChallengeEditor';
import { AdminLessonFiles } from '@/components/AdminLessonFiles';

interface LessonFile {
  id: string;
  name: string;
  url: string;
  size: number | null;
  type: string | null;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
  quiz?: { id: string; title: string; description: string | null; questions: any[] } | null;
}

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  task: string | null;
  isFree: boolean;
  order: number;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  isPublished: boolean;
  level: string;
  category: string | null;
  duration: string | null;
  thumbnail: string | null;
  modules: Module[];
}

export default function EditCoursePage() {
  const params = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');

  const [showLessonForm, setShowLessonForm] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    content: '',
    task: '',
    isFree: false,
  });

  const [activeTab, setActiveTab] = useState<'modules' | 'challenges'>('modules');
  const [showQuizEditor, setShowQuizEditor] = useState<string | null>(null);
  const [showChallengeForm, setShowChallengeForm] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    level: 'BEGINNER',
    category: '',
    duration: '',
    thumbnail: '',
  });

  const [lessonFiles, setLessonFiles] = useState<Record<string, LessonFile[]>>({});
  const [showFilesFor, setShowFilesFor] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/courses/${params.courseId}`);
        if (res.ok) {
          const data = await res.json();
          setCourse(data);
          setCourseForm({
            title: data.title,
            description: data.description,
            level: data.level,
            category: data.category || '',
            duration: data.duration || '',
            thumbnail: data.thumbnail || '',
          });

          // Load files for all lessons
          const allLessonIds = data.modules.flatMap((m: Module) => m.lessons.map((l: Lesson) => l.id));
          for (const lessonId of allLessonIds) {
            try {
              const fileRes = await fetch(`/api/lessons/${lessonId}`);
              if (fileRes.ok) {
                const fileData = await fileRes.json();
                if (fileData.lesson?.files) {
                  setLessonFiles((prev) => ({ ...prev, [lessonId]: fileData.lesson.files }));
                }
              }
            } catch { /* silent */ }
          }
        }
      } catch {
        toast.error('Error al cargar curso');
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') load();
  }, [params.courseId, status]);

  async function addModule() {
    if (!moduleTitle.trim()) return;

    try {
      const res = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: moduleTitle,
          courseId: course!.id,
          order: course!.modules.length + 1,
        }),
      });

      if (res.ok) {
        const mod = await res.json();
        setCourse({
          ...course!,
          modules: [...course!.modules, { ...mod, lessons: [] }],
        });
        setModuleTitle('');
        setShowModuleForm(false);
        toast.success('Módulo creado');
      }
    } catch {
      toast.error('Error al crear módulo');
    }
  }

  async function addLesson(moduleId: string) {
    if (!lessonForm.title.trim()) return;

    try {
      const mod = course!.modules.find((m) => m.id === moduleId);
      const res = await fetch(`/api/courses/${course!.id}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lessonForm,
          moduleId,
          order: (mod?.lessons.length || 0) + 1,
        }),
      });

      if (res.ok) {
        const lesson = await res.json();
        setCourse({
          ...course!,
          modules: course!.modules.map((m) =>
            m.id === moduleId ? { ...m, lessons: [...m.lessons, lesson] } : m
          ),
        });
        setLessonForm({ title: '', description: '', content: '', task: '', isFree: false });
        setShowLessonForm(null);
        toast.success('Lección creada');
      }
    } catch {
      toast.error('Error al crear lección');
    }
  }

  async function deleteLesson(lessonId: string, moduleId: string) {
    if (!confirm('¿Eliminar esta lección?')) return;

    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}`, { method: 'DELETE' });
      if (res.ok) {
        setCourse({
          ...course!,
          modules: course!.modules.map((m) =>
            m.id === moduleId
              ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
              : m
          ),
        });
        toast.success('Lección eliminada');
      }
    } catch {
      toast.error('Error al eliminar');
    }
  }

  async function saveCourse() {
    setSaving(true);
    try {
      const res = await fetch(`/api/courses/${course!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...courseForm,
          duration: courseForm.duration || null,
          thumbnail: courseForm.thumbnail || null,
          category: courseForm.category || null,
        }),
      });

      if (res.ok) {
        setCourse({ ...course!, ...courseForm });
        setEditMode(false);
        toast.success('Curso actualizado');
      }
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-12 section">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-800 rounded w-1/4" />
          <div className="h-48 bg-dark-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-20 section text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Curso no encontrado</h2>
        <Link href="/admin/courses" className="btn-primary">Volver</Link>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="section max-w-4xl">
        <Link href="/admin/courses" className="inline-flex items-center gap-1 text-dark-400 hover:text-white text-sm mb-6 transition-colors">
          <FiArrowLeft size={14} /> Volver a cursos
        </Link>

        <div className="card p-6 mb-6">
          {editMode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-white">Editar Curso</h2>
                <div className="flex gap-2">
                  <button onClick={saveCourse} disabled={saving} className="btn-primary text-sm py-1.5 flex items-center gap-1">
                    <FiSave size={14} /> {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button onClick={() => setEditMode(false)} className="btn-secondary text-sm py-1.5">Cancelar</button>
                </div>
              </div>
              <input
                type="text"
                value={courseForm.title}
                onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                className="input"
                placeholder="Título"
              />
              <textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                className="input min-h-[80px] resize-y"
                placeholder="Descripción"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={courseForm.level}
                  onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                  className="input"
                >
                  <option value="BEGINNER">Principiante</option>
                  <option value="INTERMEDIATE">Intermedio</option>
                  <option value="ADVANCED">Avanzado</option>
                </select>
                <input
                  type="text"
                  value={courseForm.duration}
                  onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                  className="input"
                  placeholder="Duración (ej: 40h)"
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-2xl font-bold text-white">{course.title}</h1>
                  <p className="text-dark-400 text-sm mt-1">{course.description}</p>
                </div>
                <button onClick={() => setEditMode(true)} className="btn-secondary text-sm py-1.5 flex items-center gap-1 flex-shrink-0">
                  <FiEdit2 size={14} /> Editar
                </button>
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-dark-500">
                <span className="capitalize">{course.level.toLowerCase()}</span>
                {course.category && <span>{course.category}</span>}
                <span>{course.modules.length} módulos</span>
                <span className="badge-free text-[10px]">100% Gratis</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'modules'
                ? 'bg-brand-600 text-white'
                : 'text-dark-400 hover:text-white bg-dark-800/50'
            }`}
          >
            Módulos y Lecciones
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'challenges'
                ? 'bg-brand-600 text-white'
                : 'text-dark-400 hover:text-white bg-dark-800/50'
            }`}
          >
            Desafíos
          </button>
        </div>

        {activeTab === 'modules' && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Módulos y Lecciones</h2>
            <button
              onClick={() => setShowModuleForm(!showModuleForm)}
              className="btn-primary text-sm flex items-center gap-1"
            >
              <FiPlus size={14} /> Nuevo Módulo
            </button>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Desafíos del Curso</h2>
            <button
              onClick={() => setShowChallengeForm(!showChallengeForm)}
              className="btn-primary text-sm flex items-center gap-1"
            >
              <FiPlus size={14} /> Nuevo Desafío
            </button>
          </div>
        )}

        {activeTab === 'modules' && showModuleForm && (
          <div className="card p-4 mb-4 flex gap-3">
            <input
              type="text"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              placeholder="Nombre del módulo"
              className="input flex-1"
              onKeyDown={(e) => e.key === 'Enter' && addModule()}
            />
            <button onClick={addModule} className="btn-primary text-sm">Crear</button>
            <button onClick={() => setShowModuleForm(false)} className="btn-secondary text-sm">Cancelar</button>
          </div>
        )}

        {activeTab === 'modules' && (
        <div className="space-y-4">
          {course.modules.map((mod) => (
            <div key={mod.id} className="card overflow-hidden">
              <div className="p-4 border-b border-dark-800/50 bg-dark-800/30">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">
                    <span className="text-dark-500 mr-2">#{mod.order}</span>
                    {mod.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowQuizEditor(showQuizEditor === mod.id ? null : mod.id)}
                      className="btn-secondary text-xs py-1 px-3 flex items-center gap-1"
                    >
                      <FiAward size={12} /> Quiz
                    </button>
                    <button
                      onClick={() => setShowLessonForm(showLessonForm === mod.id ? null : mod.id)}
                      className="btn-outline text-xs py-1 px-3 flex items-center gap-1"
                    >
                      <FiPlus size={12} /> Lección
                    </button>
                  </div>
                </div>
              </div>

              {showLessonForm === mod.id && (
                <div className="p-4 border-b border-dark-800/50 bg-dark-900/50">
                  <div className="space-y-3 mb-3">
                    <input
                      type="text"
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                      placeholder="Título de la lección"
                      className="input"
                    />
                    <input
                      type="text"
                      value={lessonForm.description}
                      onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                      placeholder="Descripción corta (opcional)"
                      className="input"
                    />
                    <MarkdownEditor
                      value={lessonForm.content}
                      onChange={(val) => setLessonForm({ ...lessonForm, content: val })}
                      placeholder="Contenido de la lección en Markdown..."
                      label="Contenido"
                    />
                    <MarkdownEditor
                      value={lessonForm.task}
                      onChange={(val) => setLessonForm({ ...lessonForm, task: val })}
                      placeholder="Tarea o ejercicio para el estudiante..."
                      label="Tarea"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-dark-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lessonForm.isFree}
                        onChange={(e) => setLessonForm({ ...lessonForm, isFree: e.target.checked })}
                        className="rounded border-dark-600"
                      />
                      Lección gratuita
                    </label>
                    <button onClick={() => addLesson(mod.id)} className="btn-primary text-sm">Crear Lección</button>
                    <button onClick={() => setShowLessonForm(null)} className="btn-secondary text-sm">Cancelar</button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-dark-800/50">
                {mod.lessons.map((lesson) => (
                  <div key={lesson.id}>
                    <div className="px-4 py-3 flex items-center gap-3">
                      <FiFileText size={14} className="text-dark-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-dark-200 block truncate">{lesson.title}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {lesson.isFree && <span className="badge-green text-[10px]">Gratis</span>}
                        <button
                          onClick={() => setShowFilesFor(showFilesFor === lesson.id ? null : lesson.id)}
                          className="text-dark-500 hover:text-emerald-400 transition-colors"
                          title="Archivos"
                        >
                          <FiUpload size={14} />
                          {(lessonFiles[lesson.id]?.length || 0) > 0 && (
                            <span className="ml-0.5 text-[10px]">{lessonFiles[lesson.id].length}</span>
                          )}
                        </button>
                        <button
                          onClick={() => deleteLesson(lesson.id, mod.id)}
                          className="text-dark-500 hover:text-red-400 transition-colors"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {showFilesFor === lesson.id && (
                      <div className="px-4 pb-3">
                        <AdminLessonFiles
                          lessonId={lesson.id}
                          files={lessonFiles[lesson.id] || []}
                          onFilesChange={(newFiles) => setLessonFiles((prev) => ({ ...prev, [lesson.id]: newFiles }))}
                        />
                      </div>
                    )}
                  </div>
                ))}
                {mod.lessons.length === 0 && (
                  <div className="px-4 py-6 text-center text-dark-600 text-sm">
                    No hay lecciones. Añade la primera.
                  </div>
                )}
              </div>

              {showQuizEditor === mod.id && (
                <div className="p-4 border-t border-dark-800/50">
                  <AdminQuizEditor
                    moduleId={mod.id}
                    existingQuiz={mod.quiz || undefined}
                    onUpdate={() => {
                      toast.success('Quiz actualizado');
                      window.location.reload();
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-4">
            {showChallengeForm && (
              <AdminChallengeEditor
                courseId={course.id}
                onUpdate={() => {
                  setShowChallengeForm(false);
                  window.location.reload();
                }}
              />
            )}
            <div className="card p-8 text-center">
              <FiCode size={32} className="text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">Los desafíos se gestionan desde la vista del curso.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
