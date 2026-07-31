import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isCourseEditor, getCourseIdForModule } from '@/lib/permissions'

export async function PUT(
  req: NextRequest,
  { params }: { params: { moduleId: string; submoduleId: string } }
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
  const user = await getCurrentUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const courseId = await getCourseIdForModule(params.moduleId)
  if (!courseId || !(await isCourseEditor(user.id, courseId))) {
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
