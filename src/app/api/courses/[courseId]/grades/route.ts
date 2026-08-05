import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DEFAULT_RANGES = [{ label: 'Suspenso', min: 0, max: 49, color: 'red' }, { label: 'Aprobado', min: 50, max: 69, color: 'yellow' }, { label: 'Notable', min: 70, max: 89, color: 'blue' }, { label: 'Sobresaliente', min: 90, max: 100, color: 'green' }];

export async function GET(_: NextRequest, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const attempts = await prisma.quizAttempt.findMany({ where: { userId, quiz: { module: { courseId: params.courseId } } }, select: { score: true, total: true } });
  const score = attempts.length ? Math.round(attempts.reduce((sum, a) => sum + (a.total ? a.score / a.total * 100 : 0), 0) / attempts.length) : null;
  const scale = await prisma.gradingScale.findFirst({ where: { courseId: params.courseId } }) || await prisma.gradingScale.findFirst({ where: { isGlobal: true } });
  let ranges = DEFAULT_RANGES;
  try { if (scale) ranges = JSON.parse(scale.ranges); } catch { /* default */ }
  const grade = score === null ? null : ranges.find((r: any) => score >= r.min && score <= r.max) || null;
  return NextResponse.json({ score, grade, scale: { name: scale?.name || 'Escala estándar', ranges }, quizCount: attempts.length });
}
