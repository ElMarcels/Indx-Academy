import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const modules = await prisma.module.findMany({
      where: { courseId: params.courseId },
      include: {
        lessons: {
          select: { id: true, title: true, isFree: true, order: true },
          orderBy: { order: 'asc' },
        },
        quizzes: {
          select: { id: true, title: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ modules });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
