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
    const { targets } = await req.json(); // [{ targetType, targetId }]

    if (!Array.isArray(targets) || targets.length === 0) {
      return NextResponse.json({ reactions: {} });
    }

    const conditions = targets.map((t: any) => ({
      targetType: t.targetType,
      targetId: t.targetId,
    }));

    const reactions = await prisma.reaction.findMany({
      where: { OR: conditions },
    });

    const grouped: Record<string, Record<string, number>> = {};
    const userMap: Record<string, string> = {};

    for (const r of reactions) {
      const key = `${r.targetType}:${r.targetId}`;
      if (!grouped[key]) grouped[key] = {};
      grouped[key][r.type] = (grouped[key][r.type] || 0) + 1;
      if (user && r.userId === user.id) {
        userMap[key] = r.type;
      }
    }

    const result: Record<string, any> = {};
    for (const t of targets) {
      const key = `${t.targetType}:${t.targetId}`;
      result[key] = { counts: grouped[key] || {}, userReaction: userMap[key] || null };
    }

    return NextResponse.json({ reactions: result });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
