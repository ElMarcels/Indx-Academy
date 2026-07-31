'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiUsers, FiBook, FiBarChart2, FiArrowRight, FiClock, FiAward, FiMessageSquare, FiTrendingUp, FiFlag, FiMail,
  FiLock, FiUnlock,
} from 'react-icons/fi';

interface Stats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalLessons: number;
  totalMessages: number;
  totalAchievements: number;
}

interface RecentUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

interface RecentEnrollment {
  id: string;
  enrolledAt: string;
  user: { name: string | null; email: string };
  course: { title: string };
}

interface CourseStat {
  title: string;
  enrollmentCount: number;
  lessonCount: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformClosed, setPlatformClosed] = useState(false);
  const [togglingPlatform, setTogglingPlatform] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentUsers(data.recentUsers);
          setRecentEnrollments(data.recentEnrollments);
          setCourseStats(data.courseStats || []);
        }
        const platformRes = await fetch('/api/admin/platform');
        if (platformRes.ok) {
          const platformData = await platformRes.json();
          setPlatformClosed(!!platformData.closed);
        }
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') load();
  }, [status]);

  async function togglePlatform() {
    setTogglingPlatform(true);
    try {
      const res = await fetch('/api/admin/platform', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closed: !platformClosed }),
      });
      if (res.ok) {
        const data = await res.json();
        setPlatformClosed(!!data.closed);
      }
    } catch { /* silent */ } finally {
      setTogglingPlatform(false);
    }
  }

  if (loading) {
    return (
      <div className="py-12 section">
        <div className="animate-pulse space-y-6">
          <div className="h-8 skeleton w-1/4" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-28 skeleton rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: FiUsers, label: 'Usuarios', value: stats?.totalUsers || 0, color: 'from-brand-500 to-brand-600' },
    { icon: FiBook, label: 'Cursos', value: stats?.totalCourses || 0, color: 'from-emerald-500 to-emerald-600' },
    { icon: FiBarChart2, label: 'Inscripciones', value: stats?.totalEnrollments || 0, color: 'from-yellow-500 to-yellow-600' },
    { icon: FiClock, label: 'Lecciones', value: stats?.totalLessons || 0, color: 'from-accent-500 to-accent-600' },
    { icon: FiMessageSquare, label: 'Mensajes', value: stats?.totalMessages || 0, color: 'from-pink-500 to-pink-600' },
    { icon: FiAward, label: 'Logros', value: stats?.totalAchievements || 0, color: 'from-orange-500 to-orange-600' },
  ];

  const maxEnroll = Math.max(...courseStats.map((c) => c.enrollmentCount), 1);

  return (
    <div className="py-12">
      <div className="section">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="page-title">Panel de Admin</h1>
            <p className="page-subtitle">Gestiona cursos, lecciones, usuarios y más.</p>
          </div>
          <Link href="/admin/courses/new" className="btn-primary flex items-center gap-2 text-sm">
            + Nuevo Curso
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              className="stat-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg mb-1`}>
                <s.icon size={16} />
              </div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Platform status */}
        <div className="card p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${platformClosed ? 'bg-red-500/15' : 'bg-emerald-500/15'}`}>
            {platformClosed ? <FiLock size={18} className="text-red-400" /> : <FiUnlock size={18} className="text-emerald-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              Estado de la Plataforma
              <span className={`badge text-[10px] ${platformClosed ? 'badge-red' : 'badge-green'}`}>
                {platformClosed ? 'Cerrada' : 'Abierta'}
              </span>
            </h2>
            <p className="text-dark-500 text-xs mt-0.5">
              {platformClosed
                ? 'La plataforma está cerrada. Solo los administradores pueden acceder.'
                : 'La plataforma está abierta. Todos los usuarios pueden acceder.'}
            </p>
          </div>
          <button
            onClick={togglePlatform}
            disabled={togglingPlatform}
            className={`text-sm py-2 px-4 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 flex items-center gap-2 flex-shrink-0 ${
              platformClosed
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {togglingPlatform ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : platformClosed ? (
              <FiUnlock size={14} />
            ) : (
              <FiLock size={14} />
            )}
            {platformClosed ? 'Abrir Plataforma' : 'Cerrar Plataforma'}
          </button>
        </div>

        {/* Enrollment bar chart */}
        {courseStats.length > 0 && (
          <div className="card p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <FiTrendingUp size={15} className="text-brand-400" />
              <h2 className="text-white font-semibold text-sm">Inscripciones por Curso</h2>
            </div>
            <div className="space-y-3">
              {courseStats.map((cs) => (
                <div key={cs.title} className="flex items-center gap-4">
                  <span className="text-sm text-dark-300 w-48 truncate">{cs.title}</span>
                  <div className="flex-1 h-5 bg-dark-800/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(cs.enrollmentCount / maxEnroll) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-sm text-dark-400 w-10 text-right font-medium">{cs.enrollmentCount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent users & enrollments */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <div className="p-5 border-b border-dark-800/40">
              <h2 className="text-white font-semibold text-sm">Usuarios Recientes</h2>
            </div>
            <div className="divide-y divide-dark-800/30">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <div key={user.id} className="px-5 py-3 flex items-center justify-between hover:bg-dark-800/20 transition-colors">
                    <div className="min-w-0">
                      <div className="text-sm text-white truncate">{user.name || 'Sin nombre'}</div>
                      <div className="text-xs text-dark-500 truncate">{user.email}</div>
                    </div>
                    <span className={`badge text-[10px] ${
                      user.role === 'ADMIN'
                        ? 'badge-blue'
                        : 'bg-dark-800/50 text-dark-400 border border-dark-700/40'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-5 py-8 text-center text-dark-500 text-sm">Sin usuarios</div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="p-5 border-b border-dark-800/40">
              <h2 className="text-white font-semibold text-sm">Inscripciones Recientes</h2>
            </div>
            <div className="divide-y divide-dark-800/30">
              {recentEnrollments.length > 0 ? (
                recentEnrollments.map((enrollment) => (
                  <div key={enrollment.id} className="px-5 py-3 flex items-center justify-between hover:bg-dark-800/20 transition-colors">
                    <div className="min-w-0">
                      <div className="text-sm text-white truncate">{enrollment.user.name || enrollment.user.email}</div>
                      <div className="text-xs text-dark-500 truncate">{enrollment.course.title}</div>
                    </div>
                    <span className="text-xs text-dark-500">
                      {new Date(enrollment.enrolledAt).toLocaleDateString('es')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-5 py-8 text-center text-dark-500 text-sm">Sin inscripciones</div>
              )}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { href: '/admin/courses', title: 'Gestionar Cursos', desc: 'Crear, editar, eliminar' },
            { href: '/admin/courses/new', title: 'Nuevo Curso', desc: 'Añadir curso al catálogo' },
            { href: '/admin/users', title: 'Usuarios', desc: 'Ver todos los usuarios' },
            { href: '/admin/reports', title: 'Moderación', desc: 'Reportes pendientes', icon: FiFlag },
            { href: '/admin/support', title: 'Soporte', desc: 'Tickets de usuarios', icon: FiMail },
          ].map((link, i) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
            >
              <Link href={link.href} className="card p-5 hover:border-dark-600/60 transition-all duration-200 flex items-center justify-between group hover:-translate-y-0.5">
                <div>
                  <h3 className="text-white font-medium text-sm flex items-center gap-2">
                    {link.icon && <link.icon size={13} className="text-red-400" />}
                    {link.title}
                  </h3>
                  <p className="text-dark-500 text-xs mt-0.5">{link.desc}</p>
                </div>
                <FiArrowRight size={16} className="text-dark-600 group-hover:text-brand-400 transition-colors" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
