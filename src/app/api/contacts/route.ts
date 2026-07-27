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
    // Get accepted contacts
    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { userId: user.id },
          { contactId: user.id },
        ],
        status: 'ACCEPTED',
      },
      include: {
        owner: { select: { id: true, name: true, email: true, image: true, lastSeen: true } },
        contact: { select: { id: true, name: true, email: true, image: true, lastSeen: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const contactList = contacts.map((c) => {
      const other = c.userId === user.id ? c.contact : c.owner;
      return { contactId: c.id, id: other.id, name: other.name, email: other.email, image: other.image, lastSeen: other.lastSeen, since: c.createdAt };
    });

    // Get blocked contacts
    const blocked = await prisma.contact.findMany({
      where: {
        OR: [
          { userId: user.id, status: 'BLOCKED' },
          { contactId: user.id, status: 'BLOCKED' },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
        contact: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    const blockedList = blocked.map((c) => {
      const other = c.userId === user.id ? c.contact : c.owner;
      return { contactId: c.id, id: other.id, name: other.name, email: other.email, image: other.image };
    });

    return NextResponse.json({ contacts: contactList, blocked: blockedList });
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
    const { contactId } = await req.json();

    if (!contactId) {
      return NextResponse.json({ error: 'Falta contactId' }, { status: 400 });
    }

    if (contactId === user.id) {
      return NextResponse.json({ error: 'No puedes añadirte a ti mismo' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: contactId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const existing = await prisma.contact.findFirst({
      where: {
        OR: [
          { userId: user.id, contactId },
          { userId: contactId, contactId: user.id },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return NextResponse.json({ error: 'Ya sois contactos' }, { status: 400 });
      }
      if (existing.status === 'BLOCKED') {
        return NextResponse.json({ error: 'Este contacto está bloqueado' }, { status: 400 });
      }
      if (existing.status === 'PENDING') {
        if (existing.userId === contactId) {
          await prisma.contact.update({
            where: { id: existing.id },
            data: { status: 'ACCEPTED' },
          });
          return NextResponse.json({ message: 'Solicitud aceptada' });
        }
        return NextResponse.json({ error: 'Solicitud ya enviada' }, { status: 400 });
      }
    }

    await prisma.contact.create({
      data: { userId: user.id, contactId, status: 'PENDING' },
    });

    return NextResponse.json({ message: 'Solicitud enviada' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
