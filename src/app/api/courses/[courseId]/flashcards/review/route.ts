import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  try {
    const { flashcardId, quality } = await req.json();

    if (!flashcardId || quality === undefined || quality < 0 || quality > 5) {
      return NextResponse.json(
        { error: 'flashcardId y quality (0-5) son requeridos' },
        { status: 400 }
      );
    }

    const flashcard = await prisma.courseFlashcard.findUnique({
      where: { id: flashcardId },
    });

    if (!flashcard || flashcard.courseId !== params.courseId) {
      return NextResponse.json({ error: 'Flashcard no encontrada' }, { status: 404 });
    }

    const existing = await prisma.courseFlashcardReview.findUnique({
      where: { userId_flashcardId: { userId: user.id, flashcardId } },
    });

    let interval: number;
    let easeFactor: number;

    if (existing) {
      easeFactor =
        existing.easeFactor +
        (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      easeFactor = Math.min(2.5, Math.max(1.3, easeFactor));

      if (quality < 3) {
        interval = 1;
      } else {
        interval = Math.round(existing.interval * easeFactor);
      }

      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + interval);

      await prisma.courseFlashcardReview.update({
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

      return NextResponse.json({ interval, easeFactor, nextReview });
    } else {
      easeFactor = 2.5;
      interval = 1;

      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + interval);

      await prisma.courseFlashcardReview.create({
        data: {
          userId: user.id,
          flashcardId,
          quality,
          interval,
          easeFactor,
          nextReview,
          reviewCount: 1,
          lastReviewed: new Date(),
        },
      });

      return NextResponse.json({ interval, easeFactor, nextReview });
    }
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
