import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { pathId: string } }) {
  try {
    const path = await prisma.learningPath.findUnique({
      where: { id: params.pathId },
      include: {
        courses: {
          include: { course: { include: { _count: { select: { enrollments: true } } } } },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!path) {
      return NextResponse.json({ error: 'Ruta no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ path });
  } catch {
    return NextResponse.json({ error: 'Error al cargar ruta' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { pathId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, level, courses } = body;

    if (courses) {
      await prisma.learningPathCourse.deleteMany({ where: { pathId: params.pathId } });
      if (courses.length > 0) {
        await prisma.learningPathCourse.createMany({
          data: courses.map((c: any) => ({ pathId: params.pathId, courseId: c.courseId, order: c.order })),
        });
      }
    }

    const path = await prisma.learningPath.update({
      where: { id: params.pathId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(level !== undefined && { level }),
      },
      include: {
        courses: {
          include: { course: { include: { _count: { select: { enrollments: true } } } } },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({ path });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar ruta' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { pathId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.learningPath.delete({ where: { id: params.pathId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar ruta' }, { status: 500 });
  }
}
