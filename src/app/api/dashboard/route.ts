import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: (session.user as any).id },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: { select: { id: true } },
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    const progressMap: Record<string, { completed: number; total: number }> = {};

    for (const enrollment of enrollments) {
      const totalLessons = enrollment.course.modules.reduce(
        (acc, m) => acc + m.lessons.length, 0
      );

      const completedLessons = await prisma.lessonProgress.count({
        where: {
          userId: (session.user as any).id,
          completed: true,
          lesson: {
            module: { courseId: enrollment.course.id },
          },
        },
      });

      progressMap[enrollment.course.id] = {
        completed: completedLessons,
        total: totalLessons,
      };
    }

    return NextResponse.json({ enrollments, progressMap });
  } catch (error) {
    return NextResponse.json({ error: 'Error al cargar dashboard' }, { status: 500 });
  }
}
