import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: { lessonId: string; activityId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || (session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, description, type, content, config, maxScore, dueDate, order } =
    await req.json()

  const activity = await prisma.activity.update({
    where: { id: params.activityId },
    data: {
      title: title ?? undefined,
      description: description ?? undefined,
      type: type ?? undefined,
      content: content ?? undefined,
      config: config ?? undefined,
      maxScore: maxScore ?? undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      order: order ?? undefined,
    },
  })

  return NextResponse.json(activity)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { lessonId: string; activityId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || (session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.activity.delete({
    where: { id: params.activityId },
  })

  return NextResponse.json({ success: true })
}
