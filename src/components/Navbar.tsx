'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiUser, FiBook, FiLogOut, FiShield, FiStar, FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from './ThemeProvider';

export function Navbar() {
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-dark-950/90 backdrop-blur-2xl border-b border-dark-800/50 shadow-xl shadow-dark-950/50 scrolled' 
        : 'bg-transparent backdrop-blur-sm'
    }`}>
      <div className="section">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.div 
              className="w-9 h-9 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/25"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiStar size={16} className="text-white" />
            </motion.div>
            <span className="text-xl font-bold text-white">
              Indx<span className="gradient-text">Academy</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/cursos"
              className="text-dark-300 hover:text-white transition-colors text-sm font-medium relative group"
            >
              Cursos
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-brand-500 to-accent-500 group-hover:w-full transition-all duration-300" />
            </Link>

            <motion.button
              onClick={toggleTheme}
              className="text-dark-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-dark-800/50"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
            </motion.button>

            {status === 'loading' ? (
              <div className="w-20 h-8 bg-dark-800 rounded-xl animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="text-dark-300 hover:text-white transition-colors text-sm font-medium relative group"
                >
                  Mi Aprendizaje
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-brand-500 to-accent-500 group-hover:w-full transition-all duration-300" />
                </Link>
                {(session.user as any)?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 text-accent-400 hover:text-accent-300 transition-colors text-sm font-medium"
                  >
                    <FiShield size={14} />
                    Admin
                  </Link>
                )}
                <div className="flex items-center gap-2 pl-4 border-l border-dark-700/50">
                  <motion.div 
                    className="w-8 h-8 bg-gradient-to-br from-brand-500/20 to-accent-500/20 rounded-full flex items-center justify-center border border-brand-500/20"
                    whileHover={{ scale: 1.1 }}
                  >
                    <FiUser size={14} className="text-brand-400" />
                  </motion.div>
                  <span className="text-sm text-dark-200 max-w-[120px] truncate">
                    {session.user?.name || session.user?.email}
                  </span>
                  <motion.button
                    onClick={() => signOut()}
                    className="text-dark-500 hover:text-red-400 transition-colors"
                    title="Cerrar sesión"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiLogOut size={16} />
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="btn-secondary text-sm py-2 px-4">
                  Iniciar Sesión
                </Link>
                <Link href="/register" className="btn-primary text-sm py-2 px-4">
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          <motion.button
            className="md:hidden text-dark-300 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
            whileTap={{ scale: 0.9 }}
          >
            {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </motion.button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden border-t border-dark-800/50"
            >
              <div className="py-4 space-y-3">
                <Link
                  href="/cursos"
                  className="block text-dark-300 hover:text-white py-2 text-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  Cursos
                </Link>
                <button
                  onClick={() => { toggleTheme(); }}
                  className="flex items-center gap-2 text-dark-300 hover:text-white py-2 text-sm"
                >
                  {theme === 'dark' ? <FiSun size={14} /> : <FiMoon size={14} />}
                  {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                </button>
                {session ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="block text-dark-300 hover:text-white py-2 text-sm"
                      onClick={() => setMobileOpen(false)}
                    >
                      Mi Aprendizaje
                    </Link>
                    {(session.user as any)?.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="block text-accent-400 hover:text-accent-300 py-2 text-sm"
                        onClick={() => setMobileOpen(false)}
                      >
                        Panel Admin
                      </Link>
                    )}
                    <button
                      onClick={() => { signOut(); setMobileOpen(false); }}
                      className="text-red-400 hover:text-red-300 py-2 text-sm text-left"
                    >
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block text-dark-300 hover:text-white py-2 text-sm" onClick={() => setMobileOpen(false)}>
                      Iniciar Sesión
                    </Link>
                    <Link href="/register" className="btn-primary text-sm text-center mt-2 block" onClick={() => setMobileOpen(false)}>
                      Registrarse
                    </Link>
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
