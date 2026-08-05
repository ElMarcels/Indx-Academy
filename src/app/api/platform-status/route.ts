import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const setting = await prisma.platformSetting.upsert({
      where: { key: 'PLATFORM_CLOSED' },
      update: {},
      create: { key: 'PLATFORM_CLOSED', value: 'false' },
    });
    return NextResponse.json({ closed: setting.value === 'true' }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch {
    return NextResponse.json({ closed: false });
  }
}
