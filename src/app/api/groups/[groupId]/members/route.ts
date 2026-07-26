import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const myMembership = await prisma.groupMembership.findFirst({
      where: { userId: user.id, groupId: params.groupId, role: 'ADMIN' },
    });

    if (!myMembership) {
      return NextResponse.json({ error: 'Solo los admins pueden añadir miembros' }, { status: 403 });
    }

    const { userId, role } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    const existing = await prisma.groupMembership.findFirst({
      where: { userId, groupId: params.groupId },
    });

    if (existing) {
      return NextResponse.json({ error: 'Ya es miembro' }, { status: 400 });
    }

    const membership = await prisma.groupMembership.create({
      data: {
        userId,
        groupId: params.groupId,
        role: role || 'MEMBER',
      },
    });

    return NextResponse.json({ membership });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PUT(
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
    const myMembership = await prisma.groupMembership.findFirst({
      where: { userId: user.id, groupId: params.groupId, role: 'ADMIN' },
    });

    if (!myMembership) {
      return NextResponse.json({ error: 'Solo los admins pueden cambiar roles' }, { status: 403 });
    }

    const { userId: targetUserId, role } = await req.json();

    if (!targetUserId || !role) {
      return NextResponse.json({ error: 'userId y role requeridos' }, { status: 400 });
    }

    const membership = await prisma.groupMembership.updateMany({
      where: { userId: targetUserId, groupId: params.groupId },
      data: { role },
    });

    return NextResponse.json({ membership });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE(
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
    const url = new URL(req.url);
    const targetUserId = url.searchParams.get('userId');

    if (targetUserId) {
      const myMembership = await prisma.groupMembership.findFirst({
        where: { userId: user.id, groupId: params.groupId, role: 'ADMIN' },
      });

      if (!myMembership && targetUserId !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }

      await prisma.groupMembership.deleteMany({
        where: { userId: targetUserId, groupId: params.groupId },
      });
    } else {
      await prisma.groupMembership.deleteMany({
        where: { userId: user.id, groupId: params.groupId },
      });
    }

    return NextResponse.json({ message: 'Miembro eliminado' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
