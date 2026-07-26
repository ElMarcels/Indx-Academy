import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const challenges = await prisma.challenge.findMany({
      where: { courseId: params.courseId },
      orderBy: { createdAt: 'asc' },
      include: {
        submissions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            content: true,
            feedback: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ challenges });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
