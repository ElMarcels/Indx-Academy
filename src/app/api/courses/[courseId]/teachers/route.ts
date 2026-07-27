import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const teachers = await prisma.courseTeacher.findMany({
      where: { courseId: params.courseId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { addedAt: 'asc' },
    });

    return NextResponse.json({ teachers });
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

  const admin = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
  }

  try {
    const { userId, role } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const existing = await prisma.courseTeacher.findUnique({
      where: { courseId_userId: { courseId: params.courseId, userId } },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'El usuario ya es teacher de este curso' },
        { status: 409 }
      );
    }

    const teacher = await prisma.courseTeacher.create({
      data: {
        courseId: params.courseId,
        userId,
        role: role || 'TEACHER',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json({ teacher }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
