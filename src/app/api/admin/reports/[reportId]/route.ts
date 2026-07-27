import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { status } = await req.json();

    if (!['ACTION_TAKEN', 'REVIEWED', 'DISMISSED'].includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const report = await prisma.report.update({
      where: { id: params.reportId },
      data: { status, reviewedById: user.id, reviewedAt: new Date() },
    });

    return NextResponse.json({ report });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
