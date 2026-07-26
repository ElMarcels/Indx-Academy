import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.quizId },
      include: {
        questions: { orderBy: { order: 'asc' } },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      quiz: {
        ...quiz,
        questions: quiz.questions.map((q) => ({
          ...q,
          options: JSON.parse(q.options),
        })),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
