import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isCourseEditor, getCourseIdForLesson } from '@/lib/permissions';

export async function PUT(
  req: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const courseId = await getCourseIdForLesson(params.lessonId);
    if (!courseId || !(await isCourseEditor(user.id, courseId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { title, content, task, isFree } = await req.json();

    const lesson = await prisma.lesson.update({
      where: { id: params.lessonId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(task !== undefined && { task }),
        ...(isFree !== undefined && { isFree }),
      },
    });

    return NextResponse.json(lesson);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar lección' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const courseId = await getCourseIdForLesson(params.lessonId);
    if (!courseId || !(await isCourseEditor(user.id, courseId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.lesson.delete({
      where: { id: params.lessonId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
