import Link from 'next/link';
import { FiGithub, FiTwitter, FiMessageCircle, FiStar } from 'react-icons/fi';

export function Footer() {
  return (
    <footer className="border-t border-dark-800/40 bg-dark-950/60 backdrop-blur-sm">
      <div className="section py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/15">
                <FiStar size={14} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Indx<span className="gradient-text">Academy</span>
              </span>
            </Link>
            <p className="text-dark-400 text-sm leading-relaxed max-w-md">
              Aprende programación con cursos prácticos y proyectos reales.
              100% gratis, para siempre. Únete a nuestra comunidad y transforma tu carrera.
            </p>
            <div className="mt-4">
              <span className="badge-free text-xs">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                100% Gratis
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Plataforma</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/cursos', label: 'Cursos' },
                { href: '/dashboard', label: 'Mi Aprendizaje' },
                { href: '/register', label: 'Crear Cuenta' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-dark-400 hover:text-white text-sm transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Comunidad</h3>
            <ul className="space-y-2.5">
              {[
                { icon: FiGithub, label: 'GitHub' },
                { icon: FiTwitter, label: 'Twitter' },
                { icon: FiMessageCircle, label: 'Discord' },
              ].map((item) => (
                <li key={item.label}>
                  <a href="#" className="text-dark-400 hover:text-white text-sm transition-colors duration-200 flex items-center gap-2">
                    <item.icon size={13} /> {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-dark-800/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-dark-500 text-sm">
            &copy; {new Date().getFullYear()} Indx Academy. Un Proyecto de{' '}
            <a href="https://elmarcels.jixen.xyz" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
              ElMarcels
            </a>
          </p>
          <div className="flex items-center gap-5">
            <a href="#" className="text-dark-500 hover:text-dark-300 text-sm transition-colors">Términos</a>
            <a href="#" className="text-dark-500 hover:text-dark-300 text-sm transition-colors">Privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
