import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json({ error: 'courseId es requerido' }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    // Check if already enrolled
    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: (session.user as any).id,
          courseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: 'Ya estás inscrito' });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: (session.user as any).id,
        courseId,
      },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al inscribirse' }, { status: 500 });
  }
}
