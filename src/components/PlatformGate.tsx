'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { FiLock } from 'react-icons/fi';

const ALLOWED_PATHS = ['/login', '/register'];

export function PlatformGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [closed, setClosed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/platform-status', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setClosed(!!d.closed))
      .catch(() => setClosed(false));
  }, []);

  if (closed === null) return <>{children}</>;

  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const isAllowedPath = ALLOWED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  // Wait for the session before deciding access so an administrator is never
  // briefly locked out after closing the platform.
  if (closed && session === undefined) return <>{children}</>;

  if (closed && !isAdmin && !isAllowedPath) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="card p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-500/20">
            <FiLock size={28} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Plataforma en Mantenimiento</h1>
          <p className="text-dark-400 text-sm leading-relaxed">
            La plataforma se encuentra temporalmente cerrada. Solo los administradores
            pueden acceder en este momento. Intenta de nuevo más tarde.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
