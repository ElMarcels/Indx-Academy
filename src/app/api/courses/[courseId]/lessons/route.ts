import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isCourseEditor } from '@/lib/permissions';

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!(await isCourseEditor(user.id, params.courseId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, content, task, isFree, moduleId, order } = body;

    if (!title || !moduleId) {
      return NextResponse.json(
        { error: 'Título y módulo son requeridos' },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description: description || null,
        content: content || null,
        task: task || null,
        isFree: isFree || false,
        moduleId,
        order: order || 1,
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear lección' }, { status: 500 });
  }
}
