import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get('lessonId');
    const courseId = searchParams.get('courseId');

    const where: any = {};
    if (lessonId) where.lessonId = lessonId;
    if (courseId) where.courseId = courseId;
    where.parentId = null; // Only top-level comments

    const comments = await prisma.comment.findMany({
      where,
      include: {
        user: { select: { name: true, image: true } },
        replies: {
          include: { user: { select: { name: true, image: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json({ error: 'Error al cargar comentarios' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { content, lessonId, courseId, parentId } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: (session.user as any).id,
        lessonId: lessonId || null,
        courseId: courseId || null,
        parentId: parentId || null,
      },
      include: { user: { select: { name: true, image: true } } },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear comentario' }, { status: 500 });
  }
}
