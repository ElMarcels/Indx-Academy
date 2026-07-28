'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiUser } from 'react-icons/fi';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  _count: { enrollments: number };
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') load();
  }, [status]);

  if (loading) {
    return (
      <div className="py-12 section">
        <div className="animate-pulse space-y-4">
          <div className="h-8 skeleton w-1/4" />
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="section max-w-4xl">
        <Link href="/admin" className="inline-flex items-center gap-1 text-dark-400 hover:text-white text-sm mb-6 transition-colors">
          <FiArrowLeft size={14} /> Volver al admin
        </Link>

        <h1 className="page-title">Usuarios</h1>
        <p className="text-dark-400 mb-8">{users.length} usuarios registrados</p>

        <div className="card overflow-hidden">
          <div className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-4 px-5 py-3 bg-dark-800/50 text-xs font-medium text-dark-400 uppercase tracking-wider">
            <span>Usuario</span>
            <span>Email</span>
            <span>Rol</span>
            <span>Cursos</span>
            <span>Registro</span>
          </div>
          <div className="divide-y divide-dark-800">
            {users.map((user) => (
              <div key={user.id} className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-4 px-5 py-3 items-center">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 bg-dark-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiUser size={14} className="text-dark-400" />
                  </div>
                  <span className="text-sm text-white truncate">{user.name || 'Sin nombre'}</span>
                </div>
                <span className="text-sm text-dark-300 truncate">{user.email}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${
                  user.role === 'ADMIN'
                    ? 'bg-brand-600/10 text-brand-400'
                    : 'bg-dark-800 text-dark-400'
                }`}>
                  {user.role}
                </span>
                <span className="text-sm text-dark-400">{user._count.enrollments}</span>
                <span className="text-xs text-dark-500">
                  {new Date(user.createdAt).toLocaleDateString('es')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
