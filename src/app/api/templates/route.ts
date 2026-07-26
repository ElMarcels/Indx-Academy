import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { name, description, fileName, fileUrl, fileSize, language, courseId } = await req.json();

    if (!name || !fileName || !fileUrl || !courseId) {
      return NextResponse.json({ error: 'Nombre, fileName, fileUrl y courseId requeridos' }, { status: 400 });
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
