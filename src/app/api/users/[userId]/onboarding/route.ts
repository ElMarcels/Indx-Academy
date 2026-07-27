import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const onboarding = await prisma.userOnboarding.findUnique({
      where: { userId: params.userId },
    });

    return NextResponse.json({
      completed: !!onboarding?.completedAt,
      steps: onboarding ? JSON.parse(onboarding.completedSteps) : [],
    });
  } catch {
    return NextResponse.json({ completed: false, steps: [] });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || (user.id !== params.userId && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { completedSteps } = await req.json();

    const existing = await prisma.userOnboarding.findUnique({
      where: { userId: params.userId },
    });

    if (existing) {
      await prisma.userOnboarding.update({
        where: { id: existing.id },
        data: {
          completedSteps: JSON.stringify(completedSteps),
          completedAt: new Date(),
        },
      });
    } else {
      await prisma.userOnboarding.create({
        data: {
          userId: params.userId,
          completedSteps: JSON.stringify(completedSteps),
          completedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ message: 'Onboarding completado' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
