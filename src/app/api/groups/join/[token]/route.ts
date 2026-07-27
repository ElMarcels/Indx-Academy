import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const invite = await prisma.groupInvite.findUnique({
      where: { token: params.token },
      include: { group: true },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Enlace inválido' }, { status: 404 });
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Enlace expirado' }, { status: 400 });
    }

    if (invite.maxUses && invite.useCount >= invite.maxUses) {
      return NextResponse.json({ error: 'Enlace agotado' }, { status: 400 });
    }

    const existing = await prisma.groupMembership.findFirst({
      where: { userId: user.id, groupId: invite.groupId },
    });

    if (!existing) {
      await prisma.groupMembership.create({
        data: { userId: user.id, groupId: invite.groupId, role: 'MEMBER' },
      });
    }

    await prisma.groupInvite.update({
      where: { id: invite.id },
      data: { useCount: { increment: 1 } },
    });

    return NextResponse.json({ message: 'Te has unido al grupo', group: invite.group });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
