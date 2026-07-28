'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiStar } from 'react-icons/fi';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Email o contraseña incorrectos');
      } else {
        toast.success('¡Bienvenido!');
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md px-4">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20">
            <FiStar size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Iniciar Sesión</h1>
          <p className="text-dark-400 text-sm">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Regístrate gratis
            </Link>
          </p>
        </motion.div>

        <motion.div
          className="card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Contraseña</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-dark-800/40">
            <p className="text-dark-500 text-xs text-center flex items-center justify-center gap-1.5">
              <FiStar size={11} className="text-emerald-400" />
              Demo: admin@indx.academy / admin123
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
