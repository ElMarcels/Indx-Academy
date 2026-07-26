import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const level = searchParams.get('level') || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'newest';

    const where: any = { isPublished: true };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (level) {
      where.level = level;
    }

    if (category) {
      where.category = category;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    else if (sort === 'popular') orderBy = { enrollments: { _count: 'desc' } };

    const courses = await prisma.course.findMany({
      where,
      include: {
        author: { select: { name: true, image: true } },
        modules: {
          include: {
            lessons: { select: { id: true, title: true, duration: true, isFree: true, order: true } },
          },
          orderBy: { order: 'asc' },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy,
    });

    return NextResponse.json(courses);
  } catch (error) {
    return NextResponse.json({ error: 'Error al cargar cursos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, category, level, duration, thumbnail } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Título y descripción son requeridos' },
        { status: 400 }
      );
    }

    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description,
        category: category || null,
        level: level || 'BEGINNER',
        duration: duration || null,
        thumbnail: thumbnail || null,
        authorId: (session.user as any).id,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json({ error: 'Error al crear curso' }, { status: 500 });
  }
}
