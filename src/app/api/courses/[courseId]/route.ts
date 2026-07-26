import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const course = await prisma.course.findUnique({
      where: { slug: params.courseId },
      include: {
        author: { select: { name: true, image: true, email: true } },
        modules: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                description: true,
                content: true,
                task: true,
                order: true,
                isFree: true,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    return NextResponse.json({ error: 'Error al cargar curso' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();

    const course = await prisma.course.update({
      where: { id: params.courseId },
      data: body,
    });

    return NextResponse.json(course);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar curso' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.course.delete({
      where: { id: params.courseId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar curso' }, { status: 500 });
  }
}
