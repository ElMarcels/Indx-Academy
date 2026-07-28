import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { ticketId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.ticketId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        messages: {
          include: {
            sender: { select: { id: true, name: true, email: true, image: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch {
    return NextResponse.json({ error: 'Error al obtener el ticket' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { ticketId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { status } = await req.json();

    if (!status || !['OPEN', 'CLOSED'].includes(status)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: params.ticketId },
      data: { status },
    });

    return NextResponse.json({ ticket });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar el ticket' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { ticketId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    await prisma.supportTicket.delete({ where: { id: params.ticketId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar el ticket' }, { status: 500 });
  }
}
