import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const projects = await prisma.collaborativeProject.findMany({
      where: {
        OR: [
          { createdById: user.id },
          { members: { some: { userId: user.id } } },
          { groupId: { not: null } },
        ],
      },
      include: {
        createdBy: { select: { name: true, image: true } },
        members: {
          include: { user: { select: { name: true, image: true } } },
        },
        group: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ projects });
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

    const { name, description, language, groupId, starterCode } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Falta el nombre' }, { status: 400 });
    }

    const project = await prisma.collaborativeProject.create({
      data: {
        name,
        description,
        language: language || 'javascript',
        code: starterCode || '',
        groupId: groupId || null,
        createdById: user.id,
        members: {
          create: { userId: user.id, role: 'EDITOR' },
        },
      },
      include: {
        createdBy: { select: { name: true, image: true } },
        members: { include: { user: { select: { name: true, image: true } } } },
      },
    });

    return NextResponse.json({ project });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
