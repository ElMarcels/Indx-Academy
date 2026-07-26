import { NextRequest, NextResponse } from 'next/server';
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

    return NextResponse.json({
      lesson,
      allLessons: sortedLessons,
      completed: false,
    });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
