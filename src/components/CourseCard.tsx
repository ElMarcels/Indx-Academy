'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiClock, FiBarChart2, FiUsers, FiFileText, FiStar } from 'react-icons/fi';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnail: string | null;
    level: string;
    duration: string | null;
    category: string | null;
    author: { name: string | null };
    modules?: { lessons: { id: string }[] }[];
    _count?: { enrollments: number };
  };
  enrolled?: boolean;
  index?: number;
}

const levelLabels: Record<string, string> = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
};

const levelColors: Record<string, string> = {
  BEGINNER: 'badge-green',
  INTERMEDIATE: 'badge-blue',
  ADVANCED: 'badge-purple',
};

export function CourseCard({ course, enrolled, index = 0 }: CourseCardProps) {
  const totalLessons = course.modules?.reduce((acc, m) => acc + m.lessons.length, 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={`/cursos/${course.slug}`} className="group block h-full">
        <div className="card-hover h-full flex flex-col">
          <div className="relative aspect-video bg-dark-800 overflow-hidden">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-600/20 via-accent-600/10 to-emerald-600/20">
                <motion.span 
                  className="text-4xl font-bold text-brand-600/30"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  Ix
                </motion.span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950/60 via-transparent to-transparent" />
            
            {course.category && (
              <div className="absolute top-3 left-3">
                <span className="badge-blue text-[11px] backdrop-blur-sm">{course.category}</span>
              </div>
            )}
            {enrolled && (
              <div className="absolute top-3 right-3">
                <span className="badge-green text-[11px] backdrop-blur-sm flex items-center gap-1">
                  <FiStar size={10} /> Inscrito
                </span>
              </div>
            )}
            <div className="absolute bottom-3 right-3">
              <span className="badge-free text-[11px] backdrop-blur-sm">100% Gratis</span>
            </div>
          </div>

          <div className="p-5 flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={levelColors[course.level] || 'badge-blue'}>
                {levelLabels[course.level] || course.level}
              </span>
            </div>

            <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-brand-400 transition-colors line-clamp-2">
              {course.title}
            </h3>

            <p className="text-dark-400 text-sm line-clamp-2 mb-4 flex-1">
              {course.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-dark-500">
              {course.duration && (
                <span className="flex items-center gap-1">
                  <FiClock size={12} />
                  {course.duration}
                </span>
              )}
              {totalLessons > 0 && (
                <span className="flex items-center gap-1">
                  <FiFileText size={12} />
                  {totalLessons} lecciones
                </span>
              )}
              {course._count?.enrollments !== undefined && (
                <span className="flex items-center gap-1">
                  <FiUsers size={12} />
                  {course._count.enrollments}
                </span>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-dark-800/50 flex items-center justify-between">
              <span className="text-sm text-dark-400">
                por <span className="text-dark-200">{course.author.name || 'Indx'}</span>
              </span>
              <span className="text-emerald-400 font-bold text-sm flex items-center gap-1">
                <FiStar size={12} /> Gratis
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
