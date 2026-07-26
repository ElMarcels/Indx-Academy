'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiCheck, FiArrowLeft, FiArrowRight, FiClock, FiFileText,
  FiDownload, FiBookOpen, FiClipboard, FiChevronDown, FiChevronRight, FiMenu, FiX,
} from 'react-icons/fi';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { QuizComponent } from '@/components/QuizComponent';

interface LessonFile {
  id: string;
  name: string;
  url: string;
  size: number | null;
  type: string | null;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  task: string | null;
  isFree: boolean;
  module: {
    id: string;
    title: string;
    course: { id: string; title: string; slug: string };
    quizzes: { id: string; title: string }[];
  };
  files: LessonFile[];
}

interface CourseModule {
  id: string;
  title: string;
  order: number;
  lessons: { id: string; title: string; isFree: boolean; order: number }[];
  quizzes: { id: string; title: string }[];
}

interface AllLesson {
  id: string;
  title: string;
  isFree: boolean;
  module: { order: number; course: { slug: string } };
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<AllLesson[]>([]);
  const [courseModules, setCourseModules] = useState<CourseModule[]>([]);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/lessons/${params.lessonId}`);
        if (res.ok) {
          const data = await res.json();
          setLesson(data.lesson);
          setAllLessons(data.allLessons);
          setCompleted(data.completed);

          if (data.lesson?.module?.course?.id) {
            const courseRes = await fetch(`/api/courses/${data.lesson.module.course.id}/modules`);
            if (courseRes.ok) {
              const courseData = await courseRes.json();
              setCourseModules(courseData.modules || []);
              const currentModuleId = data.lesson.module.id;
              setExpandedModules(new Set([currentModuleId]));
            }
          }
        }
      } catch {
        toast.error('Error al cargar la lección');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.lessonId]);

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  async function toggleComplete() {
    if (!session) { router.push('/login'); return; }
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson!.id, completed: !completed }),
      });
      if (res.ok) {
        setCompleted(!completed);
        toast.success(completed ? 'Lección marcada como incompleta' : '¡Lección completada!');
      }
    } catch {
      toast.error('Error al actualizar progreso');
    }
  }

  function getAdjacentLesson(direction: 'prev' | 'next') {
    const currentIndex = allLessons.findIndex((l) => l.id === lesson?.id);
    if (currentIndex === -1) return null;
    if (direction === 'prev' && currentIndex > 0) return allLessons[currentIndex - 1];
    if (direction === 'next' && currentIndex < allLessons.length - 1) return allLessons[currentIndex + 1];
    return null;
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  if (loading) {
    return (
      <div className="py-8 section">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-dark-800 rounded w-1/3" />
          <div className="h-10 bg-dark-800 rounded w-2/3" />
          <div className="h-64 bg-dark-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="py-20 section text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Lección no encontrada</h2>
        <Link href="/cursos" className="btn-primary">Ver cursos</Link>
      </div>
    );
  }

  const prevLesson = getAdjacentLesson('prev');
  const nextLesson = getAdjacentLesson('next');
  const courseSlug = lesson.module.course.slug;

  return (
    <div className="min-h-screen">
      <div className="flex">
        {/* Course Sidebar */}
        <aside className={`hidden lg:block ${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden flex-shrink-0`}>
          <div className="w-72 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto border-r border-dark-800/50 bg-dark-950/80 p-4">
            <Link href={`/cursos/${courseSlug}`} className="inline-flex items-center gap-1 text-dark-400 hover:text-white text-sm mb-4 transition-colors">
              <FiArrowLeft size={14} /> Volver al curso
            </Link>
            <h3 className="text-white font-semibold text-sm mb-4">{lesson.module.course.title}</h3>
            <div className="space-y-1">
              {courseModules.map((mod) => {
                const isExpanded = expandedModules.has(mod.id);
                const isCurrentModule = mod.id === lesson.module.id;
                return (
                  <div key={mod.id}>
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${
                        isCurrentModule ? 'bg-brand-600/15 text-brand-400' : 'text-dark-300 hover:bg-dark-800/50 hover:text-white'
                      }`}
                    >
                      {isExpanded ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
                      <span className="truncate font-medium">{mod.title}</span>
                    </button>
                    {isExpanded && (
                      <div className="ml-4 space-y-0.5">
                        {mod.lessons.map((l) => {
                          const isCurrent = l.id === lesson.id;
                          return (
                            <Link
                              key={l.id}
                              href={`/cursos/${courseSlug}/leccion/${l.id}`}
                              className={`flex items-center gap-2 p-1.5 rounded-lg text-xs transition-colors ${
                                isCurrent
                                  ? 'bg-brand-600/15 text-brand-400 font-semibold'
                                  : 'text-dark-400 hover:text-white hover:bg-dark-800/30'
                              }`}
                            >
                              {isCurrent && <div className="w-1.5 h-1.5 bg-brand-400 rounded-full flex-shrink-0" />}
                              {!isCurrent && <FiFileText size={10} className="flex-shrink-0" />}
                              <span className="truncate">{l.title}</span>
                            </Link>
                          );
                        })}
                        {mod.quizzes.map((q) => (
                          <div key={q.id} className="flex items-center gap-2 p-1.5 rounded-lg text-xs text-dark-500">
                            <FiClipboard size={10} className="flex-shrink-0" />
                            <span className="truncate">{q.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-4 left-4 z-50 w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center shadow-lg shadow-brand-600/30"
        >
          {sidebarOpen ? <FiX size={20} className="text-white" /> : <FiMenu size={20} className="text-white" />}
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            {/* Lesson Header */}
            <div className="mb-8">
              <div className="text-sm text-brand-400 mb-2 flex items-center gap-1.5">
                <FiBookOpen size={14} />
                {lesson.module.title}
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">{lesson.title}</h1>
              {lesson.description && (
                <p className="text-dark-400 text-lg">{lesson.description}</p>
              )}
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={toggleComplete}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    completed
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25'
                      : 'bg-dark-800/80 text-dark-300 border border-dark-700/50 hover:border-brand-500/50 hover:text-brand-400'
                  }`}
                >
                  <FiCheck size={16} />
                  {completed ? 'Completada' : 'Marcar como completada'}
                </button>
              </div>
            </div>

            {/* Lesson Content */}
            {lesson.content && (
              <div className="card p-8 mb-6">
                <div className="flex items-center gap-2 mb-4 text-brand-400">
                  <FiFileText size={18} />
                  <h2 className="font-semibold text-lg">Contenido de la Lección</h2>
                </div>
                <MarkdownRenderer content={lesson.content} />
              </div>
            )}

            {/* Task */}
            {lesson.task && (
              <div className="card p-8 mb-6 border-accent-500/20 bg-accent-500/5">
                <div className="flex items-center gap-2 mb-4 text-accent-400">
                  <FiClipboard size={18} />
                  <h2 className="font-semibold text-lg">Tarea</h2>
                </div>
                <MarkdownRenderer content={lesson.task} />
              </div>
            )}

            {/* Module Quiz */}
            {lesson.module.quizzes && lesson.module.quizzes.length > 0 && (
              <div className="mb-6 space-y-6">
                {lesson.module.quizzes.map((quiz) => (
                  <QuizComponent key={quiz.id} quizId={quiz.id} />
                ))}
              </div>
            )}

            {/* Attached Files */}
            {lesson.files && lesson.files.length > 0 && (
              <div className="card p-8 mb-6">
                <div className="flex items-center gap-2 mb-4 text-emerald-400">
                  <FiDownload size={18} />
                  <h2 className="font-semibold text-lg">Archivos Adjuntos</h2>
                </div>
                <div className="space-y-3">
                  {lesson.files.map((file) => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-dark-800/50 rounded-xl border border-dark-700/30 hover:border-emerald-500/30 hover:bg-dark-800 transition-all duration-300 group"
                    >
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FiDownload size={16} className="text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-dark-200 block truncate group-hover:text-emerald-400 transition-colors">{file.name}</span>
                        {file.size && (
                          <span className="text-xs text-dark-500">{formatFileSize(file.size)}</span>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <div className="flex items-center justify-between">
              {prevLesson ? (
                <Link
                  href={`/cursos/${courseSlug}/leccion/${prevLesson.id}`}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <FiArrowLeft size={16} />
                  <span className="hidden sm:inline">{prevLesson.title}</span>
                  <span className="sm:hidden">Anterior</span>
                </Link>
              ) : <div />}

              {nextLesson ? (
                <Link
                  href={`/cursos/${courseSlug}/leccion/${nextLesson.id}`}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <span className="hidden sm:inline">{nextLesson.title}</span>
                  <span className="sm:hidden">Siguiente</span>
                  <FiArrowRight size={16} />
                </Link>
              ) : (
                <Link href={`/cursos/${courseSlug}`} className="btn-primary flex items-center gap-2 text-sm">
                  Volver al Curso <FiArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
