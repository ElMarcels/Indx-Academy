import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isCourseEditor, getCourseIdForLesson } from '@/lib/permissions';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const lessonId = formData.get('lessonId') as string;

    if (!file || !lessonId) {
      return NextResponse.json({ error: 'Falta archivo o lessonId' }, { status: 400 });
    }

    const courseId = await getCourseIdForLesson(lessonId);
    if (!courseId || !(await isCourseEditor(user.id, courseId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    const uploaded = await prisma.lessonFile.create({
      data: {
        name: file.name,
        url: dataUrl,
        size: file.size,
        type: file.type,
        lessonId,
      },
    });

    return NextResponse.json({ file: uploaded });
  } catch {
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 });
  }
}
