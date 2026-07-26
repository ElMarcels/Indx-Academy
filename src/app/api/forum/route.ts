import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const search = searchParams.get('search') || '';

    if (!courseId) {
      return NextResponse.json({ error: 'courseId requerido' }, { status: 400 });
    }

    const where: any = { courseId };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const posts = await prisma.forumPost.findMany({
      where,
      include: {
        user: { select: { name: true, image: true } },
        _count: { select: { replies: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json({ error: 'Error al cargar foro' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, courseId } = body;

    if (!title?.trim() || !content?.trim() || !courseId) {
      return NextResponse.json({ error: 'Título, contenido y courseId son requeridos' }, { status: 400 });
    }

    const post = await prisma.forumPost.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        courseId,
        userId: (session.user as any).id,
      },
      include: { user: { select: { name: true, image: true } } },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear publicación' }, { status: 500 });
  }
}
