'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiCheck, FiClock, FiLock, FiBookOpen, FiUsers,
  FiBarChart2, FiArrowLeft, FiArrowRight, FiFileText, FiStar,
} from 'react-icons/fi';
import { ProgressBar } from '@/components/ProgressBar';
import { CourseProgress } from '@/components/CourseProgress';
import { SurveyForm } from '@/components/SurveyForm';
import { CourseFlashcardViewer } from '@/components/CourseFlashcardViewer';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  level: string;
  duration: string | null;
  category: string | null;
  author: { name: string | null; email: string };
  modules: {
    id: string;
    title: string;
    order: number;
    lessons: {
      id: string;
      title: string;
      description: string | null;
      duration: number | null;
      order: number;
      isFree: boolean;
    }[];
  }[];
  _count: { enrollments: number };
}

const levelLabels: Record<string, string> = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
};

export default function CursoPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState<{ lessonId: string; completed: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/courses/${params.courseId}`);
        if (res.ok) {
          const data = await res.json();
          setCourse(data);
          if (data.modules?.length > 0) {
            setExpandedModules(new Set([data.modules[0].id]));
          }
        }
      } catch {
        toast.error('Error al cargar el curso');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.courseId]);

  useEffect(() => {
    if (course && session) {
      fetch(`/api/enroll/check?courseId=${course.id}`)
        .then((r) => r.json())
        .then((data) => setEnrolled(data.enrolled));

      fetch(`/api/progress?courseId=${course.id}`)
        .then((r) => r.json())
        .then((data) => setProgress(data));
    }
  }, [course, session]);

  async function handleEnroll() {
    if (!session) {
      router.push('/login');
      return;
    }

    setEnrolling(true);
    try {
      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course!.id }),
      });

      if (res.ok) {
        setEnrolled(true);
        toast.success('¡Inscrito correctamente!');
      }
    } catch {
      toast.error('Error al inscribirse');
    } finally {
      setEnrolling(false);
    }
  }

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="py-12 section">
        <div className="animate-pulse space-y-4">
          <div className="h-8 skeleton w-1/3" />
          <div className="h-4 skeleton w-2/3" />
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="md:col-span-2 h-96 skeleton rounded-2xl" />
            <div className="h-96 skeleton rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-20 section text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Curso no encontrado</h2>
        <Link href="/cursos" className="btn-primary">Ver cursos</Link>
      </div>
    );
  }

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const completedCount = progress.filter((p) => p.completed).length;
  const totalLessons = allLessons.length;
  const completedLessons = progress.filter((p) => p.completed).map((p) => p.lessonId);

  return (
    <div className="py-8">
      <div className="section">
        <Link href="/cursos" className="inline-flex items-center gap-1 text-dark-400 hover:text-white text-sm mb-6 transition-colors group">
          <FiArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Volver a cursos
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Thumbnail */}
            <motion.div 
              className="aspect-video bg-dark-900 rounded-2xl overflow-hidden mb-6 relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-600/20 via-accent-600/10 to-emerald-600/20">
                  <div className="text-center">
                    <FiBookOpen size={64} className="text-brand-600/30 mx-auto mb-3" />
                    <span className="text-2xl font-bold text-brand-600/20">Ix</span>
                  </div>
                </div>
              )}
              <div className="absolute top-4 right-4">
                <span className="badge-free backdrop-blur-sm">100% Gratis</span>
              </div>
            </motion.div>

            <h1 className="text-3xl font-bold text-white mb-3">{course.title}</h1>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="badge-blue">{levelLabels[course.level] || course.level}</span>
              {course.category && <span className="badge-purple">{course.category}</span>}
              {course.duration && (
                <span className="flex items-center gap-1 text-dark-400 text-sm">
                  <FiClock size={14} /> {course.duration}
                </span>
              )}
              <span className="flex items-center gap-1 text-dark-400 text-sm">
                <FiUsers size={14} /> {course._count.enrollments} estudiantes
              </span>
            </div>

            <p className="text-dark-300 leading-relaxed mb-6">{course.description}</p>

            <div className="text-sm text-dark-400 mb-6">
              Creado por <span className="text-dark-200">{course.author.name || course.author.email}</span>
            </div>

            {enrolled && (
              <motion.div 
                className="card p-5 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-white font-semibold mb-3">Tu Progreso</h3>
                <ProgressBar current={completedCount} total={totalLessons} size="lg" />
              </motion.div>
            )}

            {/* Modules */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-white">Contenido del Curso</h2>
              {course.modules.map((mod, i) => (
                <motion.div 
                  key={mod.id} 
                  className="card overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-dark-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-500/10 rounded-lg flex items-center justify-center">
                        <FiBookOpen size={14} className="text-brand-400" />
                      </div>
                      <span className="text-white font-medium text-sm">{mod.title}</span>
                      <span className="text-dark-500 text-xs">({mod.lessons.length} lecciones)</span>
                    </div>
                    <FiArrowRight
                      size={16}
                      className={`text-dark-500 transition-transform duration-300 ${
                        expandedModules.has(mod.id) ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  {expandedModules.has(mod.id) && (
                    <div className="border-t border-dark-800/50">
                      {mod.lessons.map((lesson) => {
                        const isCompleted = progress.some(
                          (p) => p.lessonId === lesson.id && p.completed
                        );
                        const canAccess = enrolled || lesson.isFree;

                        return (
                          <Link
                            key={lesson.id}
                            href={canAccess ? `/cursos/${course.slug}/leccion/${lesson.id}` : '#'}
                            className={`flex items-center gap-3 px-4 py-3 border-b border-dark-800/30 last:border-0 transition-colors ${
                              canAccess
                                ? 'hover:bg-dark-800/50 cursor-pointer'
                                : 'opacity-60 cursor-not-allowed'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isCompleted
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : canAccess
                                ? 'bg-brand-600/20 text-brand-400'
                                : 'bg-dark-800 text-dark-500'
                            }`}>
                              {isCompleted ? (
                                <FiCheck size={12} />
                              ) : canAccess ? (
                                <FiFileText size={10} />
                              ) : (
                                <FiLock size={10} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-dark-200 block truncate">{lesson.title}</span>
                            </div>
                            {lesson.isFree && !enrolled && (
                              <span className="text-xs text-emerald-400 flex-shrink-0">Gratis</span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="card p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 text-emerald-400 font-bold text-2xl">
                    <FiStar size={20} />
                    100% Gratis
                  </div>
                </div>

                {enrolled ? (
                  <Link
                    href={`/cursos/${course.slug}/leccion/${allLessons[0]?.id}`}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <FiBookOpen size={18} />
                    {completedCount > 0 ? 'Continuar Aprendiendo' : 'Comenzar Curso'}
                  </Link>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {enrolling ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <FiBookOpen size={18} />
                        Inscribirse Gratis
                      </>
                    )}
                  </button>
                )}

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <FiBookOpen size={16} className="text-dark-500" />
                    <span className="text-dark-300">{totalLessons} lecciones</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <FiBarChart2 size={16} className="text-dark-500" />
                    <span className="text-dark-300">{course.modules.length} módulos</span>
                  </div>
                  {course.duration && (
                    <div className="flex items-center gap-3 text-sm">
                      <FiClock size={16} className="text-dark-500" />
                      <span className="text-dark-300">{course.duration} de contenido</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <FiUsers size={16} className="text-dark-500" />
                    <span className="text-dark-300">{course._count.enrollments} inscritos</span>
                  </div>
                </div>
              </div>

              {/* Course Progress */}
              {enrolled && (
                <div className="mt-4">
                  <CourseProgress
                    modules={course.modules.map((m) => ({
                      ...m,
                      quizzes: [],
                    }))}
                    completedLessons={completedLessons}
                    courseId={course.id}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Survey Form (shown after enrollment) */}
        {enrolled && (
          <div className="mt-8">
            <SurveyForm courseId={course.id} />
          </div>
        )}

        {/* Course Flashcards */}
        {enrolled && (
          <div className="mt-8">
            <CourseFlashcardViewer courseId={course.id} />
          </div>
        )}
      </div>
    </div>
  );
}
