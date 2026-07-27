import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function isAuthorized(userId: string, courseId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role === 'ADMIN') return true;
  const teacher = await prisma.courseTeacher.findUnique({
    where: { courseId_userId: { courseId, userId } },
  });
  return !!teacher;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { courseId: string; flashcardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  if (!(await isAuthorized(user.id, params.courseId))) {
    return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
  }

  try {
    const existing = await prisma.courseFlashcard.findUnique({
      where: { id: params.flashcardId },
    });

    if (!existing || existing.courseId !== params.courseId) {
      return NextResponse.json({ error: 'Flashcard no encontrada' }, { status: 404 });
    }

    const { term, definition, example, order } = await req.json();

    const flashcard = await prisma.courseFlashcard.update({
      where: { id: params.flashcardId },
      data: {
        ...(term !== undefined && { term }),
        ...(definition !== undefined && { definition }),
        ...(example !== undefined && { example: example || null }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json({ flashcard });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { courseId: string; flashcardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  if (!(await isAuthorized(user.id, params.courseId))) {
    return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
  }

  try {
    const existing = await prisma.courseFlashcard.findUnique({
      where: { id: params.flashcardId },
    });

    if (!existing || existing.courseId !== params.courseId) {
      return NextResponse.json({ error: 'Flashcard no encontrada' }, { status: 404 });
    }

    await prisma.courseFlashcard.delete({
      where: { id: params.flashcardId },
    });

    return NextResponse.json({ message: 'Eliminada' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
