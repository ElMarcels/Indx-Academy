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

    const userId = (session.user as any).id;

    const [notifications, unreadCount] = await Promise.all([
      prisma.userNotification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.userNotification.count({
        where: { userId, read: false },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch {
    return NextResponse.json({ error: 'Error al cargar notificaciones' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, title, message, type, link } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ error: 'userId, título y mensaje son requeridos' }, { status: 400 });
    }

    const notification = await prisma.userNotification.create({
      data: {
        userId,
        title,
        message,
        type: type || 'INFO',
        link: link || null,
      },
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear notificación' }, { status: 500 });
  }
}
