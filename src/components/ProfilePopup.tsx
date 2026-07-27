'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { FiUser, FiBookOpen, FiAward, FiClock } from 'react-icons/fi';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  lastSeen: string | null;
  createdAt: string;
  _count?: {
    enrollments: number;
    achievements: number;
  };
}

interface ProfilePopupProps {
  userId: string;
  children: React.ReactNode;
}

function formatLastSeen(date: string | null): string {
  if (!date) return 'Nunca';
  const now = new Date();
  const lastSeen = new Date(date);
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `Hace ${diffD}d`;
}

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  const diff = Date.now() - new Date(lastSeen).getTime();
  return diff < 5 * 60 * 1000;
}

export function ProfilePopup({ userId, children }: ProfilePopupProps) {
  const [show, setShow] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setShow(true);
      if (!profile) {
        setLoading(true);
        fetch(`/api/students/${userId}`)
          .then((r) => r.json())
          .then((d) => { if (d.user) setProfile(d.user); })
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    }, 400);
  }

  function handleLeave() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShow(false), 200);
  }

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const online = profile ? isOnline(profile.lastSeen) : false;

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 card p-4 shadow-2xl shadow-dark-950/80 pointer-events-auto"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          >
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-pulse text-dark-500 text-sm">Cargando...</div>
              </div>
            ) : profile ? (
              <div className="text-center">
                <div className="relative inline-block mb-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border-2 border-brand-500/30">
                    {profile.image ? (
                      <img src={profile.image} alt={profile.name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-500/30 via-accent-500/20 to-emerald-500/30 flex items-center justify-center">
                        <span className="text-xl font-bold text-white/80">{(profile.name || '?')[0].toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-dark-900 ${online ? 'bg-emerald-400' : 'bg-dark-600'}`} />
                </div>

                <h4 className="text-white font-semibold text-sm truncate">{profile.name || 'Sin nombre'}</h4>
                <p className="text-dark-500 text-xs truncate">{profile.email}</p>

                {profile.bio && (
                  <p className="text-dark-400 text-xs mt-2 line-clamp-2">{profile.bio}</p>
                )}

                <div className="flex items-center justify-center gap-4 mt-3 text-xs text-dark-400">
                  <span className="flex items-center gap-1">
                    <FiBookOpen size={10} /> {profile._count?.enrollments || 0} cursos
                  </span>
                  <span className="flex items-center gap-1">
                    <FiAward size={10} /> {profile._count?.achievements || 0} logros
                  </span>
                </div>

                <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-dark-500">
                  <FiClock size={10} />
                  {online ? (
                    <span className="text-emerald-400 font-medium">En línea</span>
                  ) : (
                    <span>Última vez: {formatLastSeen(profile.lastSeen)}</span>
                  )}
                </div>

                <Link
                  href={`/estudiantes/${profile.id}`}
                  className="mt-3 w-full btn-primary text-xs py-1.5 block text-center"
                  onClick={() => setShow(false)}
                >
                  Ver perfil
                </Link>
              </div>
            ) : (
              <div className="text-dark-500 text-sm text-center py-2">No encontrado</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
