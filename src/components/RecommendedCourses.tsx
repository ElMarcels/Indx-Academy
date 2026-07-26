'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiUsers, FiStar } from 'react-icons/fi';

interface RecommendedCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  level: string;
  category: string | null;
  _count?: { enrollments: number };
}

interface RecommendedCoursesProps {
  enrolledCourseIds: string[];
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

export function RecommendedCourses({ enrolledCourseIds }: RecommendedCoursesProps) {
  const [courses, setCourses] = useState<RecommendedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    fetchRecommended();
  }, [enrolledCourseIds]);

  const fetchRecommended = async () => {
    try {
      const params = new URLSearchParams();
      if (enrolledCourseIds.length > 0) {
        params.set('enrolledIds', enrolledCourseIds.join(','));
      }
      const res = await fetch(`/api/courses/recommended?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [courses]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="shimmer h-8 w-64 rounded-lg" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer h-64 w-72 rounded-2xl shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (courses.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-500/15 rounded-xl">
            <FiStar size={20} className="text-brand-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Recomendados para ti</h2>
            <p className="text-sm text-dark-400">
              {enrolledCourseIds.length > 0
                ? 'Basado en tus cursos inscritos'
                : 'Cursos populares para comenzar'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="p-2 rounded-lg bg-dark-800/80 border border-dark-700/50 text-dark-400 hover:text-white hover:border-dark-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FiChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="p-2 rounded-lg bg-dark-800/80 border border-dark-700/50 text-dark-400 hover:text-white hover:border-dark-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FiChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {courses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="shrink-0 w-72"
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
                      <span className="text-3xl font-bold text-brand-600/30">Ix</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950/60 via-transparent to-transparent" />

                  {course.category && (
                    <div className="absolute top-3 left-3">
                      <span className="badge-blue text-[11px] backdrop-blur-sm">
                        {course.category}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={levelColors[course.level] || 'badge-blue'}>
                      {levelLabels[course.level] || course.level}
                    </span>
                  </div>

                  <h3 className="text-white font-semibold text-sm mb-1.5 group-hover:text-brand-400 transition-colors line-clamp-2">
                    {course.title}
                  </h3>

                  <p className="text-dark-500 text-xs line-clamp-2 mb-3 flex-1">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-dark-500">
                    {course._count?.enrollments !== undefined && (
                      <span className="flex items-center gap-1">
                        <FiUsers size={12} />
                        {course._count.enrollments}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
