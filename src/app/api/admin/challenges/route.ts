import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const courseId = req.nextUrl.searchParams.get('courseId');
    if (!courseId) {
      return NextResponse.json({ error: 'courseId requerido' }, { status: 400 });
    }

    const challenges = await prisma.challenge.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(challenges);
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { courseId, title, description, difficulty, points } = await req.json();

    const challenge = await prisma.challenge.create({
      data: { courseId, title, description, difficulty, points },
    });

    return NextResponse.json({ challenge });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { challengeId, title, description, difficulty, points } = await req.json();

    const challenge = await prisma.challenge.update({
      where: { id: challengeId },
      data: { title, description, difficulty, points },
    });

    return NextResponse.json({ challenge });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { challengeId } = await req.json();
    if (!challengeId) {
      return NextResponse.json({ error: 'challengeId es requerido' }, { status: 400 });
    }

    await prisma.challenge.delete({ where: { id: challengeId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
