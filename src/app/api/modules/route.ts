import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUser, isCourseEditor, getCourseIdForModule } from '@/lib/permissions';

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { moduleId, title } = await req.json();
    if (!moduleId || !title) {
      return NextResponse.json({ error: 'moduleId y title son requeridos' }, { status: 400 });
    }

    const courseId = await getCourseIdForModule(moduleId);
    if (!courseId || !(await isCourseEditor(user.id, courseId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { moduleId } = await req.json();
    if (!moduleId) {
      return NextResponse.json({ error: 'moduleId es requerido' }, { status: 400 });
    }

    const courseId = await getCourseIdForModule(moduleId);
    if (!courseId || !(await isCourseEditor(user.id, courseId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.module.delete({ where: { id: moduleId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar módulo' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { title, courseId, order } = await req.json();

    if (!title || !courseId) {
      return NextResponse.json(
        { error: 'Título y courseId son requeridos' },
        { status: 400 }
      );
    }

    if (!(await isCourseEditor(user.id, courseId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
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
