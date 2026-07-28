import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const { subject, message } = await req.json();

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Asunto y mensaje son obligatorios' }, { status: 400 });
    }

    if (subject.length > 200) {
      return NextResponse.json({ error: 'El asunto no puede superar los 200 caracteres' }, { status: 400 });
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: 'El mensaje no puede superar los 5000 caracteres' }, { status: 400 });
    }

    const staffMessage = await prisma.staffMessage.create({
      data: {
        userId: user.id,
        subject: subject.trim(),
        message: message.trim(),
      },
    });

    return NextResponse.json({ success: true, id: staffMessage.id });
  } catch (error) {
    return NextResponse.json({ error: 'Error al enviar el mensaje' }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const messages = await prisma.staffMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener mensajes' }, { status: 500 });
  }
}
