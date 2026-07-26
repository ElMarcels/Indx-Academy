'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Locale = 'es' | 'en';

const translations: Record<Locale, Record<string, string>> = {
  es: {
    nav_home: 'Inicio',
    nav_courses: 'Cursos',
    nav_dashboard: 'Mi Aprendizaje',
    nav_admin: 'Admin',
    nav_login: 'Iniciar Sesión',
    nav_register: 'Registrarse',
    nav_logout: 'Cerrar Sesión',
    nav_profile: 'Mi Perfil',
    nav_groups: 'Grupos',
    nav_chat: 'Chat',
    nav_theme_light: 'Modo Claro',
    nav_theme_dark: 'Modo Oscuro',
    home_hero_title: 'Aprende a Programar Gratis',
    home_hero_subtitle: 'Accede a cursos completos de programación sin coste alguno.',
    home_cta: 'Explorar Cursos',
    home_stats_courses: 'Cursos',
    home_stats_students: 'Estudiantes',
    home_stats_lessons: 'Lecciones',
    courses_title: 'Catálogo de Cursos',
    courses_empty: 'No hay cursos disponibles aún.',
    dashboard_title: 'Mi Aprendizaje',
    dashboard_enrolled: 'Cursos Inscritos',
    dashboard_progress: 'Progreso',
    dashboard_achievements: 'Logros',
    dashboard_no_courses: 'Aún no estás inscrito en ningún curso.',
    dashboard_continue: 'Continuar',
    course_enroll: 'Inscribirse Gratis',
    course_enrolled: 'Inscrito',
    course_modules: 'Módulos',
    course_lessons: 'lecciones',
    lesson_complete: 'Completar',
    lesson_completed: 'Completada',
    lesson_content: 'Contenido',
    lesson_task: 'Tarea',
    lesson_files: 'Archivos Adjuntos',
    lesson_next: 'Siguiente',
    lesson_prev: 'Anterior',
    quiz_title: 'Quiz',
    quiz_submit: 'Enviar',
    quiz_retry: 'Reintentar',
    quiz_pass: '¡Aprobaste!',
    quiz_fail: 'No aprobado',
    challenge_title: 'Desafíos',
    challenge_submit: 'Enviar solución',
    chat_title: 'Chat',
    chat_placeholder: 'Escribe un mensaje...',
    chat_send: 'Enviar',
    groups_title: 'Grupos de Estudio',
    groups_create: 'Crear Grupo',
    groups_join: 'Unirse',
    groups_members: 'miembros',
    profile_title: 'Perfil del Estudiante',
    profile_bio: 'Biografía',
    profile_achievements: 'Logros',
    profile_courses: 'Cursos Completados',
    admin_stats: 'Estadísticas',
    admin_users: 'Usuarios',
    admin_courses: 'Cursos',
    admin_enrollments: 'Inscripciones',
    admin_analytics: 'Analíticas',
    admin_recent_users: 'Usuarios Recientes',
    admin_recent_enrollments: 'Inscripciones Recientes',
    admin_manage: 'Gestionar Cursos',
    admin_new_course: 'Nuevo Curso',
    common_loading: 'Cargando...',
    common_error: 'Error',
    common_save: 'Guardar',
    common_cancel: 'Cancelar',
    common_delete: 'Eliminar',
    common_edit: 'Editar',
    common_search: 'Buscar...',
    common_free: 'Gratis',
    common_all: 'Todos',
    common_save_changes: 'Guardar Cambios',
  },
  en: {
    nav_home: 'Home',
    nav_courses: 'Courses',
    nav_dashboard: 'My Learning',
    nav_admin: 'Admin',
    nav_login: 'Sign In',
    nav_register: 'Sign Up',
    nav_logout: 'Sign Out',
    nav_profile: 'My Profile',
    nav_groups: 'Groups',
    nav_chat: 'Chat',
    nav_theme_light: 'Light Mode',
    nav_theme_dark: 'Dark Mode',
    home_hero_title: 'Learn to Code for Free',
    home_hero_subtitle: 'Access complete programming courses at no cost.',
    home_cta: 'Explore Courses',
    home_stats_courses: 'Courses',
    home_stats_students: 'Students',
    home_stats_lessons: 'Lessons',
    courses_title: 'Course Catalog',
    courses_empty: 'No courses available yet.',
    dashboard_title: 'My Learning',
    dashboard_enrolled: 'Enrolled Courses',
    dashboard_progress: 'Progress',
    dashboard_achievements: 'Achievements',
    dashboard_no_courses: 'You are not enrolled in any course yet.',
    dashboard_continue: 'Continue',
    course_enroll: 'Enroll for Free',
    course_enrolled: 'Enrolled',
    course_modules: 'Modules',
    course_lessons: 'lessons',
    lesson_complete: 'Complete',
    lesson_completed: 'Completed',
    lesson_content: 'Content',
    lesson_task: 'Task',
    lesson_files: 'Attached Files',
    lesson_next: 'Next',
    lesson_prev: 'Previous',
    quiz_title: 'Quiz',
    quiz_submit: 'Submit',
    quiz_retry: 'Retry',
    quiz_pass: 'Passed!',
    quiz_fail: 'Not Passed',
    challenge_title: 'Challenges',
    challenge_submit: 'Submit Solution',
    chat_title: 'Chat',
    chat_placeholder: 'Type a message...',
    chat_send: 'Send',
    groups_title: 'Study Groups',
    groups_create: 'Create Group',
    groups_join: 'Join',
    groups_members: 'members',
    profile_title: 'Student Profile',
    profile_bio: 'Bio',
    profile_achievements: 'Achievements',
    profile_courses: 'Completed Courses',
    admin_stats: 'Statistics',
    admin_users: 'Users',
    admin_courses: 'Courses',
    admin_enrollments: 'Enrollments',
    admin_analytics: 'Analytics',
    admin_recent_users: 'Recent Users',
    admin_recent_enrollments: 'Recent Enrollments',
    admin_manage: 'Manage Courses',
    admin_new_course: 'New Course',
    common_loading: 'Loading...',
    common_error: 'Error',
    common_save: 'Save',
    common_cancel: 'Cancel',
    common_delete: 'Delete',
    common_edit: 'Edit',
    common_search: 'Search...',
    common_free: 'Free',
    common_all: 'All',
    common_save_changes: 'Save Changes',
  },
};

const I18nContext = createContext<{
  locale: Locale;
  t: (key: string) => string;
  toggleLocale: () => void;
}>({ locale: 'es', t: (k) => k, toggleLocale: () => {} });

export function useI18n() {
  return useContext(I18nContext);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('es');

  function t(key: string): string {
    return translations[locale][key] || key;
  }

  function toggleLocale() {
    setLocale((prev) => (prev === 'es' ? 'en' : 'es'));
  }

  return (
    <I18nContext.Provider value={{ locale, t, toggleLocale }}>
      {children}
    </I18nContext.Provider>
  );
}
