import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.lessonId },
      include: {
        module: {
          include: {
            course: { select: { id: true, title: true, slug: true } },
            quizzes: { select: { id: true, title: true } },
          },
        },
        files: true,
        terminalCommands: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 });
    }

    const allLessons = await prisma.lesson.findMany({
      where: { module: { courseId: lesson.module.course.id } },
      include: {
        module: {
          select: { order: true, course: { select: { slug: true } } },
        },
      },
      orderBy: { module: { order: 'asc' } },
    });

    const sortedLessons = allLessons.sort((a, b) => {
      if (a.module.order !== b.module.order) return a.module.order - b.module.order;
      return a.order - b.order;
    });

    let completedLessons: string[] = [];
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (user) {
        const progress = await prisma.lessonProgress.findMany({
          where: {
            userId: user.id,
            completed: true,
            lesson: {
              module: { courseId: lesson.module.course.id },
            },
          },
          select: { lessonId: true },
        });
        completedLessons = progress.map((p) => p.lessonId);
      }
    }

    return NextResponse.json({
      lesson,
      allLessons: sortedLessons,
      completedLessons,
    });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
