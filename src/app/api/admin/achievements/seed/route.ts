import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const defaultAchievements = [
      { name: 'first_enrollment', title: 'Primer Paso', description: 'Inscríbete en tu primer curso', icon: '🎯', category: 'MILESTONE', criteria: '{"type":"enrollments","count":1}', points: 10 },
      { name: 'five_enrollments', title: 'Curioso', description: 'Inscríbete en 5 cursos', icon: '📚', category: 'MILESTONE', criteria: '{"type":"enrollments","count":5}', points: 25 },
      { name: 'first_lesson', title: 'Aprendiz', description: 'Completa tu primera lección', icon: '✨', category: 'MILESTONE', criteria: '{"type":"lessons","count":1}', points: 10 },
      { name: 'ten_lessons', title: 'Dedicado', description: 'Completa 10 lecciones', icon: '🔥', category: 'MILESTONE', criteria: '{"type":"lessons","count":10}', points: 30 },
      { name: 'fifty_lessons', title: 'Maestro', description: 'Completa 50 lecciones', icon: '🏆', category: 'MILESTONE', criteria: '{"type":"lessons","count":50}', points: 100 },
      { name: 'first_quiz', title: 'Evaluado', description: 'Pasa tu primer quiz', icon: '🧠', category: 'QUIZ', criteria: '{"type":"quizzes","count":1}', points: 15 },
      { name: 'five_quizzes', title: 'Genio', description: 'Pasa 5 quizzes', icon: '💡', category: 'QUIZ', criteria: '{"type":"quizzes","count":5}', points: 50 },
      { name: 'first_challenge', title: 'Valiente', description: 'Envía tu primer desafío', icon: '⚔️', category: 'CHALLENGE', criteria: '{"type":"challenges","count":1}', points: 15 },
      { name: 'first_course', title: 'Graduado', description: 'Completa un curso entero', icon: '🎓', category: 'COURSE', criteria: '{"type":"courses","count":1}', points: 50 },
      { name: 'community_chat', title: 'Social', description: 'Envía tu primer mensaje en chat', icon: '💬', category: 'SPECIAL', criteria: '{"type":"messages","count":1}', points: 5 },
      { name: 'group_member', title: 'Colaborador', description: 'Únete a un grupo de estudio', icon: '🤝', category: 'SPECIAL', criteria: '{"type":"groups","count":1}', points: 10 },
      { name: 'night_owl', title: 'Búho Nocturno', description: 'Aprende después de medianoche', icon: '🦉', category: 'SPECIAL', criteria: '{"type":"special","count":1}', points: 5 },
    ];

    for (const ach of defaultAchievements) {
      await prisma.achievement.upsert({
        where: { name: ach.name },
        update: {},
        create: ach,
      });
    }

    return NextResponse.json({ message: 'Logros creados/actualizados', count: defaultAchievements.length });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
