import Link from 'next/link';
import { FiGithub, FiTwitter, FiMessageCircle, FiHeart } from 'react-icons/fi';

export function Footer() {
  return (
    <footer className="border-t border-dark-800/50 bg-dark-950/80 backdrop-blur-sm">
      <div className="section py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">Ix</span>
              </div>
              <span className="text-xl font-bold text-white">
                Indx<span className="gradient-text">Academy</span>
              </span>
            </Link>
            <p className="text-dark-400 text-sm leading-relaxed max-w-md">
              Aprende programación con cursos prácticos y proyectos reales.
              100% gratis, para siempre. Únete a nuestra comunidad y transforma tu carrera.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="badge-free text-xs">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse mr-1" />
                100% Gratis
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Plataforma</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/cursos" className="text-dark-400 hover:text-white text-sm transition-colors">
                  Cursos
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-dark-400 hover:text-white text-sm transition-colors">
                  Mi Aprendizaje
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-dark-400 hover:text-white text-sm transition-colors">
                  Crear Cuenta
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Comunidad</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-dark-400 hover:text-white text-sm transition-colors flex items-center gap-2">
                  <FiGithub size={14} /> GitHub
                </a>
              </li>
              <li>
                <a href="#" className="text-dark-400 hover:text-white text-sm transition-colors flex items-center gap-2">
                  <FiTwitter size={14} /> Twitter
                </a>
              </li>
              <li>
                <a href="#" className="text-dark-400 hover:text-white text-sm transition-colors flex items-center gap-2">
                  <FiMessageCircle size={14} /> Discord
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-dark-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-dark-500 text-sm flex items-center gap-1">
            &copy; {new Date().getFullYear()} Indx Academy. Hecho con <FiHeart size={12} className="text-red-400" /> para la comunidad.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-dark-500 hover:text-white text-sm transition-colors">Términos</a>
            <a href="#" className="text-dark-500 hover:text-white text-sm transition-colors">Privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
