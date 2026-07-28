'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiUser, FiBook, FiAward, FiCheck, FiSearch } from 'react-icons/fi';

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
    <div className="py-12">
      <div className="section">
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-title">Estudiantes</h1>
          <p className="page-subtitle">Conoce a la comunidad de aprendizaje.</p>
        </motion.div>

        <div className="relative max-w-md mb-8">
          <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar estudiantes..."
            className="input pl-10"
          />
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6 h-40 skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FiUser className="text-dark-500" size={22} />
            </div>
            <p className="text-dark-400">No se encontraron estudiantes.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((student, i) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link href={`/estudiantes/${student.id}`} className="card-hover p-5 block">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-dark-700/40 flex-shrink-0">
                      {student.image ? (
                        <img src={student.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="avatar-placeholder">
                          <FiUser size={18} className="text-brand-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{student.name || 'Sin nombre'}</h3>
                      <p className="text-xs text-dark-500">
                        desde {new Date(student.createdAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {student.bio && (
                    <p className="text-sm text-dark-400 mb-3 line-clamp-2">{student.bio}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-dark-500">
                    <span className="flex items-center gap-1"><FiBook size={11} /> {student._count.enrollments} cursos</span>
                    <span className="flex items-center gap-1"><FiCheck size={11} /> {student._count.lessonProgress} lecciones</span>
                    <span className="flex items-center gap-1"><FiAward size={11} /> {student._count.achievements} logros</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
