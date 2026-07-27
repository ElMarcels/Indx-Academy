import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { activityId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { content, fileUrl } = await req.json()

  const submission = await prisma.activitySubmission.upsert({
    where: {
      activityId_userId: {
        activityId: params.activityId,
        userId: user.id,
      },
    },
    update: {
      content,
      fileUrl: fileUrl ?? undefined,
      status: 'SUBMITTED',
    },
    create: {
      content,
      fileUrl: fileUrl ?? undefined,
      activityId: params.activityId,
      userId: user.id,
      status: 'SUBMITTED',
    },
  })

  return NextResponse.json(submission, { status: 201 })
}
