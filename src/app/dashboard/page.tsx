'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiBook, FiClock, FiArrowRight, FiStar, FiAward, FiUsers, FiDownload } from 'react-icons/fi';
import { ProgressBar } from '@/components/ProgressBar';
import { AchievementList } from '@/components/AchievementList';
import { LearningPaths } from '@/components/LearningPaths';
import { RecommendedCourses } from '@/components/RecommendedCourses';
import { Certificate } from '@/components/Certificate';

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
  const [activeTab, setActiveTab] = useState<'courses' | 'achievements' | 'paths' | 'certificates' | 'recommended'>('courses');
  const [certificates, setCertificates] = useState<any[]>([]);
  const [certificatesLoaded, setCertificatesLoaded] = useState(false);

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
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') load();
  }, [status]);

  useEffect(() => {
    if (activeTab === 'certificates' && !certificatesLoaded && (session?.user as any)?.id) {
      fetch(`/api/certificates?userId=${(session?.user as any).id}`)
        .then((res) => res.json())
        .then((data) => { setCertificates(data.certificates || []); setCertificatesLoaded(true); })
        .catch(() => setCertificatesLoaded(true));
    }
  }, [activeTab, certificatesLoaded, session]);

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
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-2">Mi Aprendizaje</h1>
          <p className="text-dark-400">
            Bienvenido, {session?.user?.name || session?.user?.email}. Continúa donde lo dejaste.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: FiBook, label: 'Cursos', value: enrollments.length, color: 'from-brand-500 to-brand-600' },
            { icon: FiClock, label: 'Lecciones', value: Object.values(progressMap).reduce((a, b) => a + b.completed, 0), color: 'from-emerald-500 to-emerald-600' },
            { icon: FiAward, label: 'Certificados', value: certificates.length || '-', color: 'from-yellow-500 to-yellow-600' },
            { icon: FiClock, label: 'Rutas', value: '-', color: 'from-accent-500 to-accent-600' },
          ].map((s, i) => (
            <motion.div key={s.label} className="card p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white`}>
                  <s.icon size={14} />
                </div>
              </div>
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-dark-400">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'courses' ? 'bg-brand-600 text-white' : 'text-dark-400 hover:text-white bg-dark-800/50'
            }`}
          >
            Cursos Inscritos
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'achievements' ? 'bg-brand-600 text-white' : 'text-dark-400 hover:text-white bg-dark-800/50'
            }`}
          >
            Logros
          </button>
          <button
            onClick={() => setActiveTab('paths')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'paths' ? 'bg-brand-600 text-white' : 'text-dark-400 hover:text-white bg-dark-800/50'
            }`}
          >
            Rutas
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'certificates' ? 'bg-brand-600 text-white' : 'text-dark-400 hover:text-white bg-dark-800/50'
            }`}
          >
            Certificados
          </button>
          <button
            onClick={() => setActiveTab('recommended')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'recommended' ? 'bg-brand-600 text-white' : 'text-dark-400 hover:text-white bg-dark-800/50'
            }`}
          >
            Recomendados
          </button>
          <Link href="/grupos" className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors text-dark-400 hover:text-white bg-dark-800/50`}>
            Grupos
          </Link>
          <Link href="/chat" className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors text-dark-400 hover:text-white bg-dark-800/50`}>
            Chat
          </Link>
        </div>

        {activeTab === 'courses' && (
          enrollments.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment, i) => {
                const totalLessons = enrollment.course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
                const progress = progressMap[enrollment.course.id] || { completed: 0, total: totalLessons };

                return (
                  <motion.div key={enrollment.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
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
                          <ProgressBar current={progress.completed} total={progress.total} size="sm" />
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
            <motion.div className="text-center py-20" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="w-16 h-16 bg-dark-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiBook className="text-dark-500" size={28} />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Aún no estás inscrito en ningún curso</h2>
              <p className="text-dark-400 mb-6">Explora nuestro catálogo y comienza a aprender hoy. Todo es gratis.</p>
              <Link href="/cursos" className="btn-primary inline-flex items-center gap-2">
                <FiStar size={16} /> Ver Cursos <FiArrowRight size={16} />
              </Link>
            </motion.div>
          )
        )}

        {activeTab === 'achievements' && (
          <div>
            {(session?.user as any)?.id && (
              <AchievementList userId={(session?.user as any)?.id} />
            )}
          </div>
        )}

        {activeTab === 'paths' && (
          <div>
            <LearningPaths />
          </div>
        )}

        {activeTab === 'certificates' && (
          <div>
            {certificates.length > 0 ? (
              <div className="space-y-4">
                {certificates.map((cert) => (
                  <div key={cert.id} className="card p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiAward size={20} className="text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{cert.course?.title || 'Curso'}</h3>
                        <p className="text-xs text-dark-500">#{cert.certificateNumber} &middot; {new Date(cert.issuedAt).toLocaleDateString('es')}</p>
                      </div>
                    </div>
                    <Certificate
                      courseId={cert.courseId || cert.id}
                      courseTitle={cert.course?.title || ''}
                      userName={session?.user?.name || ''}
                      completionDate={cert.completedAt || cert.issuedAt || ''}
                      certificateNumber={cert.certificateNumber}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <FiAward size={32} className="text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400">Aún no tienes certificados. Completa un curso para obtener el tuyo.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommended' && (
          <div>
            <RecommendedCourses
              enrolledCourseIds={enrollments.map((e) => e.course.id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
