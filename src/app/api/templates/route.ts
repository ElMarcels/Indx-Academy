import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isCourseEditor } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    const courseId = req.nextUrl.searchParams.get('courseId');
    if (!courseId) {
      return NextResponse.json({ error: 'courseId requerido' }, { status: 400 });
    }

    const templates = await prisma.courseTemplate.findMany({
      where: { courseId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ templates });
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
    const { name, description, fileName, fileUrl, fileSize, language, courseId } = await req.json();

    if (!name || !fileName || !fileUrl || !courseId) {
      return NextResponse.json({ error: 'Nombre, fileName, fileUrl y courseId requeridos' }, { status: 400 });
    }

    if (!(await isCourseEditor(user.id, courseId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const template = await prisma.courseTemplate.create({
      data: {
        name,
        description: description || null,
        fileName,
        fileUrl,
        fileSize: fileSize || null,
        language: language || null,
        courseId,
      },
    });

    return NextResponse.json({ template });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
