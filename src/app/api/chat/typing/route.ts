import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const typingUsers = new Map<string, { userId: string; name: string; timestamp: number }[]>();

function cleanExpired() {
  const now = Date.now();
  for (const [key, arr] of typingUsers) {
    typingUsers.set(key, arr.filter((t) => now - t.timestamp < 5000));
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
    const { groupId, contactId } = await req.json();
    const key = groupId || contactId || 'general';

    cleanExpired();
    const arr = typingUsers.get(key) || [];
    const existing = arr.findIndex((t) => t.userId === user.id);
    const entry = { userId: user.id, name: user.name || 'Anónimo', timestamp: Date.now() };

    if (existing >= 0) {
      arr[existing] = entry;
    } else {
      arr.push(entry);
    }
    typingUsers.set(key, arr);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const groupId = req.nextUrl.searchParams.get('groupId');
    const contactId = req.nextUrl.searchParams.get('contactId');
    const key = groupId || contactId || 'general';

    cleanExpired();
    const arr = typingUsers.get(key) || [];
    const others = arr.filter((t) => t.userId !== user.id);

    return NextResponse.json({ typing: others.map((t) => t.name) });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
