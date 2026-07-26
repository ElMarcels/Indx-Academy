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
    const { groupId, type } = await req.json();

    const call = await prisma.callSession.create({
      data: {
        callerId: user.id,
        groupId: groupId || null,
        type: type || 'AUDIO',
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ call });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
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
    const groupIds = (await prisma.groupMembership.findMany({
      where: { userId: user.id },
      select: { groupId: true },
    })).map((g) => g.groupId);

    const calls = await prisma.callSession.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { groupId: { in: groupIds } },
          { callerId: user.id },
        ],
      },
      include: {
        caller: { select: { id: true, name: true, image: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { startedAt: 'desc' },
    });

    return NextResponse.json({ calls });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
