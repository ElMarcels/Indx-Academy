import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (courseId) {
      // Get progress for specific course
      const progress = await prisma.lessonProgress.findMany({
        where: {
          userId: (session.user as any).id,
          lesson: {
            module: { courseId },
          },
        },
        select: {
          lessonId: true,
          completed: true,
        },
      });

      return NextResponse.json(progress);
    }

    // Get all progress
    const allProgress = await prisma.lessonProgress.findMany({
      where: { userId: (session.user as any).id },
      select: {
        lessonId: true,
        completed: true,
      },
    });

    return NextResponse.json(allProgress);
  } catch (error) {
    return NextResponse.json({ error: 'Error al cargar progreso' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { lessonId, completed } = await req.json();

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId es requerido' }, { status: 400 });
    }

    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: (session.user as any).id,
          lessonId,
        },
      },
      update: {
        completed: completed ?? true,
        completedAt: completed !== false ? new Date() : null,
      },
      create: {
        userId: (session.user as any).id,
        lessonId,
        completed: completed ?? true,
        completedAt: completed !== false ? new Date() : null,
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    return NextResponse.json({ error: 'Error al guardar progreso' }, { status: 500 });
  }
}
