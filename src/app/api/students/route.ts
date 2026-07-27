import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const search = req.nextUrl.searchParams.get('search');

  try {
    const myId = session?.user?.email
      ? (await prisma.user.findUnique({ where: { email: session.user.email } }))?.id
      : null;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        image: true,
        lastSeen: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            lessonProgress: true,
            achievements: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: search ? 20 : 50,
    });

    const filteredUsers = myId ? users.filter((u) => u.id !== myId) : users;

    // If logged in, also return pending contact requests
    let pendingReceived: any[] = [];
    let pendingSent: any[] = [];
    if (myId) {
      const received = await prisma.contact.findMany({
        where: { contactId: myId, status: 'PENDING' },
        include: { owner: { select: { id: true, name: true, email: true, image: true } } },
      });
      pendingReceived = received.map((r) => ({ contactId: r.id, ...r.owner }));

      const sent = await prisma.contact.findMany({
        where: { userId: myId, status: 'PENDING' },
        include: { contact: { select: { id: true, name: true, email: true, image: true } } },
      });
      pendingSent = sent.map((s) => ({ contactId: s.id, ...s.contact }));
    }

    return NextResponse.json({ users: filteredUsers, pendingReceived, pendingSent });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
