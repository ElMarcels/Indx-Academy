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

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
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

  try {
    const flashcards = await prisma.courseFlashcard.findMany({
      where: { courseId: params.courseId },
      orderBy: { order: 'asc' },
      include: {
        reviews: {
          where: { userId: user.id },
          take: 1,
        },
      },
    });

    return NextResponse.json({ flashcards });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
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
    const { term, definition, example, order } = await req.json();

    if (!term || !definition) {
      return NextResponse.json(
        { error: 'term y definition son requeridos' },
        { status: 400 }
      );
    }

    const flashcard = await prisma.courseFlashcard.create({
      data: {
        term,
        definition,
        example: example || null,
        order: order ?? 0,
        courseId: params.courseId,
      },
    });

    return NextResponse.json({ flashcard }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
