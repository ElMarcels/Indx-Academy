import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DEFAULT_RANGES = [
  { label: 'Suspenso', min: 0, max: 49, color: 'red' },
  { label: 'Aprobado', min: 50, max: 69, color: 'yellow' },
  { label: 'Notable', min: 70, max: 89, color: 'blue' },
  { label: 'Sobresaliente', min: 90, max: 100, color: 'green' },
];

export async function GET(req: NextRequest) {
  const courseId = new URL(req.url).searchParams.get('courseId');
  const scales = await prisma.gradingScale.findMany({ where: courseId ? { OR: [{ courseId }, { isGlobal: true }] } : undefined, orderBy: [{ isGlobal: 'desc' }, { name: 'asc' }] });
  return NextResponse.json({ scales, defaultRanges: DEFAULT_RANGES });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { name, courseId, ranges } = await req.json();
  if (!name?.trim() || !Array.isArray(ranges) || ranges.length === 0) return NextResponse.json({ error: 'Escala inválida' }, { status: 400 });
  if (courseId) {
    const scale = await prisma.gradingScale.upsert({ where: { courseId }, update: { name: name.trim(), ranges: JSON.stringify(ranges), isGlobal: false }, create: { name: name.trim(), courseId, ranges: JSON.stringify(ranges) } });
    return NextResponse.json({ scale });
  }
  const existing = await prisma.gradingScale.findFirst({ where: { isGlobal: true } });
  const scale = existing
    ? await prisma.gradingScale.update({ where: { id: existing.id }, data: { name: name.trim(), ranges: JSON.stringify(ranges) } })
    : await prisma.gradingScale.create({ data: { name: name.trim(), isGlobal: true, ranges: JSON.stringify(ranges) } });
  return NextResponse.json({ scale });
}
