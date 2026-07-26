import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const enrolledIds = searchParams.get('enrolledIds')?.split(',').filter(Boolean) || [];

    let courses;

    if (enrolledIds.length > 0) {
      const enrolledCourses = await prisma.course.findMany({
        where: { id: { in: enrolledIds } },
        select: { category: true, level: true },
      });

      const categories = [...new Set(enrolledCourses.map((c) => c.category).filter(Boolean))] as string[];

      courses = await prisma.course.findMany({
        where: {
          isPublished: true,
          id: { notIn: enrolledIds },
          OR: categories.length > 0
            ? [{ category: { in: categories } }]
            : undefined,
        },
        include: {
          _count: { select: { enrollments: true } },
        },
        orderBy: { enrollments: { _count: 'desc' } },
        take: 6,
      });
    } else {
      courses = await prisma.course.findMany({
        where: { isPublished: true },
        include: {
          _count: { select: { enrollments: true } },
        },
        orderBy: { enrollments: { _count: 'desc' } },
        take: 6,
      });
    }

    return NextResponse.json({ courses });
  } catch {
    return NextResponse.json({ error: 'Error al cargar recomendaciones' }, { status: 500 });
  }
}
