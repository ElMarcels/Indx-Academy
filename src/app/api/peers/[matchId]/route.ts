import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const match = await prisma.peerMatch.findUnique({
      where: { id: params.matchId },
    });

    if (!match) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    if (match.peerId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { status } = await req.json();

    if (status !== 'ACCEPTED' && status !== 'REJECTED') {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const updated = await prisma.peerMatch.update({
      where: { id: params.matchId },
      data: { status },
    });

    return NextResponse.json({ match: updated });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
