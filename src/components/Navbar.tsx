'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMenu, FiX, FiUser, FiLogOut, FiShield, FiStar, FiUsers, FiMessageSquare, FiUserPlus, FiBook,
  FiLayers, FiGlobe,
} from 'react-icons/fi';
import { Notifications } from '@/components/Notifications';

export function Navbar() {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const NavLink = ({ href, children, accent }: { href: string; children: React.ReactNode; accent?: boolean }) => (
    <Link
      href={href}
      className={`relative text-sm font-medium transition-colors duration-200 group ${
        accent ? 'text-accent-400 hover:text-accent-300' : 'text-dark-400 hover:text-white'
      }`}
      onClick={() => setMobileOpen(false)}
    >
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-brand-500 to-accent-500 group-hover:w-full transition-all duration-300 rounded-full" />
    </Link>
  );

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-dark-950/85 backdrop-blur-2xl border-b border-dark-800/40 shadow-lg shadow-dark-950/30'
        : 'bg-transparent'
    }`}>
      <div className="section">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.div
              className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20"
              whileHover={{ scale: 1.08, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiStar size={14} className="text-white" />
            </motion.div>
            <span className="text-lg font-bold text-white tracking-tight">
              Indx<span className="gradient-text">Academy</span>
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-5">
            <NavLink href="/cursos">Cursos</NavLink>

            {session && (
              <>
                <NavLink href="/dashboard">Mi Aprendizaje</NavLink>
                <NavLink href="/contactos">Contactos</NavLink>
                <NavLink href="/grupos">Grupos</NavLink>
                <NavLink href="/estudiantes">Estudiantes</NavLink>
                <NavLink href="/chat">Chat</NavLink>
                <NavLink href="/glosario">Glosario</NavLink>
                <NavLink href="/rutas">Rutas</NavLink>
                <NavLink href="/soporte">Soporte</NavLink>
              </>
            )}

            {(session?.user as any)?.role === 'ADMIN' && (
              <NavLink href="/admin" accent>
                <span className="flex items-center gap-1.5">
                  <FiShield size={13} />
                  Admin
                </span>
              </NavLink>
            )}

            {status === 'loading' ? (
              <div className="w-20 h-8 bg-dark-800/60 rounded-xl animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-2.5 pl-3 border-l border-dark-800/50">
                <Notifications />
                <Link href={`/estudiantes/${(session.user as any)?.id || ''}`} className="flex items-center gap-2 group">
                  <motion.div className="w-8 h-8 rounded-full overflow-hidden border border-dark-700/40 flex-shrink-0" whileHover={{ scale: 1.08 }}>
                    {(session.user as any)?.image ? (
                      <img src={(session.user as any).image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="avatar-placeholder">
                        <FiUser size={14} className="text-brand-400" />
                      </div>
                    )}
                  </motion.div>
                  <span className="text-sm text-dark-300 max-w-[100px] truncate group-hover:text-white transition-colors hidden lg:block">
                    {session.user?.name || session.user?.email}
                  </span>
                </Link>
                <motion.button
                  onClick={() => signOut()}
                  className="p-2 text-dark-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                  title="Cerrar Sesión"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                >
                  <FiLogOut size={15} />
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link href="/login" className="btn-secondary text-sm py-2 px-4">Iniciar Sesión</Link>
                <Link href="/register" className="btn-primary text-sm py-2 px-4">Registrarse</Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <motion.button
            className="md:hidden p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-800/50"
            onClick={() => setMobileOpen(!mobileOpen)}
            whileTap={{ scale: 0.92 }}
          >
            {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </motion.button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden border-t border-dark-800/40"
            >
              <div className="py-4 space-y-1">
                <Link href="/cursos" className="flex items-center gap-2.5 text-dark-300 hover:text-white py-2.5 px-3 text-sm rounded-xl hover:bg-dark-800/40 transition-all" onClick={() => setMobileOpen(false)}>
                  <FiBook size={15} /> Cursos
                </Link>
                {session ? (
                  <>
                    <Link href="/dashboard" className="flex items-center gap-2.5 text-dark-300 hover:text-white py-2.5 px-3 text-sm rounded-xl hover:bg-dark-800/40 transition-all" onClick={() => setMobileOpen(false)}>
                      <FiBook size={15} /> Mi Aprendizaje
                    </Link>
                    <Link href="/contactos" className="flex items-center gap-2.5 text-dark-300 hover:text-white py-2.5 px-3 text-sm rounded-xl hover:bg-dark-800/40 transition-all" onClick={() => setMobileOpen(false)}>
                      <FiUserPlus size={15} /> Contactos
                    </Link>
                    <Link href="/grupos" className="flex items-center gap-2.5 text-dark-300 hover:text-white py-2.5 px-3 text-sm rounded-xl hover:bg-dark-800/40 transition-all" onClick={() => setMobileOpen(false)}>
                      <FiUsers size={15} /> Grupos
                    </Link>
                    <Link href="/estudiantes" className="flex items-center gap-2.5 text-dark-300 hover:text-white py-2.5 px-3 text-sm rounded-xl hover:bg-dark-800/40 transition-all" onClick={() => setMobileOpen(false)}>
                      <FiUsers size={15} /> Estudiantes
                    </Link>
                    <Link href="/chat" className="flex items-center gap-2.5 text-dark-300 hover:text-white py-2.5 px-3 text-sm rounded-xl hover:bg-dark-800/40 transition-all" onClick={() => setMobileOpen(false)}>
                      <FiMessageSquare size={15} /> Chat
                    </Link>
                    <Link href="/glosario" className="flex items-center gap-2.5 text-dark-300 hover:text-white py-2.5 px-3 text-sm rounded-xl hover:bg-dark-800/40 transition-all" onClick={() => setMobileOpen(false)}>
                      <FiGlobe size={15} /> Glosario
                    </Link>
                    <Link href="/rutas" className="flex items-center gap-2.5 text-dark-300 hover:text-white py-2.5 px-3 text-sm rounded-xl hover:bg-dark-800/40 transition-all" onClick={() => setMobileOpen(false)}>
                      <FiLayers size={15} /> Rutas
                    </Link>
                    <Link href="/soporte" className="flex items-center gap-2.5 text-dark-300 hover:text-white py-2.5 px-3 text-sm rounded-xl hover:bg-dark-800/40 transition-all" onClick={() => setMobileOpen(false)}>
                      <FiUserPlus size={15} /> Soporte
                    </Link>
                    <div className="px-3 py-1.5">
                      <Notifications />
                    </div>
                    {(session.user as any)?.role === 'ADMIN' && (
                      <Link href="/admin" className="flex items-center gap-2.5 text-accent-400 hover:text-accent-300 py-2.5 px-3 text-sm rounded-xl hover:bg-accent-500/10 transition-all" onClick={() => setMobileOpen(false)}>
                        <FiShield size={15} /> Panel Admin
                      </Link>
                    )}
                    <div className="border-t border-dark-800/40 my-2" />
                    <button onClick={() => { signOut(); setMobileOpen(false); }} className="flex items-center gap-2.5 text-red-400 hover:text-red-300 py-2.5 px-3 text-sm rounded-xl hover:bg-red-500/10 transition-all w-full text-left">
                      <FiLogOut size={15} /> Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block text-dark-300 hover:text-white py-2.5 px-3 text-sm rounded-xl hover:bg-dark-800/40 transition-all" onClick={() => setMobileOpen(false)}>
                      Iniciar Sesión
                    </Link>
                    <div className="px-3 pt-2">
                      <Link href="/register" className="btn-primary text-sm text-center block" onClick={() => setMobileOpen(false)}>
                        Registrarse
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
