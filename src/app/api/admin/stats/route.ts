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

    const [totalUsers, totalCourses, totalEnrollments, totalLessons, totalMessages, totalAchievements] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.lesson.count(),
      prisma.message.count(),
      prisma.userAchievement.count(),
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

    const courses = await prisma.course.findMany({
      select: {
        title: true,
        _count: { select: { enrollments: true } },
      },
    });

    const courseStats = await Promise.all(
      courses.map(async (c) => {
        const course = await prisma.course.findFirst({ where: { title: c.title }, select: { id: true } });
        const lessonCount = course
          ? await prisma.lesson.count({ where: { module: { courseId: course.id } } })
          : 0;
        return {
          title: c.title,
          enrollmentCount: c._count.enrollments,
          lessonCount,
        };
      })
    );

    return NextResponse.json({
      stats: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        totalLessons,
        totalMessages,
        totalAchievements,
      },
      recentUsers,
      recentEnrollments,
      courseStats,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al cargar stats' }, { status: 500 });
  }
}
