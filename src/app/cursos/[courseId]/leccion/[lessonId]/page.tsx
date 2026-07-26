'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiCheck, FiArrowLeft, FiArrowRight, FiClock, FiFileText,
  FiDownload, FiBookOpen, FiClipboard,
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
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/lessons/${params.lessonId}`);
        if (res.ok) {
          const data = await res.json();
          setLesson(data.lesson);
          setAllLessons(data.allLessons);
          setCompleted(data.completed);
        }
      } catch {
        toast.error('Error al cargar la lección');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.lessonId]);

  async function toggleComplete() {
    if (!session) {
      router.push('/login');
      return;
    }

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

  return (
    <div className="py-8">
      <div className="section max-w-4xl">
        <Link
          href={`/cursos/${lesson.module.course.slug}`}
          className="inline-flex items-center gap-1 text-dark-400 hover:text-white text-sm mb-6 transition-colors group"
        >
          <FiArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Volver al curso
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
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
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {prevLesson ? (
            <Link
              href={`/cursos/${lesson.module.course.slug}/leccion/${prevLesson.id}`}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <FiArrowLeft size={16} />
              <span className="hidden sm:inline">{prevLesson.title}</span>
              <span className="sm:hidden">Anterior</span>
            </Link>
          ) : (
            <div />
          )}

          {nextLesson ? (
            <Link
              href={`/cursos/${lesson.module.course.slug}/leccion/${nextLesson.id}`}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <span className="hidden sm:inline">{nextLesson.title}</span>
              <span className="sm:hidden">Siguiente</span>
              <FiArrowRight size={16} />
            </Link>
          ) : (
            <Link
              href={`/cursos/${lesson.module.course.slug}`}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              Volver al Curso
              <FiArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
