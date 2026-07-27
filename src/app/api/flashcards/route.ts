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

    const now = new Date();

    const dueCards = await prisma.flashcardReview.findMany({
      where: { userId: user.id, nextReview: { lte: now } },
      include: { term: true },
      orderBy: { nextReview: 'asc' },
      take: 20,
    });

    const newTerms = await prisma.glossaryTerm.findMany({
      where: { reviews: { none: { userId: user.id } } },
      take: 10,
    });

    const stats = await prisma.flashcardReview.aggregate({
      where: { userId: user.id },
      _count: true,
      _avg: { easeFactor: true },
    });

    return NextResponse.json({
      due: dueCards,
      newTerms: newTerms.map((t) => ({ ...t, isNew: true })),
      totalReviewed: stats._count,
      avgEase: stats._avg.easeFactor,
    });
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

    const { glossaryId, quality } = await req.json();

    if (!glossaryId || quality === undefined || quality < 0 || quality > 5) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    const existing = await prisma.flashcardReview.findUnique({
      where: { userId_glossaryId: { userId: user.id, glossaryId } },
    });

    let interval: number;
    let easeFactor: number;

    if (existing) {
      easeFactor = Math.max(1.3, existing.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

      if (quality < 3) {
        interval = 1;
      } else if (existing.reviewCount === 0) {
        interval = 1;
      } else if (existing.reviewCount === 1) {
        interval = 6;
      } else {
        interval = Math.round(existing.interval * easeFactor);
      }

      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + interval);

      await prisma.flashcardReview.update({
        where: { id: existing.id },
        data: {
          quality,
          interval,
          easeFactor,
          nextReview,
          reviewCount: existing.reviewCount + 1,
          lastReviewed: new Date(),
        },
      });
    } else {
      easeFactor = 2.5;
      interval = quality < 3 ? 1 : 1;

      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + interval);

      await prisma.flashcardReview.create({
        data: {
          userId: user.id,
          glossaryId,
          quality,
          interval,
          easeFactor,
          nextReview,
          reviewCount: 1,
          lastReviewed: new Date(),
        },
      });
    }

    return NextResponse.json({ message: 'Guardado', interval, easeFactor });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
