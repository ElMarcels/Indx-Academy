import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const { answers, rating, comment } = await req.json();

    const existing = await prisma.surveyResponse.findUnique({
      where: { surveyId_userId: { surveyId: params.surveyId, userId: user.id } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Ya respondiste esta encuesta' }, { status: 400 });
    }

    await prisma.surveyResponse.create({
      data: {
        surveyId: params.surveyId,
        userId: user.id,
        answers: JSON.stringify(answers),
        rating,
        comment,
      },
    });

    return NextResponse.json({ message: 'Respuesta enviada' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const response = await prisma.surveyResponse.findUnique({
      where: { surveyId_userId: { surveyId: params.surveyId, userId: user.id } },
    });

    return NextResponse.json({ responded: !!response });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
