import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const enrolledCourseIds = (await prisma.enrollment.findMany({
      where: { userId: user.id },
      select: { courseId: true },
    })).map((e) => e.courseId);

    const existingMatches = await prisma.peerMatch.findMany({
      where: {
        OR: [
          { userId: user.id },
          { peerId: user.id },
        ],
      },
      select: { userId: true, peerId: true },
    });

    const excludedIds = new Set<string>([user.id]);
    for (const m of existingMatches) {
      excludedIds.add(m.userId);
      excludedIds.add(m.peerId);
    }

    const candidates = await prisma.enrollment.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        userId: { notIn: Array.from(excludedIds) },
      },
      select: {
        userId: true,
        courseId: true,
        user: { select: { id: true, name: true, image: true, bio: true } },
        course: { select: { id: true, title: true } },
      },
    });

    const suggestionsMap = new Map<string, { user: { id: string; name: string | null; image: string | null; bio: string | null }; sharedCourses: string[] }>();

    for (const c of candidates) {
      const existing = suggestionsMap.get(c.userId);
      if (existing) {
        existing.sharedCourses.push(c.course.title);
      } else {
        suggestionsMap.set(c.userId, {
          user: c.user,
          sharedCourses: [c.course.title],
        });
      }
    }

    const suggestions = Array.from(suggestionsMap.values())
      .map((s) => ({
        ...s,
        sharedCoursesCount: s.sharedCourses.length,
      }))
      .sort((a, b) => b.sharedCoursesCount - a.sharedCoursesCount)
      .slice(0, 10);

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const { peerId, message } = await req.json();

    if (!peerId) {
      return NextResponse.json({ error: 'peerId requerido' }, { status: 400 });
    }

    if (peerId === user.id) {
      return NextResponse.json({ error: 'No puedes enviarte una solicitud a ti mismo' }, { status: 400 });
    }

    const existing = await prisma.peerMatch.findUnique({
      where: { userId_peerId: { userId: user.id, peerId } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Ya existe una solicitud con este usuario' }, { status: 400 });
    }

    const match = await prisma.peerMatch.create({
      data: {
        userId: user.id,
        peerId,
        message: message || null,
      },
    });

    return NextResponse.json({ match });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
