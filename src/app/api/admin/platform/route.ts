import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const setting = await prisma.platformSetting.upsert({
      where: { key: 'PLATFORM_CLOSED' },
      update: {},
      create: { key: 'PLATFORM_CLOSED', value: 'false' },
    });

    return NextResponse.json({ closed: setting.value === 'true' });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { closed } = await req.json();
    if (typeof closed !== 'boolean') {
      return NextResponse.json({ error: 'closed debe ser un booleano' }, { status: 400 });
    }

    const setting = await prisma.platformSetting.upsert({
      where: { key: 'PLATFORM_CLOSED' },
      update: { value: closed ? 'true' : 'false' },
      create: { key: 'PLATFORM_CLOSED', value: closed ? 'true' : 'false' },
    });

    return NextResponse.json({ closed: setting.value === 'true' });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
