import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { conversationId } = params;

    const conversation = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
    }

    let course = null;
    if (conversation.courseId) {
      course = await prisma.course.findUnique({
        where: { id: conversation.courseId },
        select: { id: true, title: true, slug: true },
      });
    }

    return NextResponse.json({ conversation: { ...conversation, course } });
  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json({ error: 'Error al cargar conversación' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { conversationId } = params;

    const conversation = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
    }

    await prisma.aIMessage.deleteMany({
      where: { conversationId },
    });

    await prisma.aIConversation.delete({
      where: { id: conversationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json({ error: 'Error al eliminar conversación' }, { status: 500 });
  }
}
