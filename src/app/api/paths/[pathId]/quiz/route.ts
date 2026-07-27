import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { pathId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const path = await prisma.learningPath.findUnique({
      where: { id: params.pathId },
    });

    if (!path) {
      return NextResponse.json({ error: 'Ruta no encontrada' }, { status: 404 });
    }

    if (!path.quizQuestions) {
      return NextResponse.json({ error: 'Esta ruta no tiene cuestionario' }, { status: 400 });
    }

    const { answers } = await req.json();
    const questions = JSON.parse(path.quizQuestions);

    let score = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correctIndex) score++;
    }

    const ratio = score / questions.length;
    const recommendedLevel = ratio >= 0.8 ? 'ADVANCED' : ratio >= 0.5 ? 'INTERMEDIATE' : 'BEGINNER';

    const existing = await prisma.pathQuizResult.findUnique({
      where: { userId_pathId: { userId: user.id, pathId: params.pathId } },
    });

    if (existing) {
      await prisma.pathQuizResult.update({
        where: { id: existing.id },
        data: { answers: JSON.stringify(answers), score, recommendedLevel },
      });
    } else {
      await prisma.pathQuizResult.create({
        data: {
          userId: user.id,
          pathId: params.pathId,
          answers: JSON.stringify(answers),
          score,
          recommendedLevel,
        },
      });
    }

    return NextResponse.json({ score, total: questions.length, recommendedLevel });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
