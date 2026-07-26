'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Forum } from '@/components/Forum';
import { FiArrowLeft, FiMessageSquare } from 'react-icons/fi';

interface CourseInfo {
  id: string;
  title: string;
  slug: string;
}

export default function ForoPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${courseId}`);
        if (res.ok) {
          const data = await res.json();
          setCourse(data);
        } else {
          router.push('/cursos');
        }
      } catch {
        router.push('/cursos');
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [courseId, router]);

  if (loading) {
    return (
      <div className="py-12 section">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-dark-800 rounded w-24" />
          <div className="h-8 bg-dark-800 rounded w-1/3" />
          <div className="h-96 bg-dark-800 rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="section max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            href={`/cursos/${course?.slug || courseId}`}
            className="flex items-center gap-2 text-dark-400 hover:text-white text-sm mb-4 transition-colors"
          >
            <FiArrowLeft size={16} /> Volver al curso
          </Link>

          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-brand-500/15 rounded-xl">
                <FiMessageSquare size={20} className="text-brand-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Foro</h1>
            </div>
            {course && (
              <p className="text-dark-400 ml-[52px]">
                Discusiones del curso <span className="text-white font-medium">{course.title}</span>
              </p>
            )}
          </div>

          <Forum courseId={courseId} />
        </motion.div>
      </div>
    </div>
  );
}
