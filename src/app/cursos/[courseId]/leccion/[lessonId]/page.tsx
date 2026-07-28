'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import {
  FiCheck, FiArrowLeft, FiArrowRight, FiFileText,
  FiDownload, FiBookOpen, FiClipboard, FiCode, FiTerminal,
  FiMessageSquare, FiLoader,
} from 'react-icons/fi';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { QuizComponent } from '@/components/QuizComponent';
import { CourseSidebar } from '@/components/CourseSidebar';
import { CodeExercise as CodeExerciseComponent } from '@/components/CodeExercise';
import { VirtualTerminal } from '@/components/VirtualTerminal';
import { LessonComments } from '@/components/LessonComments';
import type { CodeExercise as CodeExerciseType, TerminalCommand } from '@/types';

const CodeEditor = dynamic(
  () => import('@/components/CodeEditor').then((m) => m.CodeEditor),
  { ssr: false }
);

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
  terminalCommands: TerminalCommand[];
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
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [exercises, setExercises] = useState<CodeExerciseType[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/lessons/${params.lessonId}`);
        if (res.ok) {
          const data = await res.json();
          setLesson(data.lesson);
          setAllLessons(data.allLessons);
          setCompletedLessons(data.completedLessons || []);
          setCompleted((data.completedLessons || []).includes(data.lesson?.id));

          if (data.lesson?.module?.course?.id) {
            const courseRes = await fetch(`/api/courses/${data.lesson.module.course.id}/modules`);
            if (courseRes.ok) {
              const courseData = await courseRes.json();
              setCourseModules(courseData.modules || []);
            }
          }

          if (data.lesson?.id) {
            setExercisesLoading(true);
            try {
              const exRes = await fetch(`/api/exercises?lessonId=${data.lesson.id}`);
              if (exRes.ok) {
                const exData = await exRes.json();
                const parsed = (exData.exercises || []).map((ex: Record<string, unknown>) => ({
                  ...ex,
                  testCases: typeof ex.testCases === 'string'
                    ? JSON.parse(ex.testCases as string)
                    : ex.testCases || [],
                }));
                setExercises(parsed as CodeExerciseType[]);
              }
            } catch {
              // Exercises not available
            } finally {
              setExercisesLoading(false);
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

  const toggleComplete = useCallback(async () => {
    if (!session) { router.push('/login'); return; }
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson!.id, completed: !completed }),
      });
      if (res.ok) {
        setCompleted(!completed);
        setCompletedLessons((prev) =>
          completed ? prev.filter((id) => id !== lesson!.id) : [...prev, lesson!.id]
        );
        toast.success(completed ? 'Lección marcada como incompleta' : '¡Lección completada!');
      }
    } catch {
      toast.error('Error al actualizar progreso');
    }
  }, [session, completed, lesson, router]);

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

  async function handleDownloadPDF() {
    if (!lesson?.content) return;
    setPdfGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      let y = margin;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(30, 30, 30);
      const titleLines = doc.splitTextToSize(lesson.title, maxWidth);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 8 + 6;

      if (lesson.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        const descLines = doc.splitTextToSize(lesson.description, maxWidth);
        doc.text(descLines, margin, y);
        y += descLines.length * 5 + 8;
      }

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);

      const plainText = lesson.content
        .replace(/#{1,6}\s/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/```[\s\S]*?```/g, '[código]')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/^\s*[-*+]\s/gm, '• ');

      const paragraphs = plainText.split(/\n\n+/);
      for (const para of paragraphs) {
        const trimmed = para.trim();
        if (!trimmed) continue;

        if (y > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }

        const lines = doc.splitTextToSize(trimmed, maxWidth);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 4;
      }

      doc.save(`${lesson.title.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '').replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF descargado');
    } catch {
      toast.error('Error al generar PDF');
    } finally {
      setPdfGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="py-8 section">
        <div className="animate-pulse space-y-4">
          <div className="h-6 skeleton w-1/3" />
          <div className="h-10 skeleton w-2/3" />
          <div className="h-64 skeleton rounded-xl" />
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
  const hasTerminalCommands = lesson.terminalCommands && lesson.terminalCommands.length > 0;

  return (
    <div className="min-h-screen">
      <div className="flex">
        <CourseSidebar
          courseTitle={lesson.module.course.title}
          courseSlug={courseSlug}
          currentLessonId={lesson.id}
          modules={courseModules}
          completedLessons={completedLessons}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

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
              <div className="flex items-center gap-3 mt-4 flex-wrap">
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

                {lesson.content && (
                  <button
                    onClick={handleDownloadPDF}
                    disabled={pdfGenerating}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-dark-800/80 text-dark-300 border border-dark-700/50 hover:border-accent-500/50 hover:text-accent-400 transition-all duration-300 disabled:opacity-50"
                  >
                    {pdfGenerating ? <FiLoader size={16} className="animate-spin" /> : <FiDownload size={16} />}
                    Descargar PDF
                  </button>
                )}
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

            {/* Code Exercises */}
            {exercises.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4 text-accent-400">
                  <FiCode size={18} />
                  <h2 className="font-semibold text-lg">Ejercicios de Código</h2>
                </div>
                <div className="space-y-6">
                  {exercises.map((exercise) => (
                    <CodeExerciseComponent
                      key={exercise.id}
                      exercise={exercise}
                      onComplete={(exerciseId, passed) => {
                        toast.success(passed
                          ? `Ejercicio "${exercise.title}" completado`
                          : `Intento registrado para "${exercise.title}"`
                        );
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {exercisesLoading && (
              <div className="mb-6">
                <div className="card p-6 flex items-center gap-3">
                  <FiLoader size={16} className="animate-spin text-dark-500" />
                  <span className="text-dark-400 text-sm">Cargando ejercicios...</span>
                </div>
              </div>
            )}

            {/* Code Editor */}
            {exercises.length > 0 && (
              <div className="mb-6">
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4 text-emerald-400">
                    <FiCode size={18} />
                    <h2 className="font-semibold text-lg">Editor de Código</h2>
                  </div>
                  <p className="text-dark-400 text-sm mb-4">
                    Practica libremente con el editor de código. Selecciona el lenguaje y ejecuta tu código.
                  </p>
                  <CodeEditor height="350px" />
                </div>
              </div>
            )}

            {/* Virtual Terminal */}
            {hasTerminalCommands && (
              <div className="mb-6">
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4 text-emerald-400">
                    <FiTerminal size={18} />
                    <h2 className="font-semibold text-lg">Terminal Virtual</h2>
                  </div>
                  <p className="text-dark-400 text-sm mb-4">
                    Prueba los comandos de la lección en la terminal virtual. Escribe los comandos listados para ver sus resultados.
                  </p>
                  <VirtualTerminal commands={lesson.terminalCommands} />
                </div>
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

            {/* Comments */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4 text-brand-400">
                <FiMessageSquare size={18} />
              </div>
              <LessonComments lessonId={lesson.id} />
            </div>
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
