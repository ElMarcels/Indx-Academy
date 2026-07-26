import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
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
      return NextResponse.json({ error: 'No tienes acceso a este grupo' }, { status: 403 });
    }

    const group = await prisma.group.findUnique({
      where: { id: params.groupId },
      include: {
        _count: { select: { members: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ group, myRole: membership.role });
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
    const membership = await prisma.groupMembership.findFirst({
      where: { userId: user.id, groupId: params.groupId, role: 'ADMIN' },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Solo los admins pueden editar el grupo' }, { status: 403 });
    }

    const { name, description } = await req.json();

    const group = await prisma.group.update({
      where: { id: params.groupId },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    return NextResponse.json({ group });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
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
      where: { userId: user.id, groupId: params.groupId, role: 'ADMIN' },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Solo los admins pueden eliminar el grupo' }, { status: 403 });
    }

    await prisma.group.delete({ where: { id: params.groupId } });

    return NextResponse.json({ message: 'Grupo eliminado' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
