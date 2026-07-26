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
    const groups = await prisma.group.findMany({
      where: {
        members: { some: { userId: user.id } },
      },
      include: {
        _count: { select: { members: true } },
        members: {
          include: { user: { select: { id: true, name: true, image: true } } },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ groups });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
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
    const { name, description, memberIds } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
    }

    const allMemberIds = [...new Set([user.id, ...(memberIds || [])])];

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description || null,
        createdById: user.id,
        members: {
          create: allMemberIds.map((id: string) => ({
            userId: id,
            role: id === user.id ? 'ADMIN' : 'MEMBER',
          })),
        },
      },
      include: { _count: { select: { members: true } } },
    });

    return NextResponse.json({ group });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
