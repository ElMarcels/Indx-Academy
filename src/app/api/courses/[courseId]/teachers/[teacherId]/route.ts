import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { courseId: string; teacherId: string } }
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
    const existing = await prisma.courseTeacher.findUnique({
      where: { id: params.teacherId },
    });

    if (!existing || existing.courseId !== params.courseId) {
      return NextResponse.json(
        { error: 'Teacher no encontrado' },
        { status: 404 }
      );
    }

    const { role } = await req.json();

    if (!role || !['TEACHER', 'ASSISTANT'].includes(role)) {
      return NextResponse.json(
        { error: 'role debe ser TEACHER o ASSISTANT' },
        { status: 400 }
      );
    }

    const teacher = await prisma.courseTeacher.update({
      where: { id: params.teacherId },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json({ teacher });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { courseId: string; teacherId: string } }
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
    const existing = await prisma.courseTeacher.findUnique({
      where: { id: params.teacherId },
    });

    if (!existing || existing.courseId !== params.courseId) {
      return NextResponse.json(
        { error: 'Teacher no encontrado' },
        { status: 404 }
      );
    }

    await prisma.courseTeacher.delete({
      where: { id: params.teacherId },
    });

    return NextResponse.json({ message: 'Teacher eliminado' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
