import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { moduleId, title } = await req.json();
    if (!moduleId || !title) {
      return NextResponse.json({ error: 'moduleId y title son requeridos' }, { status: 400 });
    }

    const module = await prisma.module.update({
      where: { id: moduleId },
      data: { title },
    });

    return NextResponse.json(module);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar módulo' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { moduleId } = await req.json();
    if (!moduleId) {
      return NextResponse.json({ error: 'moduleId es requerido' }, { status: 400 });
    }

    await prisma.module.delete({ where: { id: moduleId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar módulo' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { title, courseId, order } = await req.json();

    if (!title || !courseId) {
      return NextResponse.json(
        { error: 'Título y courseId son requeridos' },
        { status: 400 }
      );
    }

    const existingModules = await prisma.module.count({
      where: { courseId },
    });

    const module = await prisma.module.create({
      data: {
        title,
        courseId,
        order: order || existingModules + 1,
      },
    });

    return NextResponse.json(module, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear módulo' }, { status: 500 });
  }
}
