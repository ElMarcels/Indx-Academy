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

    const userId = (session.user as any).id;

    const conversations = await prisma.aIConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        _count: { select: { messages: true } },
      },
    });

    const courseIds = [...new Set(conversations.map(c => c.courseId).filter(Boolean))] as string[];
    const courses = courseIds.length
      ? await prisma.course.findMany({ where: { id: { in: courseIds } }, select: { id: true, title: true, slug: true } })
      : [];
    const courseMap = new Map(courses.map(c => [c.id, c]));

    const enriched = conversations.map(c => ({
      ...c,
      course: c.courseId ? courseMap.get(c.courseId) ?? null : null,
    }));

    return NextResponse.json({ conversations: enriched });
  } catch (error) {
    console.error('List conversations error:', error);
    return NextResponse.json({ error: 'Error al cargar conversaciones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { courseId, title } = body;

    const conversation = await prisma.aIConversation.create({
      data: {
        userId,
        courseId: courseId || null,
        title: title || 'Nueva conversación',
      },
    });

    let course = null;
    if (conversation.courseId) {
      course = await prisma.course.findUnique({
        where: { id: conversation.courseId },
        select: { id: true, title: true, slug: true },
      });
    }

    return NextResponse.json({ conversation: { ...conversation, course } }, { status: 201 });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: 'Error al crear conversación' }, { status: 500 });
  }
}
