import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const membership = await prisma.groupMembership.findFirst({
      where: { userId: user.id, groupId: params.groupId },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No eres miembro' }, { status: 403 });
    }

    const files = await prisma.message.findMany({
      where: {
        groupId: params.groupId,
        fileUrl: { not: null },
      },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      files: files.map((f) => ({
        id: f.id,
        content: f.content,
        fileUrl: f.fileUrl,
        fileName: f.fileName,
        fileType: f.fileType,
        senderName: f.sender.name || 'Anónimo',
        createdAt: f.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
