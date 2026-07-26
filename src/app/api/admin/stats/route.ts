import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const [totalUsers, totalCourses, totalEnrollments, totalLessons] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.lesson.count(),
    ]);

    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const recentEnrollments = await prisma.enrollment.findMany({
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
      orderBy: { enrolledAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        totalLessons,
      },
      recentUsers,
      recentEnrollments,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al cargar stats' }, { status: 500 });
  }
}
