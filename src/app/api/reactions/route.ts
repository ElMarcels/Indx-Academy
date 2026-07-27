import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const targetType = req.nextUrl.searchParams.get('targetType');
  const targetId = req.nextUrl.searchParams.get('targetId');

  if (!targetType || !targetId) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const reactions = await prisma.reaction.groupBy({
      by: ['type'],
      where: { targetType, targetId },
      _count: true,
    });

    const userReaction = await prisma.reaction.findUnique({
      where: { userId_targetType_targetId: { userId: user.id, targetType, targetId } },
    });

    return NextResponse.json({
      counts: Object.fromEntries(reactions.map((r) => [r.type, r._count])),
      userReaction: userReaction?.type || null,
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

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const { targetType, targetId, type } = await req.json();

    if (!targetType || !targetId || !type) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }

    const existing = await prisma.reaction.findUnique({
      where: { userId_targetType_targetId: { userId: user.id, targetType, targetId } },
    });

    if (existing) {
      if (existing.type === type) {
        await prisma.reaction.delete({ where: { id: existing.id } });
        return NextResponse.json({ action: 'removed', type: null });
      } else {
        await prisma.reaction.update({ where: { id: existing.id }, data: { type } });
        return NextResponse.json({ action: 'updated', type });
      }
    }

    await prisma.reaction.create({ data: { userId: user.id, targetType, targetId, type } });
    return NextResponse.json({ action: 'added', type });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
