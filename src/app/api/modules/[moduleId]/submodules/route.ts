import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  const submodules = await prisma.submodule.findMany({
    where: { moduleId: params.moduleId },
    include: { lessons: { orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(submodules)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, order } = await req.json()

  const submodule = await prisma.submodule.create({
    data: {
      title,
      order,
      moduleId: params.moduleId,
    },
  })

  return NextResponse.json(submodule, { status: 201 })
}
