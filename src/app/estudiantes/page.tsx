'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiUser, FiBook, FiAward, FiCheck, FiSearch, FiArrowRight } from 'react-icons/fi';

interface Student {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  createdAt: string;
  _count: {
    enrollments: number;
    lessonProgress: number;
    achievements: number;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.split(' ');
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0];
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/students');
        if (res.ok) {
          const data = await res.json();
          setStudents(data.users);
        }
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = students.filter(
    (s) => s.name?.toLowerCase().includes(search.toLowerCase()) || s.bio?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-8">
      <div className="section">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Hero header */}
          <div className="relative rounded-2xl overflow-hidden mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-brand-600/10 to-accent-600/10" />
            <div className="absolute inset-0 bg-dark-900/40 backdrop-blur-sm" />
            <div className="relative p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Estudiantes</h1>
                  <p className="text-dark-300 text-sm">Conoce a la comunidad de aprendizaje</p>
                </div>
                <div className="bg-dark-800/50 rounded-xl px-4 py-2">
                  <span className="text-sm text-dark-200">{students.length} estudiante{students.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md mb-8">
            <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar estudiantes por nombre o bio..."
              className="input pl-10"
            />
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card p-5 h-44 skeleton" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-dark-800/60 flex items-center justify-center mx-auto mb-4">
                <FiUser size={24} className="text-dark-500" />
              </div>
              <p className="text-dark-300 font-medium mb-1">No se encontraron estudiantes</p>
              <p className="text-dark-500 text-sm">Prueba con otros términos de búsqueda</p>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((student, i) => (
                <motion.div key={student.id} variants={itemVariants}>
                  <Link href={`/estudiantes/${student.id}`} className="card-hover p-5 block">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-dark-700/40 flex-shrink-0">
                        {student.image ? (
                          <img src={student.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="avatar-placeholder">
                            <span className="text-sm font-bold text-brand-400">{getInitials(student.name)}</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white text-sm truncate">{student.name || 'Sin nombre'}</h3>
                        <p className="text-xs text-dark-500">
                          desde {new Date(student.createdAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {student.bio && (
                      <p className="text-sm text-dark-400 mb-3 line-clamp-2 leading-relaxed">{student.bio}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-dark-500 pt-2 border-t border-dark-800/40">
                      <span className="flex items-center gap-1"><FiBook size={11} /> {student._count.enrollments} cursos</span>
                      <span className="flex items-center gap-1"><FiCheck size={11} /> {student._count.lessonProgress} lecciones</span>
                      <span className="flex items-center gap-1"><FiAward size={11} /> {student._count.achievements} logros</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver perfil <FiArrowRight size={10} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
