import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  const activities = await prisma.activity.findMany({
    where: { lessonId: params.lessonId },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(activities)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, description, type, content, config, maxScore, dueDate, order } =
    await req.json()

  const activity = await prisma.activity.create({
    data: {
      title,
      description,
      type,
      content: content ?? undefined,
      config: config ?? undefined,
      maxScore: maxScore ?? undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      order,
      lessonId: params.lessonId,
    },
  })

  return NextResponse.json(activity, { status: 201 })
}
