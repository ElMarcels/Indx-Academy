'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { CourseCard } from '@/components/CourseCard';
import { CourseFilters } from '@/components/CourseFilters';
import { FiBook } from 'react-icons/fi';

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

export default function CursosPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [categories, setCategories] = useState<string[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCourses = useCallback(async (q: string, l: string, c: string, s: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (l) params.set('level', l);
      if (c) params.set('category', c);
      if (s && s !== 'newest') params.set('sort', s);

      const res = await fetch(`/api/courses?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses(query, level, category, sort);
  }, [fetchCourses, level, category, sort]);

  useEffect(() => {
    const res = fetch('/api/courses');
    res.then((r) => r.json()).then((data: Course[]) => {
      const cats = [...new Set(data.map((c) => c.category).filter(Boolean))] as string[];
      setCategories(cats.sort());
    });
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCourses(value, level, category, sort);
    }, 300);
  }

  function handleClear() {
    setQuery('');
    setLevel('');
    setCategory('');
    setSort('newest');
    fetchCourses('', '', '', 'newest');
  }

  return (
    <div className="py-12">
      <div className="section">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Cursos</h1>
          <p className="text-dark-400">
            Explora nuestros cursos de programación. Todos 100% gratuitos.
          </p>
        </motion.div>

        <CourseFilters
          query={query}
          level={level}
          category={category}
          sort={sort}
          categories={categories}
          onQueryChange={handleQueryChange}
          onLevelChange={setLevel}
          onCategoryChange={setCategory}
          onSortChange={setSort}
          onClear={handleClear}
          resultCount={courses.length}
        />

        <div className="mt-6">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-dark-800 rounded-2xl animate-pulse shimmer" />
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, i) => (
                <CourseCard key={course.id} course={course} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-dark-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiBook className="text-dark-500" size={28} />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No se encontraron cursos</h2>
              <p className="text-dark-400 mb-6">Intenta con otros filtros o términos de búsqueda.</p>
              <button onClick={handleClear} className="btn-primary">
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
