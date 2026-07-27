import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: { activityId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, score, feedback } = await req.json()

  const submission = await prisma.activitySubmission.update({
    where: {
      activityId_userId: {
        activityId: params.activityId,
        userId,
      },
    },
    data: {
      score,
      feedback: feedback ?? undefined,
      status: 'GRADED',
    },
  })

  return NextResponse.json(submission)
}
