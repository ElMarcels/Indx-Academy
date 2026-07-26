'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiBook, FiClock, FiArrowRight, FiSparkles } from 'react-icons/fi';
import { ProgressBar } from '@/components/ProgressBar';

interface EnrolledCourse {
  id: string;
  enrolledAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail: string | null;
    level: string;
    modules: {
      lessons: { id: string }[];
    }[];
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, { completed: number; total: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const data = await res.json();
          setEnrollments(data.enrollments);
          setProgressMap(data.progressMap);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') load();
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="py-12 section">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-dark-800 rounded w-1/3" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-dark-800 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="section">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Mi Aprendizaje</h1>
          <p className="text-dark-400">
            Bienvenido, {session?.user?.name || session?.user?.email}. Continúa donde lo dejaste.
          </p>
        </motion.div>

        {enrollments.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment, i) => {
              const totalLessons = enrollment.course.modules.reduce(
                (acc, m) => acc + m.lessons.length, 0
              );
              const progress = progressMap[enrollment.course.id] || { completed: 0, total: totalLessons };

              return (
                <motion.div
                  key={enrollment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={`/cursos/${enrollment.course.slug}`}>
                    <div className="card-hover p-5 h-full flex flex-col">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-brand-500/20 to-accent-500/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-brand-500/10">
                          <FiBook className="text-brand-400" size={22} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-white font-semibold truncate">{enrollment.course.title}</h3>
                          <span className="text-xs text-dark-500 capitalize">{enrollment.course.level.toLowerCase()}</span>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <ProgressBar
                          current={progress.completed}
                          total={progress.total}
                          size="sm"
                        />
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-dark-500 flex items-center gap-1">
                          <FiClock size={12} />
                          Inscrito {new Date(enrollment.enrolledAt).toLocaleDateString('es')}
                        </span>
                        <FiArrowRight size={16} className="text-dark-500 group-hover:text-brand-400" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-16 h-16 bg-dark-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiBook className="text-dark-500" size={28} />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Aún no estás inscrito en ningún curso</h2>
            <p className="text-dark-400 mb-6">Explora nuestro catálogo y comienza a aprender hoy. Todo es gratis.</p>
            <Link href="/cursos" className="btn-primary inline-flex items-center gap-2">
              <FiSparkles size={16} /> Ver Cursos <FiArrowRight size={16} />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
