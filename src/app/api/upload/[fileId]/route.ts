import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    await prisma.lessonFile.delete({ where: { id: params.fileId } });
    return NextResponse.json({ message: 'Archivo eliminado' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
