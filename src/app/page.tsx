'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FiCode, FiFileText, FiAward, FiUsers, FiCheck, FiArrowRight, FiSparkles, FiBookOpen, FiZap } from 'react-icons/fi';
import { CourseCard } from '@/components/CourseCard';
import { useEffect, useState } from 'react';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  level: string;
  duration: string | null;
  category: string | null;
  author: { name: string | null; image: string | null };
  modules: { lessons: { id: string }[] }[];
  _count: { enrollments: number };
}

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.json())
      .then(data => setCourses(data.slice(0, 6)));
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-600/10 via-accent-600/5 to-transparent" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-brand-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-accent-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        
        <div className="section relative py-24 md:py-36">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600/10 to-accent-600/10 border border-brand-500/20 rounded-full px-5 py-2 mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <FiSparkles size={14} className="text-brand-400" />
              <span className="text-brand-300 text-sm font-medium">100% Gratis - Aprende sin límites</span>
            </motion.div>

            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              Conviértete en{' '}
              <span className="gradient-text">
                desarrollador
              </span>
            </motion.h1>

            <motion.p 
              className="text-dark-400 text-lg md:text-xl mb-10 leading-relaxed max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              Cursos prácticos con proyectos reales, 100% gratuitos. Aprende a tu ritmo con contenido actualizado y una comunidad activa.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <Link href="/cursos" className="btn-primary text-base py-3.5 px-8 flex items-center gap-2">
                Explorar Cursos
                <FiArrowRight size={18} />
              </Link>
              <Link href="/register" className="btn-outline text-base py-3.5 px-8 flex items-center gap-2">
                <FiZap size={16} />
                Empezar Gratis
              </Link>
            </motion.div>

            <motion.div 
              className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {[
                { icon: FiBookOpen, label: 'Lecciones', value: '100+', color: 'text-brand-400' },
                { icon: FiCode, label: 'Proyectos', value: '30+', color: 'text-accent-400' },
                { icon: FiAward, label: 'Cursos', value: '12+', color: 'text-emerald-400' },
                { icon: FiUsers, label: 'Estudiantes', value: '500+', color: 'text-yellow-400' },
              ].map((stat) => (
                <motion.div key={stat.label} className="text-center" variants={fadeInUp}>
                  <stat.icon className={`mx-auto mb-2 ${stat.color}`} size={24} />
                  <div className="text-white font-bold text-2xl">{stat.value}</div>
                  <div className="text-dark-500 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-t border-dark-800/50">
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ¿Por qué <span className="gradient-text">Indx Academy</span>?
            </h2>
            <p className="text-dark-400 text-lg max-w-xl mx-auto">
              Todo lo que necesitas para convertirte en desarrollador, completamente gratis.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FiBookOpen,
                title: 'Aprende Haciendo',
                desc: 'Cada curso incluye proyectos reales que puedes agregar a tu portafolio.',
                color: 'from-brand-500 to-brand-600',
                shadow: 'shadow-brand-500/20',
              },
              {
                icon: FiFileText,
                title: 'Contenido Práctico',
                desc: 'Lecciones documentadas con tareas y archivos descargables para practicar.',
                color: 'from-accent-500 to-accent-600',
                shadow: 'shadow-accent-500/20',
              },
              {
                icon: FiUsers,
                title: 'Comunidad Activa',
                desc: 'Resuelve dudas, comparte proyectos y conecta con otros desarrolladores.',
                color: 'from-emerald-500 to-emerald-600',
                shadow: 'shadow-emerald-500/20',
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="card p-8 text-center group hover:-translate-y-1 transition-transform duration-300"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${f.color} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg ${f.shadow} group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="text-white" size={24} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="py-24 border-t border-dark-800/50">
        <div className="section">
          <motion.div 
            className="flex items-center justify-between mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Últimos Cursos
            </h2>
            <Link href="/cursos" className="text-brand-400 hover:text-brand-300 text-sm font-medium flex items-center gap-1 group">
              Ver todos <FiArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {courses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, i) => (
                <CourseCard key={course.id} course={course} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-dark-500">Próximamente habrá cursos disponibles.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-dark-800/50">
        <div className="section">
          <motion.div 
            className="card p-16 text-center relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 via-accent-600/5 to-emerald-600/10" />
            <div className="absolute top-0 left-1/3 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl" />
            
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                ¿Listo para empezar?
              </h2>
              <p className="text-dark-400 mb-10 max-w-lg mx-auto text-lg">
                Únete a cientos de estudiantes que ya están aprendiendo con Indx Academy. 100% gratis, sin tarjetas de crédito.
              </p>
              <Link href="/register" className="btn-primary text-lg py-4 px-10 inline-flex items-center gap-2">
                Crear Cuenta Gratis
                <FiArrowRight size={20} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
