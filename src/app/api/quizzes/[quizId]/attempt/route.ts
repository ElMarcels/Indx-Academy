import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { quizId: string } }
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
    const { answers } = await req.json();

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.quizId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz no encontrado' }, { status: 404 });
    }

    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) score++;
    });

    const total = quiz.questions.length;
    const passed = score >= Math.ceil(total * 0.6);

    const attempt = await prisma.quizAttempt.upsert({
      where: { userId_quizId: { userId: user.id, quizId: params.quizId } },
      update: { score, total, answers: JSON.stringify(answers), passed },
      create: {
        userId: user.id,
        quizId: params.quizId,
        score,
        total,
        answers: JSON.stringify(answers),
        passed,
      },
    });

    return NextResponse.json({
      id: attempt.id,
      score,
      total,
      answers,
      passed,
      createdAt: attempt.createdAt,
    });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
