import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isCourseEditor, getCourseIdForModule } from '@/lib/permissions'

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
  const user = await getCurrentUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const courseId = await getCourseIdForModule(params.moduleId)
  if (!courseId || !(await isCourseEditor(user.id, courseId))) {
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
