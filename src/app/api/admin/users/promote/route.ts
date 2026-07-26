import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { email, role } = await req.json();

    if (!email || !['ADMIN', 'STUDENT'].includes(role)) {
      return NextResponse.json(
        { error: 'Email y rol válido son requeridos' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const updated = await prisma.user.update({
      where: { email },
      data: { role },
    });

    return NextResponse.json({
      message: `Usuario ${updated.email} ahora es ${role}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}
