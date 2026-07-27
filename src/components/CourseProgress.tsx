'use client';

import { useMemo } from 'react';
import { FiCheck, FiLock, FiAward, FiBook } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface CourseProgressProps {
  modules: {
    id: string;
    title: string;
    lessons: { id: string; title: string }[];
    quizzes: { id: string; title: string }[];
  }[];
  completedLessons: string[];
  certificates?: { courseId: string }[];
  courseId?: string;
}

export function CourseProgress({ modules, completedLessons, certificates, courseId }: CourseProgressProps) {
  const stats = useMemo(() => {
    let totalLessons = 0;
    let completedCount = 0;
    let totalQuizzes = 0;

    modules.forEach((m) => {
      totalLessons += m.lessons.length;
      totalQuizzes += m.quizzes.length;
      m.lessons.forEach((l) => {
        if (completedLessons.includes(l.id)) completedCount++;
      });
    });

    const totalItems = totalLessons + totalQuizzes;
    const percentage = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
    const hasCertificate = certificates?.some((c) => c.courseId === courseId);

    return { totalLessons, completedCount, totalQuizzes, totalItems, percentage, hasCertificate };
  }, [modules, completedLessons, certificates, courseId]);

  const milestones = [25, 50, 75, 100];

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">Progreso del curso</span>
        <span className="text-sm font-bold text-brand-400">{stats.percentage}%</span>
      </div>

      <div className="relative mb-3">
        <div className="w-full bg-dark-800 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="bg-gradient-to-r from-brand-500 to-accent-500 h-3 rounded-full relative"
          />
        </div>

        <div className="flex justify-between mt-1">
          {milestones.map((m) => (
            <div key={m} className="flex flex-col items-center" style={{ position: 'relative', left: `${m}%`, transform: 'translateX(-50%)' }}>
              <div
                className={`w-2 h-2 rounded-full -mt-[14px] border ${
                  stats.percentage >= m
                    ? 'bg-emerald-400 border-emerald-400'
                    : 'bg-dark-700 border-dark-600'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 mt-4">
        {modules.map((m, mi) => {
          const moduleCompleted = m.lessons.every((l) => completedLessons.includes(l.id));
          const moduleProgress = m.lessons.length > 0
            ? Math.round((m.lessons.filter((l) => completedLessons.includes(l.id)).length / m.lessons.length) * 100)
            : 0;

          return (
            <div key={m.id}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  moduleCompleted ? 'bg-emerald-500/20' : 'bg-dark-800'
                }`}>
                  {moduleCompleted ? (
                    <FiCheck size={10} className="text-emerald-400" />
                  ) : (
                    <span className="text-[10px] text-dark-500">{mi + 1}</span>
                  )}
                </div>
                <span className={`text-xs font-medium ${moduleCompleted ? 'text-emerald-400' : 'text-dark-300'}`}>
                  {m.title}
                </span>
                <span className="text-[10px] text-dark-600 ml-auto">{moduleProgress}%</span>
              </div>

              <div className="ml-7 space-y-1">
                {m.lessons.map((l) => {
                  const done = completedLessons.includes(l.id);
                  return (
                    <div key={l.id} className="flex items-center gap-2 text-xs">
                      <FiBook size={8} className={done ? 'text-emerald-400' : 'text-dark-600'} />
                      <span className={done ? 'text-emerald-400 line-through' : 'text-dark-500'}>{l.title}</span>
                    </div>
                  );
                })}
                {m.quizzes.map((q) => (
                  <div key={q.id} className="flex items-center gap-2 text-xs">
                    <FiAward size={8} className="text-dark-600" />
                    <span className="text-dark-500">{q.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {stats.hasCertificate && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
          <FiAward size={16} className="text-emerald-400" />
          <span className="text-xs text-emerald-400 font-medium">¡Curso completado! Certificado disponible</span>
        </div>
      )}
    </div>
  );
}
