import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { term: { contains: search, mode: 'insensitive' } },
        { definition: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;

    const terms = await prisma.glossaryTerm.findMany({
      where,
      orderBy: { term: 'asc' },
    });

    return NextResponse.json({ terms });
  } catch {
    return NextResponse.json({ error: 'Error al cargar glosario' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { term, definition, example, category } = body;

    if (!term?.trim() || !definition?.trim()) {
      return NextResponse.json({ error: 'Término y definición son requeridos' }, { status: 400 });
    }

    const glossaryTerm = await prisma.glossaryTerm.create({
      data: {
        term: term.trim(),
        definition: definition.trim(),
        example: example || null,
        category: category || null,
      },
    });

    return NextResponse.json({ term: glossaryTerm }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear término' }, { status: 500 });
  }
}
