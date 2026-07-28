import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { ticketId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: params.ticketId } });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    if (ticket.userId !== user.id && (user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (ticket.status === 'CLOSED') {
      return NextResponse.json({ error: 'Este ticket está cerrado' }, { status: 400 });
    }

    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'El mensaje es obligatorio' }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: 'El mensaje no puede superar los 5000 caracteres' }, { status: 400 });
    }

    const message = await prisma.supportTicketMessage.create({
      data: {
        ticketId: params.ticketId,
        senderId: user.id,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, name: true, email: true, image: true, role: true } },
      },
    });

    await prisma.supportTicket.update({
      where: { id: params.ticketId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, message });
  } catch {
    return NextResponse.json({ error: 'Error al enviar el mensaje' }, { status: 500 });
  }
}
