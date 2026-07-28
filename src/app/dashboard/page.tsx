'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiBook, FiClock, FiArrowRight, FiStar, FiAward, FiUsers, FiMessageSquare } from 'react-icons/fi';
import { ProgressBar } from '@/components/ProgressBar';
import { AchievementList } from '@/components/AchievementList';
import { LearningPaths } from '@/components/LearningPaths';
import { RecommendedCourses } from '@/components/RecommendedCourses';
import { Certificate } from '@/components/Certificate';
import { CertificatePDF } from '@/components/CertificatePDF';

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

const tabs = [
  { key: 'courses', label: 'Cursos Inscritos' },
  { key: 'achievements', label: 'Logros' },
  { key: 'paths', label: 'Rutas' },
  { key: 'certificates', label: 'Certificados' },
  { key: 'recommended', label: 'Recomendados' },
] as const;

type TabKey = typeof tabs[number]['key'];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, { completed: number; total: number }>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('courses');
  const [certificates, setCertificates] = useState<any[]>([]);
  const [certificatesLoaded, setCertificatesLoaded] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
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
          <div className="h-8 skeleton w-1/3" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 skeleton rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalCompleted = Object.values(progressMap).reduce((a, b) => a + b.completed, 0);

  return (
    <div className="py-12">
      <div className="section">
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-title">Mi Aprendizaje</h1>
          <p className="page-subtitle">
            Bienvenido, {session?.user?.name || session?.user?.email}. Continúa donde lo dejaste.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: FiBook, label: 'Cursos', value: enrollments.length, color: 'from-brand-500 to-brand-600' },
            { icon: FiClock, label: 'Lecciones', value: totalCompleted, color: 'from-emerald-500 to-emerald-600' },
            { icon: FiAward, label: 'Certificados', value: certificates.length || '-', color: 'from-yellow-500 to-yellow-600' },
            { icon: FiUsers, label: 'Rutas', value: '-', color: 'from-accent-500 to-accent-600' },
          ].map((s, i) => (
            <motion.div key={s.label} className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg mb-1`}>
                <s.icon size={16} />
              </div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={activeTab === tab.key ? 'tab-btn-active' : 'tab-btn'}
            >
              {tab.label}
            </button>
          ))}
          <Link href="/grupos" className="tab-btn">Grupos</Link>
          <Link href="/chat" className="tab-btn">Chat</Link>
        </div>

        {activeTab === 'courses' && (
          enrollments.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {enrollments.map((enrollment, i) => {
                const totalLessons = enrollment.course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
                const progress = progressMap[enrollment.course.id] || { completed: 0, total: totalLessons };

                return (
                  <motion.div key={enrollment.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <Link href={`/cursos/${enrollment.course.slug}`}>
                      <div className="card-hover p-5 h-full flex flex-col">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-brand-500/15 to-accent-500/15 rounded-xl flex items-center justify-center flex-shrink-0 border border-brand-500/10">
                            <FiBook className="text-brand-400" size={20} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-white font-semibold truncate text-sm">{enrollment.course.title}</h3>
                            <span className="text-xs text-dark-500 capitalize">{enrollment.course.level.toLowerCase()}</span>
                          </div>
                        </div>
                        <div className="mt-auto">
                          <ProgressBar current={progress.completed} total={progress.total} size="sm" />
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-dark-500 flex items-center gap-1">
                            <FiClock size={11} />
                            {new Date(enrollment.enrolledAt).toLocaleDateString('es')}
                          </span>
                          <FiArrowRight size={14} className="text-dark-600 group-hover:text-brand-400" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div className="empty-state" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="empty-state-icon">
                <FiBook className="text-dark-500" size={24} />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Aún no estás inscrito en ningún curso</h2>
              <p className="text-dark-400 mb-6">Explora nuestro catálogo y comienza a aprender hoy. Todo es gratis.</p>
              <Link href="/cursos" className="btn-primary inline-flex items-center gap-2">
                <FiStar size={15} /> Ver Cursos <FiArrowRight size={15} />
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
              <div className="space-y-3">
                {certificates.map((cert) => (
                  <div key={cert.id} className="card p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-gradient-to-br from-yellow-500/15 to-yellow-600/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiAward size={18} className="text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm">{cert.course?.title || 'Curso'}</h3>
                        <p className="text-xs text-dark-500">#{cert.certificateNumber} &middot; {new Date(cert.issuedAt).toLocaleDateString('es')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Certificate
                        courseId={cert.courseId || cert.id}
                        courseTitle={cert.course?.title || ''}
                        userName={session?.user?.name || ''}
                        completionDate={cert.completedAt || cert.issuedAt || ''}
                        certificateNumber={cert.certificateNumber}
                      />
                      <CertificatePDF
                        userName={session?.user?.name || ''}
                        courseTitle={cert.course?.title || ''}
                        completionDate={cert.completedAt || cert.issuedAt || ''}
                        certificateNumber={cert.certificateNumber}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FiAward size={22} className="text-dark-500" />
                </div>
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
