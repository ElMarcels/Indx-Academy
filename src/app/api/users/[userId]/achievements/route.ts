import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const achievements = await prisma.userAchievement.findMany({
      where: { userId: params.userId },
      include: { achievement: true },
      orderBy: { earnedAt: 'desc' },
    });
    return NextResponse.json({ achievements });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
