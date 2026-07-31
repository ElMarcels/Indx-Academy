import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const setting = await prisma.platformSetting.upsert({
      where: { key: 'PLATFORM_CLOSED' },
      update: {},
      create: { key: 'PLATFORM_CLOSED', value: 'false' },
    });
    return NextResponse.json({ closed: setting.value === 'true' });
  } catch {
    return NextResponse.json({ closed: false });
  }
}
