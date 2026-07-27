import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const { targetType, targetId, reason, description } = await req.json();

    if (!targetType || !targetId || !reason) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }

    const existing = await prisma.report.findFirst({
      where: { reporterId: user.id, targetType, targetId, status: 'PENDING' },
    });

    if (existing) {
      return NextResponse.json({ error: 'Ya reportaste este contenido' }, { status: 400 });
    }

    await prisma.report.create({
      data: { reporterId: user.id, targetType, targetId, reason, description },
    });

    return NextResponse.json({ message: 'Reporte enviado' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const reports = await prisma.report.findMany({
      include: { reporter: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
