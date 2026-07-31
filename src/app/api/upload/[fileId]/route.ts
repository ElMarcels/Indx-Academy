import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isCourseEditor, getCourseIdForLessonFile } from '@/lib/permissions';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const courseId = await getCourseIdForLessonFile(params.fileId);
    if (!courseId || !(await isCourseEditor(user.id, courseId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.lessonFile.delete({ where: { id: params.fileId } });
    return NextResponse.json({ message: 'Archivo eliminado' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
