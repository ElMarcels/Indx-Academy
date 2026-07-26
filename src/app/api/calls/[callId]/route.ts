import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { callId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const call = await prisma.callSession.findUnique({
      where: { id: params.callId },
    });

    if (!call) {
      return NextResponse.json({ error: 'Llamada no encontrada' }, { status: 404 });
    }

    if (call.callerId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { status } = await req.json();

    const updated = await prisma.callSession.update({
      where: { id: params.callId },
      data: {
        status: status || 'ENDED',
        endedAt: new Date(),
      },
    });

    return NextResponse.json({ call: updated });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
