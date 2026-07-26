'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiBarChart2, FiSparkles } from 'react-icons/fi';

interface Course {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  level: string;
  category: string | null;
  _count: { enrollments: number };
  modules: { lessons: { id: string }[] }[];
  createdAt: string;
}

export default function AdminCoursesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    loadCourses();
  }, [status]);

  async function loadCourses() {
    try {
      const res = await fetch('/api/admin/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function togglePublish(courseId: string, current: boolean) {
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !current }),
      });

      if (res.ok) {
        setCourses(courses.map(c => c.id === courseId ? { ...c, isPublished: !current } : c));
        toast.success(current ? 'Curso ocultado' : 'Curso publicado');
      }
    } catch {
      toast.error('Error al actualizar');
    }
  }

  async function deleteCourse(courseId: string) {
    if (!confirm('¿Seguro que quieres eliminar este curso? Esta acción no se puede deshacer.')) return;

    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
      if (res.ok) {
        setCourses(courses.filter(c => c.id !== courseId));
        toast.success('Curso eliminado');
      }
    } catch {
      toast.error('Error al eliminar');
    }
  }

  if (loading) {
    return (
      <div className="py-12 section">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-800 rounded w-1/4" />
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-dark-800 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="section">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Cursos</h1>
            <p className="text-dark-400">{courses.length} cursos en total</p>
          </div>
          <Link href="/admin/courses/new" className="btn-primary flex items-center gap-2">
            <FiPlus size={16} /> Nuevo Curso
          </Link>
        </div>

        <div className="space-y-3">
          {courses.map((course) => {
            const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

            return (
              <div key={course.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold truncate">{course.title}</h3>
                    {course.isPublished ? (
                      <FiEye size={14} className="text-green-400 flex-shrink-0" />
                    ) : (
                      <FiEyeOff size={14} className="text-dark-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-dark-500">
                    <span className="badge-free text-[10px]">Gratis</span>
                    <span className="capitalize">{course.level.toLowerCase()}</span>
                    {course.category && <span>{course.category}</span>}
                    <span className="flex items-center gap-1"><FiBarChart2 size={10} />{totalLessons} lecciones</span>
                    <span>{course._count.enrollments} inscritos</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    <FiEdit2 size={12} /> Editar
                  </Link>
                  <button
                    onClick={() => togglePublish(course.id, course.isPublished)}
                    className={`text-xs py-1.5 px-3 rounded-lg border transition-colors ${
                      course.isPublished
                        ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10'
                        : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                    }`}
                  >
                    {course.isPublished ? 'Ocultar' : 'Publicar'}
                  </button>
                  <button
                    onClick={() => deleteCourse(course.id)}
                    className="text-xs py-1.5 px-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}

          {courses.length === 0 && (
            <div className="text-center py-16">
              <p className="text-dark-500 mb-4">No hay cursos creados.</p>
              <Link href="/admin/courses/new" className="btn-primary">Crear primer curso</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
