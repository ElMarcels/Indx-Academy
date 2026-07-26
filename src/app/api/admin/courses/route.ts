import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const courses = await prisma.course.findMany({
      include: {
        _count: { select: { enrollments: true } },
        modules: { include: { lessons: { select: { id: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(courses);
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
