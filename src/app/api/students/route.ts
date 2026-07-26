import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            lessonProgress: { where: { completed: true } },
            achievements: true,
          },
        },
      },
      where: { role: 'STUDENT' },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
