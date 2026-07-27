import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const targetId = req.nextUrl.searchParams.get('userId');
  if (!targetId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
  }

  try {
    const myContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { userId: user.id, status: 'ACCEPTED' },
          { contactId: user.id, status: 'ACCEPTED' },
        ],
      },
    });

    const myContactIds = new Set(
      myContacts.map((c) => (c.userId === user.id ? c.contactId : c.userId))
    );

    const theirContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { userId: targetId, status: 'ACCEPTED' },
          { contactId: targetId, status: 'ACCEPTED' },
        ],
      },
    });

    const theirContactIds = new Set(
      theirContacts.map((c) => (c.userId === targetId ? c.contactId : c.userId))
    );

    const mutualIds = [...myContactIds].filter((id) => theirContactIds.has(id));

    const mutualUsers = mutualIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: mutualIds } },
          select: { id: true, name: true, email: true, image: true },
          take: 10,
        })
      : [];

    return NextResponse.json({
      count: mutualIds.length,
      mutual: mutualUsers,
    });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
