import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { moduleId, title, description, questions } = await req.json();

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description: description || null,
        moduleId,
        questions: {
          create: questions.map((q: any, i: number) => ({
            question: q.question,
            options: JSON.stringify(q.options),
            correctIndex: q.correctIndex,
            explanation: q.explanation || null,
            order: i + 1,
          })),
        },
      },
      include: { questions: true },
    });

    return NextResponse.json({ quiz });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { quizId, title, description, questions } = await req.json();

    await prisma.quizQuestion.deleteMany({ where: { quizId } });

    const quiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        title,
        description: description || null,
        questions: {
          create: questions.map((q: any, i: number) => ({
            question: q.question,
            options: JSON.stringify(q.options),
            correctIndex: q.correctIndex,
            explanation: q.explanation || null,
            order: i + 1,
          })),
        },
      },
      include: { questions: true },
    });

    return NextResponse.json({ quiz });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
