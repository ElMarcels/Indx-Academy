import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isCourseEditor, getCourseIdForTemplate } from '@/lib/permissions';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { templateId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const courseId = await getCourseIdForTemplate(params.templateId);
    if (!courseId || !(await isCourseEditor(user.id, courseId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const template = await prisma.courseTemplate.findUnique({
      where: { id: params.templateId },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template no encontrado' }, { status: 404 });
    }

    await prisma.courseTemplate.delete({
      where: { id: params.templateId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
