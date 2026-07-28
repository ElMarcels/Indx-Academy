import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: user.id },
      include: {
        _count: { select: { messages: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ tickets });
  } catch {
    return NextResponse.json({ error: 'Error al obtener tickets' }, { status: 500 });
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
    const { subject, message, priority } = await req.json();

    if (!subject?.trim()) {
      return NextResponse.json({ error: 'El asunto es obligatorio' }, { status: 400 });
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'El mensaje es obligatorio' }, { status: 400 });
    }

    if (subject.length > 200) {
      return NextResponse.json({ error: 'El asunto no puede superar los 200 caracteres' }, { status: 400 });
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: 'El mensaje no puede superar los 5000 caracteres' }, { status: 400 });
    }

    const validPriority = ['LOW', 'MEDIUM', 'HIGH'].includes(priority) ? priority : 'MEDIUM';

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject: subject.trim(),
        priority: validPriority,
        messages: {
          create: {
            senderId: user.id,
            content: message.trim(),
          },
        },
      },
      include: { messages: true },
    });

    return NextResponse.json({ success: true, ticket });
  } catch {
    return NextResponse.json({ error: 'Error al crear el ticket' }, { status: 500 });
  }
}
