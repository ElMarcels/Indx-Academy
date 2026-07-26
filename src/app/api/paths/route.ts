import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const paths = await prisma.learningPath.findMany({
      include: {
        courses: {
          include: {
            course: {
              include: { _count: { select: { enrollments: true } } },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ paths });
  } catch {
    return NextResponse.json({ error: 'Error al cargar rutas' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, level, courses } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Título es requerido' }, { status: 400 });
    }

    const path = await prisma.learningPath.create({
      data: {
        title: title.trim(),
        description: description || null,
        level: level || 'BEGINNER',
        courses: courses
          ? { create: courses.map((c: any) => ({ courseId: c.courseId, order: c.order })) }
          : undefined,
      },
      include: {
        courses: {
          include: { course: { include: { _count: { select: { enrollments: true } } } } },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({ path }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear ruta' }, { status: 500 });
  }
}
