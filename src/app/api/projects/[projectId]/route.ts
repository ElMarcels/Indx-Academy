import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const project = await prisma.collaborativeProject.findUnique({
      where: { id: params.projectId },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
        group: { select: { id: true, name: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const { code } = await req.json();

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: params.projectId, userId: user.id } },
    });

    if (!member || member.role !== 'EDITOR') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const project = await prisma.collaborativeProject.update({
      where: { id: params.projectId },
      data: { code },
    });

    return NextResponse.json({ project });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const project = await prisma.collaborativeProject.findUnique({
      where: { id: params.projectId },
    });

    if (!project || project.createdById !== user.id) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    await prisma.collaborativeProject.delete({ where: { id: params.projectId } });
    return NextResponse.json({ message: 'Proyecto eliminado' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
