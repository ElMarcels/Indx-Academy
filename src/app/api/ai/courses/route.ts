import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        slug: true,
      },
      orderBy: { title: 'asc' },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('List AI courses error:', error);
    return NextResponse.json({ error: 'Error al cargar cursos' }, { status: 500 });
  }
}
