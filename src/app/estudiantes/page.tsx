'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiUser, FiBook, FiAward, FiCheck } from 'react-icons/fi';

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
        <h1 className="text-3xl font-bold text-white mb-6">Estudiantes</h1>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar estudiantes..."
          className="input max-w-md mb-8"
        />

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6 h-40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center text-dark-400">No se encontraron estudiantes.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((student, i) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/estudiantes/${student.id}`} className="card-hover p-5 block">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-brand-500/20 flex-shrink-0">
                      {student.image ? (
                        <img src={student.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center">
                          <FiUser size={20} className="text-brand-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{student.name || 'Sin nombre'}</h3>
                      <p className="text-xs text-dark-500">
                        desde {new Date(student.createdAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {student.bio && (
                    <p className="text-sm text-dark-400 mb-3 line-clamp-2">{student.bio}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-dark-500">
                    <span className="flex items-center gap-1"><FiBook size={12} /> {student._count.enrollments} cursos</span>
                    <span className="flex items-center gap-1"><FiCheck size={12} /> {student._count.lessonProgress} lecciones</span>
                    <span className="flex items-center gap-1"><FiAward size={12} /> {student._count.achievements} logros</span>
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
