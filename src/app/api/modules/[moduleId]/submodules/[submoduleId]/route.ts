import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: { moduleId: string; submoduleId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, order } = await req.json()

  const submodule = await prisma.submodule.update({
    where: { id: params.submoduleId },
    data: { title, order },
  })

  return NextResponse.json(submodule)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { moduleId: string; submoduleId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.lesson.updateMany({
    where: { submoduleId: params.submoduleId },
    data: { submoduleId: null },
  })

  await prisma.submodule.delete({
    where: { id: params.submoduleId },
  })

  return NextResponse.json({ success: true })
}
