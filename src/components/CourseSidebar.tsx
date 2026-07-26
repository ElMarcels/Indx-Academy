'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiChevronDown,
  FiChevronRight,
  FiCheckCircle,
  FiCircle,
  FiLock,
  FiClipboard,
  FiX,
  FiMenu,
} from 'react-icons/fi';

interface CourseSidebarProps {
  courseTitle: string;
  courseSlug: string;
  currentLessonId: string;
  modules: {
    id: string;
    title: string;
    order: number;
    lessons: { id: string; title: string; isFree: boolean; order: number }[];
    quizzes: { id: string; title: string }[];
  }[];
  completedLessons: string[];
  isOpen: boolean;
  onToggle: () => void;
}

export function CourseSidebar({
  courseTitle,
  courseSlug,
  currentLessonId,
  modules,
  completedLessons,
  isOpen,
  onToggle,
}: CourseSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedCount = completedLessons.length;
  const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isMobile && isOpen) {
      const currentModule = sortedModules.find((m) =>
        m.lessons.some((l) => l.id === currentLessonId)
      );
      if (currentModule) {
        setExpandedModules((prev) => new Set([...prev, currentModule.id]));
      }
    }
  }, [currentLessonId, isMobile, isOpen, sortedModules]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-dark-900/95 backdrop-blur-xl border-r border-dark-800/50">
      <div className="p-4 border-b border-dark-800/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white truncate pr-2">{courseTitle}</h2>
          <button
            onClick={onToggle}
            className="text-dark-400 hover:text-white transition-colors shrink-0"
          >
            {isMobile ? <FiX size={18} /> : <FiChevronRight size={18} />}
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-400">
              {completedCount} de {totalLessons} lecciones
            </span>
            <span className="font-semibold gradient-text">{percentage}%</span>
          </div>
          <div className="w-full h-2 bg-dark-800/80 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-600 via-accent-500 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {sortedModules.map((mod) => {
          const isExpanded = expandedModules.has(mod.id);
          const moduleLessons = mod.lessons.length;
          const moduleCompleted = mod.lessons.filter((l) =>
            completedLessons.includes(l.id)
          ).length;

          return (
            <div key={mod.id} className="border-b border-dark-800/30">
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-dark-800/50 transition-colors group"
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                  className="text-dark-500 group-hover:text-dark-300 shrink-0"
                >
                  <FiChevronDown size={16} />
                </motion.div>
                <span className="text-sm font-medium text-dark-200 group-hover:text-white transition-colors flex-1 truncate">
                  {mod.title}
                </span>
                <span className="text-[11px] text-dark-500 bg-dark-800/80 px-2 py-0.5 rounded-full shrink-0">
                  {moduleCompleted}/{moduleLessons}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pb-2">
                      {mod.lessons
                        .sort((a, b) => a.order - b.order)
                        .map((lesson) => {
                          const isCompleted = completedLessons.includes(lesson.id);
                          const isCurrent = lesson.id === currentLessonId;

                          return (
                            <Link
                              key={lesson.id}
                              href={`/cursos/${courseSlug}/leccion/${lesson.id}`}
                              className={`flex items-center gap-3 px-4 py-2 ml-4 text-sm transition-colors group ${
                                isCurrent
                                  ? 'bg-brand-600/15 border-r-2 border-brand-500 text-white'
                                  : 'hover:bg-dark-800/30 text-dark-300 hover:text-dark-100'
                              }`}
                            >
                              {isCompleted ? (
                                <FiCheckCircle
                                  size={16}
                                  className="text-emerald-400 shrink-0"
                                />
                              ) : (
                                <FiCircle size={16} className="text-dark-600 shrink-0" />
                              )}
                              <span className={`flex-1 truncate ${isCurrent ? 'font-medium' : ''}`}>
                                {lesson.title}
                              </span>
                              {!lesson.isFree && (
                                <FiLock size={12} className="text-dark-600 shrink-0" />
                              )}
                            </Link>
                          );
                        })}

                      {mod.quizzes.map((quiz) => (
                        <Link
                          key={quiz.id}
                          href={`/cursos/${courseSlug}/quiz/${quiz.id}`}
                          className="flex items-center gap-3 px-4 py-2 ml-4 text-sm text-dark-400 hover:text-accent-400 hover:bg-dark-800/30 transition-colors group"
                        >
                          <FiClipboard size={16} className="text-dark-600 group-hover:text-accent-400 shrink-0" />
                          <span className="flex-1 truncate">{quiz.title}</span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {!isMobile && (
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="sticky top-0 h-screen overflow-hidden shrink-0 z-30"
            >
              {sidebarContent}
            </motion.aside>
          )}
        </AnimatePresence>
      )}

      {!isMobile && !isOpen && (
        <button
          onClick={onToggle}
          className="fixed left-4 top-20 z-40 p-2.5 bg-dark-900/90 border border-dark-800/50 rounded-xl text-dark-400 hover:text-white hover:border-brand-500/30 transition-all backdrop-blur-sm"
        >
          <FiMenu size={18} />
        </button>
      )}

      {isMobile && (
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={onToggle}
              />
              <motion.aside
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="fixed inset-y-0 left-0 w-80 z-50"
              >
                {sidebarContent}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
