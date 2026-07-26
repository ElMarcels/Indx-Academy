import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const certificates = await prisma.certificate.findMany({
      where: { userId: (session.user as any).id },
      include: { course: { select: { title: true, slug: true } } },
      orderBy: { completedAt: 'desc' },
    });

    return NextResponse.json({ certificates });
  } catch {
    return NextResponse.json({ error: 'Error al cargar certificados' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { courseId } = await req.json();
    const userId = (session.user as any).id;

    if (!courseId) {
      return NextResponse.json({ error: 'courseId requerido' }, { status: 400 });
    }

    const existing = await prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) {
      return NextResponse.json({ certificate: existing });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: { include: { lessons: { select: { id: true } } } } },
    });
    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    if (totalLessons === 0) {
      return NextResponse.json({ error: 'El curso no tiene lecciones' }, { status: 400 });
    }

    const completedCount = await prisma.lessonProgress.count({
      where: {
        userId,
        completed: true,
        lesson: { module: { courseId } },
      },
    });

    if (completedCount < totalLessons) {
      return NextResponse.json(
        { error: `Debes completar todas las lecciones (${completedCount}/${totalLessons})` },
        { status: 400 }
      );
    }

    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const certificateNumber = `INDX-${year}-${random}`;

    const certificate = await prisma.certificate.create({
      data: { userId, courseId, certificateNumber },
      include: { course: { select: { title: true, slug: true } } },
    });

    return NextResponse.json({ certificate }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al generar certificado' }, { status: 500 });
  }
}
