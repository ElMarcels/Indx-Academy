import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { ticketId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

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

    if (ticket.userId !== user.id && (user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json({ ticket });
  } catch {
    return NextResponse.json({ error: 'Error al obtener el ticket' }, { status: 500 });
  }
}
