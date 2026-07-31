import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isCourseEditor, getCourseIdForLesson } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    const lessonId = req.nextUrl.searchParams.get('lessonId');
    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId requerido' }, { status: 400 });
    }

    const exercises = await prisma.codeExercise.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ exercises });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { title, description, language, starterCode, solution, testCases, difficulty, points, lessonId } = await req.json();

    if (!title || !description || !lessonId) {
      return NextResponse.json({ error: 'Título, descripción y lessonId requeridos' }, { status: 400 });
    }

    const courseId = await getCourseIdForLesson(lessonId);
    if (!courseId || !(await isCourseEditor(user.id, courseId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const exercise = await prisma.codeExercise.create({
      data: {
        title,
        description,
        language: language || 'javascript',
        starterCode: starterCode || null,
        solution: solution || null,
        testCases: JSON.stringify(testCases || []),
        difficulty: difficulty || 'EASY',
        points: points || 10,
        lessonId,
      },
    });

    return NextResponse.json({ exercise });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
