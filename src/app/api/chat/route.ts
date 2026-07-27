import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const groupId = req.nextUrl.searchParams.get('groupId');
    const contactId = req.nextUrl.searchParams.get('contactId');
    const search = req.nextUrl.searchParams.get('search');
    const pinned = req.nextUrl.searchParams.get('pinned');
    const filesOnly = req.nextUrl.searchParams.get('files');

    let where: any = {};

    if (groupId) {
      where = { groupId };
    } else if (contactId) {
      where = {
        OR: [
          { senderId: user.id, receiverId: contactId },
          { senderId: contactId, receiverId: user.id },
        ],
      };
    } else {
      where = { groupId: null, receiverId: null };
    }

    if (search) {
      where.content = { contains: search, mode: 'insensitive' };
    }

    if (pinned === 'true') {
      where.isPinned = true;
    }

    if (filesOnly === 'true') {
      where.fileUrl = { not: null };
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: search ? 200 : 100,
    });

    // Update lastSeen
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() },
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        senderId: m.senderId,
        senderName: m.sender.name || 'Anónimo',
        senderImage: m.sender.image,
        fileUrl: m.fileUrl,
        fileName: m.fileName,
        fileType: m.fileType,
        isPinned: m.isPinned,
        createdAt: m.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const { content, groupId, receiverId, fileUrl, fileName, fileType } = await req.json();

    if (!content?.trim() && !fileUrl) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        content: content?.trim() || '',
        senderId: user.id,
        groupId: groupId || null,
        receiverId: receiverId || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() },
    });

    return NextResponse.json({ message });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const { messageId, isPinned } = await req.json();

    if (!messageId) {
      return NextResponse.json({ error: 'messageId requerido' }, { status: 400 });
    }

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
      return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });
    }

    if (message.senderId !== user.id && isPinned === true) {
      if (message.groupId) {
        const membership = await prisma.groupMembership.findFirst({
          where: { userId: user.id, groupId: message.groupId, role: 'ADMIN' },
        });
        if (!membership) {
          return NextResponse.json({ error: 'Solo el admin puede fijar mensajes de otros' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'No puedes fijar mensajes de otros' }, { status: 403 });
      }
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { isPinned: isPinned !== undefined ? isPinned : !message.isPinned },
    });

    return NextResponse.json({ message: updated });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const messageId = req.nextUrl.searchParams.get('messageId');
    if (!messageId) {
      return NextResponse.json({ error: 'messageId requerido' }, { status: 400 });
    }

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
      return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });
    }

    if (message.senderId !== user.id) {
      if (message.groupId) {
        const membership = await prisma.groupMembership.findFirst({
          where: { userId: user.id, groupId: message.groupId, role: 'ADMIN' },
        });
        if (!membership) {
          return NextResponse.json({ error: 'No puedes eliminar mensajes de otros' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'No puedes eliminar mensajes de otros' }, { status: 403 });
      }
    }

    await prisma.message.delete({ where: { id: messageId } });

    return NextResponse.json({ message: 'Mensaje eliminado' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
