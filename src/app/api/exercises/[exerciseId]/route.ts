import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { exerciseId: string } }
) {
  try {
    const exercise = await prisma.codeExercise.findUnique({
      where: { id: params.exerciseId },
    });

    if (!exercise) {
      return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      exercise: {
        ...exercise,
        testCases: JSON.parse(exercise.testCases),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
