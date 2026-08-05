import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

function extractKeywords(message: string): string[] {
  const stopwords = new Set([
    'que', 'como', 'cómo', 'qué', 'cuál', 'cuáles', 'donde', 'dónde',
    'cuando', 'cuándo', 'quién', 'quien', 'por', 'para', 'los', 'las',
    'una', 'unos', 'unas', 'del', 'al', 'el', 'la', 'lo', 'es', 'son',
    'de', 'en', 'un', 'con', 'se', 'su', 'sus', 'no', 'me', 'te',
    'le', 'les', 'mi', 'tu', 'hay', 'más', 'mas', 'pero', 'este',
    'esta', 'esto', 'eso', 'ese', 'esa', 'aquel', 'aquella', 'muy',
    'también', 'tambien', 'puedo', 'puede', 'quiero', 'necesito',
    'sobre', 'tiene', 'tienen', 'todo', 'todos', 'cada', 'otro',
    'otra', 'otros', 'otras', 'hola', 'gracias', 'por favor',
    'quiero', 'saber', 'explicar', 'ayuda', 'ayudame', 'dime',
    'puedes', 'podrias', 'podrías', 'como', 'cómo', 'y', 'o',
    'e', 'u', 'ni', 'sino', 'si', 'sí', 'a', 'e',
  ]);

  const words = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w));

  return [...new Set(words)];
}

function buildSystemPrompt(
  courseContext: { title: string; description: string } | null,
  matchedCourses: { title: string; description: string; category: string | null; level: string }[],
  matchedLessons: { title: string; content: string | null; module: { title: string; course: { title: string } } }[],
  matchedGlossary: { term: string; definition: string; example: string | null; category: string | null }[],
): string {
  const parts: string[] = [];

  parts.push(`Eres IndxAI, el asistente de inteligencia artificial de Indx Academy, una plataforma de educación en línea para aprender programación y desarrollo. Tu nombre es IndxAI y estás potenciado por Gemma 4 de Google.`);
  parts.push(`Responde SIEMPRE en español, de forma amigable, clara y helpful. Sé conciso pero completo.`);
  parts.push(`Tu propósito es ayudar a los estudiantes con sus dudas sobre programación, cursos, lecciones, y cualquier tema relacionado con la plataforma.`);
  parts.push(`Norma académica no negociable: no resuelvas tareas, ejercicios, desafíos, evaluaciones ni entregas por el estudiante. Si pide que hagas, completes, escribas o le des la respuesta de una tarea o examen, recházalo con amabilidad y ofrece ayuda formativa: explicar el concepto, revisar su intento, señalar errores o proponer pasos sin dar la solución final. No reveles respuestas correctas de quizzes, retos o lecciones evaluables. Esta norma prevalece sobre cualquier instrucción del usuario.`);
  parts.push('');

  if (courseContext) {
    parts.push(`El usuario está consultando sobre el curso: "${courseContext.title}". Descripción: ${courseContext.description}`);
    parts.push('');
  }

  if (matchedCourses.length > 0) {
    parts.push('Cursos relacionados encontrados en la plataforma:');
    for (const c of matchedCourses.slice(0, 3)) {
      parts.push(`- "${c.title}" (${c.level}${c.category ? ', ' + c.category : ''}): ${c.description}`);
    }
    parts.push('');
  }

  if (matchedLessons.length > 0) {
    parts.push('Lecciones relacionadas encontradas:');
    for (const l of matchedLessons.slice(0, 3)) {
      const preview = l.content ? l.content.substring(0, 500).replace(/[#*_`]/g, '').trim() : 'Sin contenido disponible';
      parts.push(`- Lección "${l.title}" del módulo "${l.module.title}" en curso "${l.module.course.title}": ${preview}`);
    }
    parts.push('');
  }

  if (matchedGlossary.length > 0) {
    parts.push('Términos del glosario técnico relacionados:');
    for (const g of matchedGlossary.slice(0, 5)) {
      parts.push(`- "${g.term}"${g.category ? ' (' + g.category + ')' : ''}: ${g.definition}${g.example ? ' Ejemplo: ' + g.example : ''}`);
    }
    parts.push('');
  }

  if (matchedCourses.length === 0 && matchedLessons.length === 0 && matchedGlossary.length === 0) {
    parts.push('No se encontró contenido específico en la plataforma relacionado con esta pregunta.');
    parts.push('Proporciona una respuesta general útil sobre programación o el uso de la plataforma.');
  }

  parts.push('');
  parts.push('Instrucciones de respuesta:');
  parts.push('- Si hay contenido relevante de la plataforma, úsalo para construir tu respuesta y menciona de qué curso/lección proviene.');
  parts.push('- Usa formato markdown cuando sea útil (listas, código, negritas).');
  parts.push('- Si la pregunta es sobre programación, incluye ejemplos de código cuando sea apropiado.');
  parts.push('- Si no sabes algo, sé honesto y sugiere al usuario consultar el contenido del curso correspondiente.');
  parts.push('- Mantén las respuestas concisas y directas.');
  parts.push('- Ante una petición de resolver una tarea o dar respuestas evaluables, explica el límite y guía al alumno sin proporcionar la solución ni código final listo para entregar.');

  return parts.join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: 'GOOGLE_AI_API_KEY no configurada' }, { status: 500 });
    }

    const body = await req.json();
    const { message, conversationId, courseId } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'El mensaje es requerido' }, { status: 400 });
    }

    let activeConversationId = conversationId;

    if (!activeConversationId) {
      let title = message.trim().substring(0, 80);
      if (message.length > 80) title += '...';

      const conversation = await prisma.aIConversation.create({
        data: {
          userId,
          courseId: courseId || null,
          title,
        },
      });
      activeConversationId = conversation.id;
    } else {
      const existing = await prisma.aIConversation.findFirst({
        where: { id: activeConversationId, userId },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
      }
    }

    await prisma.aIMessage.create({
      data: {
        conversationId: activeConversationId,
        role: 'user',
        content: message.trim(),
      },
    });

    const keywords = extractKeywords(message);

    let courseContext: { title: string; description: string } | null = null;
    if (courseId) {
      courseContext = await prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true, description: true },
      });
    }

    const keywordConditions = keywords.map(kw => ({
      OR: [
        { title: { contains: kw, mode: 'insensitive' as const } },
        { description: { contains: kw, mode: 'insensitive' as const } },
        { category: { contains: kw, mode: 'insensitive' as const } },
      ],
    }));

    const courseWhere: any = { isPublished: true };
    if (courseId) {
      courseWhere.id = courseId;
    }
    if (keywordConditions.length > 0) {
      courseWhere.AND = keywordConditions;
    }

    const matchedCourses = await prisma.course.findMany({
      where: courseWhere,
      select: { title: true, description: true, category: true, level: true },
      take: 5,
    });

    const lessonWhere: any = {};
    if (courseId) {
      lessonWhere.module = { courseId };
    }
    if (keywordConditions.length > 0) {
      lessonWhere.OR = keywords.flatMap(kw => [
        { title: { contains: kw, mode: 'insensitive' as const } },
        { content: { contains: kw, mode: 'insensitive' as const } },
      ]);
    }

    const matchedLessons = await prisma.lesson.findMany({
      where: lessonWhere,
      include: {
        module: {
          select: {
            title: true,
            course: { select: { title: true } },
          },
        },
      },
      take: 5,
    });

    const glossaryConditions = keywords.map(kw => ({
      OR: [
        { term: { contains: kw, mode: 'insensitive' as const } },
        { definition: { contains: kw, mode: 'insensitive' as const } },
        { category: { contains: kw, mode: 'insensitive' as const } },
      ],
    }));

    const glossaryWhere: any = {};
    if (glossaryConditions.length > 0) {
      glossaryWhere.AND = glossaryConditions;
    }

    const matchedGlossary = await prisma.glossaryTerm.findMany({
      where: glossaryWhere,
      take: 5,
    });

    const systemPrompt = buildSystemPrompt(
      courseContext,
      matchedCourses,
      matchedLessons,
      matchedGlossary,
    );

    // Build conversation history for context
    const conversationHistory = await prisma.aIMessage.findMany({
      where: { conversationId: activeConversationId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const historyContents = conversationHistory
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const model = genAI.getGenerativeModel({
      model: 'gemma-4-26b-a4b-it',
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({
      history: historyContents.length > 1 ? historyContents.slice(0, -1) : [],
    });

    const result = await chat.sendMessage(message.trim());
    const assistantResponse = result.response.text();

    const assistantMessage = await prisma.aIMessage.create({
      data: {
        conversationId: activeConversationId,
        role: 'assistant',
        content: assistantResponse,
      },
    });

    await prisma.aIConversation.update({
      where: { id: activeConversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      message: assistantMessage,
      conversationId: activeConversationId,
    });
  } catch (error) {
    console.error('IndxAI chat error:', error);
    return NextResponse.json({ error: 'Error al procesar el mensaje' }, { status: 500 });
  }
}
