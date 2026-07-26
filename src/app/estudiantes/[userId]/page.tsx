'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiUser, FiBook, FiAward, FiArrowLeft, FiEdit2, FiSave, FiTag } from 'react-icons/fi';
import { AchievementBadge } from '@/components/AchievementList';
import { ProfilePhoto } from '@/components/ProfilePhoto';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  interests: string | null;
  createdAt: string;
  enrollments: {
    course: { id: string; title: string; slug: string; thumbnail: string | null };
  }[];
  _count: {
    lessonProgress: number;
    achievements: number;
  };
}

interface Achievement {
  id: string;
  achievement: {
    id: string;
    name: string;
    title: string;
    description: string;
    icon: string;
    category: string;
    points: number;
  };
  earnedAt: string;
}

interface Certificate {
  id: string;
  certificateNumber: string;
  issuedAt: string;
  course: { title: string; slug: string };
}

interface ChallengeSubmission {
  id: string;
  status: string;
  submittedAt: string;
  challenge: { title: string; slug: string };
}

export default function StudentProfilePage() {
  const params = useParams();
  const userId = String(params.userId);
  const { data: session } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [challenges, setChallenges] = useState<ChallengeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [name, setName] = useState('');

  const isMe = (session?.user as any)?.id === userId;

  const parsedInterests: string[] = (() => {
    if (!user?.interests) return [];
    try {
      const parsed = JSON.parse(user.interests);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  useEffect(() => {
    async function load() {
      try {
        const [userRes, achRes, certRes, chalRes] = await Promise.all([
          fetch(`/api/students/${userId}`),
          fetch(`/api/users/${userId}/achievements`),
          fetch(`/api/certificates?userId=${userId}`),
          fetch(`/api/challenges?userId=${userId}`),
        ]);
        if (userRes.ok) {
          const data = await userRes.json();
          setUser(data.user);
          setBio(data.user.bio || '');
          setName(data.user.name || '');
        }
        if (achRes.ok) {
          const data = await achRes.json();
          setAchievements(data.achievements);
        }
        if (certRes.ok) {
          const data = await certRes.json();
          setCertificates(data.certificates || []);
        }
        if (chalRes.ok) {
          const data = await chalRes.json();
          setChallenges(data.submissions || []);
        }
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  async function saveProfile() {
    try {
      const res = await fetch(`/api/students/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio }),
      });
      if (res.ok) {
        setUser((prev) => prev ? { ...prev, name, bio } : null);
        setEditing(false);
        toast.success('Perfil actualizado');
      }
    } catch {
      toast.error('Error al guardar');
    }
  }

  if (loading) {
    return (
      <div className="py-12 section">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-dark-800 rounded-2xl" />
          <div className="h-48 bg-dark-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 section text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Estudiante no encontrado</h2>
        <Link href="/estudiantes" className="btn-primary">Volver</Link>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="section max-w-4xl">
        <Link href="/estudiantes" className="inline-flex items-center gap-1 text-dark-400 hover:text-white text-sm mb-6 transition-colors">
          <FiArrowLeft size={14} /> Volver a estudiantes
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card p-8 mb-8">
            <div className="flex items-start gap-6">
              <ProfilePhoto userId={userId} currentImage={user.image} isMe={isMe} size="lg" />
              <div className="flex-1">
                {editing ? (
                  <div className="space-y-3">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="input" />
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Biografía..." rows={3} className="input" />
                    <div className="flex gap-2">
                      <button onClick={saveProfile} className="btn-primary text-sm flex items-center gap-1"><FiSave size={14} /> Guardar</button>
                      <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h1 className="text-2xl font-bold text-white">{user.name || 'Sin nombre'}</h1>
                      {isMe && (
                        <button onClick={() => setEditing(true)} className="btn-secondary text-sm flex items-center gap-1">
                          <FiEdit2 size={14} /> Editar
                        </button>
                      )}
                    </div>
                    <p className="text-dark-400 text-sm mt-1">{user.email}</p>
                    {user.bio && <p className="text-dark-300 mt-3">{user.bio}</p>}
                    {parsedInterests.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {parsedInterests.map((interest) => (
                          <span key={interest} className="inline-flex items-center gap-1 text-xs bg-dark-800 text-dark-300 px-2.5 py-1 rounded-full border border-dark-700">
                            <FiTag size={10} /> {interest}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-center gap-6 mt-4 text-sm text-dark-500">
                  <span className="flex items-center gap-1"><FiBook size={14} /> {user._count.lessonProgress} lecciones completadas</span>
                  <span className="flex items-center gap-1"><FiAward size={14} /> {achievements.length} logros</span>
                  <span className="flex items-center gap-1"><FiAward size={14} /> {certificates.length} certificados</span>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">Logros</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {achievements.map((a) => (
                  <AchievementBadge key={a.id} achievement={a.achievement} earned />
                ))}
              </div>
            </div>
          )}

          {/* Enrolled Courses */}
          {user.enrollments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">Cursos Inscritos</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {user.enrollments.map((e) => (
                  <Link key={e.course.id} href={`/cursos/${e.course.slug}`} className="card-hover p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FiBook size={18} className="text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-white">{e.course.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Certificates */}
          {certificates.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">Certificados</h2>
              <div className="space-y-2">
                {certificates.map((cert) => (
                  <div key={cert.id} className="card-hover p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiAward size={16} className="text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{cert.course.title}</p>
                        <p className="text-xs text-dark-500">#{cert.certificateNumber}</p>
                      </div>
                    </div>
                    <span className="text-xs text-dark-500">{new Date(cert.issuedAt).toLocaleDateString('es')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Challenges */}
          {challenges.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Desafíos Aprobados</h2>
              <div className="space-y-2">
                {challenges.filter((c) => c.status === 'APPROVED').map((chal) => (
                  <div key={chal.id} className="card-hover p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-accent-500/20 to-accent-600/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiAward size={16} className="text-accent-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{chal.challenge.title}</p>
                        <p className="text-xs text-dark-500">Aprobado</p>
                      </div>
                    </div>
                    <span className="text-xs text-dark-500">{new Date(chal.submittedAt).toLocaleDateString('es')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
