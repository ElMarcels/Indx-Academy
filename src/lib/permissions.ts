import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  return user;
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === 'ADMIN';
}

// Admin OR teacher of the given course
export async function isCourseEditor(
  userId: string,
  courseId: string
): Promise<boolean> {
  if (await isAdminUser(userId)) return true;
  const teacher = await prisma.courseTeacher.findUnique({
    where: { courseId_userId: { courseId, userId } },
  });
  return !!teacher;
}

// Resolve the course that a module belongs to
export async function getCourseIdForModule(moduleId: string): Promise<string | null> {
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { courseId: true },
  });
  return module?.courseId ?? null;
}

// Resolve the course that a lesson belongs to
export async function getCourseIdForLesson(lessonId: string): Promise<string | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  return lesson?.module.courseId ?? null;
}

// Resolve the course that a quiz belongs to
export async function getCourseIdForQuiz(quizId: string): Promise<string | null> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { module: { select: { courseId: true } } },
  });
  return quiz?.module.courseId ?? null;
}

// Resolve the course that a challenge belongs to
export async function getCourseIdForChallenge(challengeId: string): Promise<string | null> {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { courseId: true },
  });
  return challenge?.courseId ?? null;
}

// Resolve the course that a course template belongs to
export async function getCourseIdForTemplate(templateId: string): Promise<string | null> {
  const template = await prisma.courseTemplate.findUnique({
    where: { id: templateId },
    select: { courseId: true },
  });
  return template?.courseId ?? null;
}

// Resolve the course that a lesson file belongs to
export async function getCourseIdForLessonFile(fileId: string): Promise<string | null> {
  const file = await prisma.lessonFile.findUnique({
    where: { id: fileId },
    select: { lesson: { select: { module: { select: { courseId: true } } } } },
  });
  return file?.lesson.module.courseId ?? null;
}
