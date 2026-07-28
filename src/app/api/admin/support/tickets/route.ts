import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  try {
    const where = status && status !== 'ALL' ? { status } : {};

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        _count: { select: { messages: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ tickets });
  } catch {
    return NextResponse.json({ error: 'Error al obtener tickets' }, { status: 500 });
  }
}
