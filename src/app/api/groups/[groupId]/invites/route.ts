import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const membership = await prisma.groupMembership.findFirst({
      where: { userId: user.id, groupId: params.groupId },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No eres miembro de este grupo' }, { status: 403 });
    }

    const { expiresInHours, maxUses } = await req.json();

    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = expiresInHours
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const invite = await prisma.groupInvite.create({
      data: {
        groupId: params.groupId,
        token,
        createdById: user.id,
        expiresAt,
        maxUses: maxUses || null,
      },
    });

    return NextResponse.json({
      invite: {
        id: invite.id,
        token: invite.token,
        expiresAt: invite.expiresAt,
        maxUses: invite.maxUses,
        url: `/grupos?join=${invite.token}`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const invites = await prisma.groupInvite.findMany({
      where: {
        groupId: params.groupId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      invites: invites.map((i) => ({
        id: i.id,
        token: i.token,
        expiresAt: i.expiresAt,
        maxUses: i.maxUses,
        useCount: i.useCount,
        url: `/grupos?join=${i.token}`,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
