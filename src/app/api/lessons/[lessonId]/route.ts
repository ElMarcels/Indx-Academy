import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.lessonId },
      include: {
        module: {
          include: {
            course: { select: { id: true, title: true, slug: true } },
          },
        },
        files: true,
        quiz: { select: { id: true } },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 });
    }

    // Get all lessons for navigation
    const allLessons = await prisma.lesson.findMany({
      where: {
        module: { courseId: lesson.module.course.id },
      },
      include: {
        module: { select: { order: true } },
      },
      orderBy: [{ module: { order: 'asc' } }, { order: 'asc' }],
    });

    // Check completion
    let completed = false;
    const session = await getServerSession(authOptions);
    if (session) {
      const progress = await prisma.lessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId: (session.user as any).id,
            lessonId: params.lessonId,
          },
        },
      });
      completed = progress?.completed || false;
    }

    return NextResponse.json({ lesson, allLessons, completed });
  } catch (error) {
    return NextResponse.json({ error: 'Error al cargar lección' }, { status: 500 });
  }
}
