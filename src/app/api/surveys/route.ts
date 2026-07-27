import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get('courseId');
  if (!courseId) {
    return NextResponse.json({ error: 'Falta courseId' }, { status: 400 });
  }

  try {
    const survey = await prisma.survey.findFirst({
      where: { courseId, isActive: true },
    });

    if (!survey) {
      return NextResponse.json({ survey: null });
    }

    return NextResponse.json({
      survey: { ...survey, questions: JSON.parse(survey.questions) },
    });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { courseId, title, description, questions } = await req.json();

    if (!courseId || !title || !questions) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }

    const survey = await prisma.survey.create({
      data: {
        courseId,
        title,
        description,
        questions: JSON.stringify(questions),
      },
    });

    return NextResponse.json({ survey });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
