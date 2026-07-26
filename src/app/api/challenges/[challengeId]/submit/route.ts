import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { challengeId: string } }
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
    const { content } = await req.json();

    const challenge = await prisma.challenge.findUnique({
      where: { id: params.challengeId },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Desafío no encontrado' }, { status: 404 });
    }

    const submission = await prisma.challengeSubmission.create({
      data: {
        userId: user.id,
        challengeId: params.challengeId,
        content,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      submission: {
        id: submission.id,
        status: submission.status,
        content: submission.content,
        feedback: submission.feedback,
        createdAt: submission.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
