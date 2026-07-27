import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
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

    const { userId, role } = await req.json();

    const project = await prisma.collaborativeProject.findUnique({
      where: { id: params.projectId },
    });

    if (!project || project.createdById !== user.id) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const member = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: params.projectId, userId } },
      update: { role: role || 'EDITOR' },
      create: { projectId: params.projectId, userId, role: role || 'EDITOR' },
    });

    return NextResponse.json({ member });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
