import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getCurrentUser,
  isCourseEditor,
  getCourseIdForModule,
  getCourseIdForQuiz,
} from '@/lib/permissions';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { moduleId, title, description, questions } = await req.json();

    const courseId = await getCourseIdForModule(moduleId);
    if (!courseId || !(await isCourseEditor(user.id, courseId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { quizId, title, description, questions } = await req.json();

    const courseId = await getCourseIdForQuiz(quizId);
    if (!courseId || !(await isCourseEditor(user.id, courseId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { quizId } = await req.json();
    if (!quizId) {
      return NextResponse.json({ error: 'quizId requerido' }, { status: 400 });
    }

    const courseId = await getCourseIdForQuiz(quizId);
    if (!courseId || !(await isCourseEditor(user.id, courseId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.quizQuestion.deleteMany({ where: { quizId } });
    await prisma.quiz.delete({ where: { id: quizId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
