import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const isAdmin = user.role === 'ADMIN';
    if (!isAdmin) {
      const teacherCount = await prisma.courseTeacher.count({
        where: { userId: user.id },
      });
      if (teacherCount === 0) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
    }

    const courses = await prisma.course.findMany({
      where: isAdmin ? undefined : { teachers: { some: { userId: user.id } } },
      include: {
        _count: { select: { enrollments: true } },
        modules: { include: { lessons: { select: { id: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(courses);
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
