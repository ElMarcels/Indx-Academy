import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { postId, content } = body;

    if (!postId || !content?.trim()) {
      return NextResponse.json({ error: 'postId y contenido son requeridos' }, { status: 400 });
    }

    const reply = await prisma.forumReply.create({
      data: {
        content: content.trim(),
        postId,
        userId: (session.user as any).id,
      },
      include: { user: { select: { name: true, image: true } } },
    });

    return NextResponse.json({ reply }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear respuesta' }, { status: 500 });
  }
}
