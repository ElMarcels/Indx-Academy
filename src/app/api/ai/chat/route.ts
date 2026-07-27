import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

function buildContextPrompt(
  message: string,
  courseContext: { title: string; description: string } | null,
  matchedCourses: { title: string; description: string; category: string | null; level: string }[],
  matchedLessons: { title: string; content: string | null; module: { title: string; course: { title: string } } }[],
  matchedGlossary: { term: string; definition: string; example: string | null; category: string | null }[],
): string {
  const parts: string[] = [];

  parts.push(`Eres el asistente de IA de Indx Academy, una plataforma de educación en línea. Tu nombre es Indx Assistant. Responde siempre en español de forma amigable y helpful.\n`);
  parts.push(`Pregunta del usuario: "${message}"\n`);

  if (courseContext) {
    parts.push(`El usuario está consultando sobre el curso: "${courseContext.title}". Descripción: ${courseContext.description}\n`);
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
      const preview = l.content ? l.content.substring(0, 300).replace(/[#*_`]/g, '').trim() : 'Sin contenido disponible';
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

  parts.push('Instrucciones de respuesta:');
  parts.push('- Si hay contenido relevante, úsalo para construir tu respuesta y menciona de qué curso/lección proviene.');
  parts.push('- Sé conciso pero completo. Usa formato markdown cuando sea útil (listas, código).');
  parts.push('- Si la pregunta es sobre programación, incluye ejemplos de código cuando sea apropiado.');
  parts.push('- Si no sabes algo, sé honesto y sugiere al usuario consultar el contenido del curso correspondiente.');

  return parts.join('\n');
}

function generateSmartResponse(
  message: string,
  courseContext: { title: string; description: string } | null,
  matchedCourses: { title: string; description: string; category: string | null; level: string }[],
  matchedLessons: { title: string; content: string | null; module: { title: string; course: { title: string } } }[],
  matchedGlossary: { term: string; definition: string; example: string | null; category: string | null }[],
): string {
  const lowerMsg = message.toLowerCase();

  if (matchedGlossary.length > 0 && matchedLessons.length === 0 && matchedCourses.length === 0) {
    const g = matchedGlossary[0];
    let response = `¡Buena pregunta! Aquí tienes lo que encontré en el glosario:\n\n`;
    response += `**${g.term}**\n${g.definition}\n`;
    if (g.example) response += `\nEjemplo: ${g.example}\n`;
    if (matchedGlossary.length > 1) {
      response += `\nTambién relacionados: ${matchedGlossary.slice(1, 4).map(t => `"${t.term}"`).join(', ')}.`;
    }
    response += `\n\n¿Te gustaría saber más sobre algún tema en particular?`;
    return response;
  }

  if (matchedLessons.length > 0 && matchedCourses.length <= 1) {
    const l = matchedLessons[0];
    let response = `Encontré información relevante en la plataforma:\n\n`;
    response += `📚 **${l.module.course.title}** → ${l.module.title} → **${l.title}**\n\n`;

    if (l.content) {
      const cleanContent = l.content.replace(/[#*_`]/g, '').trim();
      const preview = cleanContent.substring(0, 500);
      response += `${preview}`;
      if (cleanContent.length > 500) response += '...';
      response += '\n\n';
    }

    if (matchedLessons.length > 1) {
      response += `También encontré estas lecciones relacionadas:\n`;
      for (const ml of matchedLessons.slice(1, 4)) {
        response += `- "${ml.title}" en ${ml.module.course.title}\n`;
      }
      response += '\n';
    }

    response += `¿Quieres que te explique algo específico de esta lección?`;
    return response;
  }

  if (matchedCourses.length > 0) {
    let response = `¡Encontré cursos que podrían ayudarte!\n\n`;
    for (const c of matchedCourses.slice(0, 3)) {
      response += `🎓 **${c.title}** (${c.level})\n${c.description.substring(0, 150)}${c.description.length > 150 ? '...' : ''}\n\n`;
    }
    response += `¿Te gustaría más detalles sobre alguno de estos cursos?`;
    return response;
  }

  if (courseContext) {
    let response = `Sobre el curso **${courseContext.title}**:\n\n`;
    response += `Lamentablemente no encontré contenido específico que coincida exactamente con tu pregunta dentro de este curso.\n\n`;
    response += `Te sugiero revisar las lecciones disponibles en el curso o intentar reformular tu pregunta con términos más específicos.\n\n`;
    response += `¿Hay algo más en lo que pueda ayudarte?`;
    return response;
  }

  const greetings = ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey'];
  if (greetings.some(g => lowerMsg.startsWith(g) || lowerMsg === g)) {
    return `¡Hola! 👋 Soy el asistente de IA de Indx Academy.\n\nPuedo ayudarte con:\n- Explicar conceptos de programación\n- Responder dudas sobre los cursos\n- Definir términos del glosario técnico\n- Orientarte sobre qué curso seguir\n\n¿En qué puedo ayudarte hoy?`;
  }

  if (lowerMsg.includes('curso') && (lowerMsg.includes('cuál') || lowerMsg.includes('cual') || lowerMsg.includes('recomendar') || lowerMsg.includes('empezar') || lowerMsg.includes('iniciar'))) {
    return `Para recomendarte un curso, necesito saber un poco más sobre ti.\n\n¿Qué área te interesa?\n- 🌐 Desarrollo Web (HTML, CSS, JavaScript)\n- ⚛️ Frameworks como React o Next.js\n- 🐍 Programación en Python\n- 📱 Desarrollo móvil\n- 💻 Programación general\n\nTambién puedes usar el selector de cursos en el chat para elegir un curso específico y preguntar sobre su contenido.`;
  }

  if (lowerMsg.includes('certificado') || lowerMsg.includes('certificación')) {
    return `Los certificados de Indx Academy se generan automáticamente al completar un curso.\n\nRequisitos:\n1. Estar inscrito en el curso\n2. Completar todas las lecciones\n3. Aprobar los quizzes (si los hay)\n4. Completar los desafíos (si los hay)\n\nUna vez que completes todo, recibirás tu certificado con un número único de verificación.`;
  }

  if (lowerMsg.includes('progreso') || lowerMsg.includes('avance')) {
    return `Puedes ver tu progreso en el **Dashboard** de la plataforma.\n\nAllí encontrarás:\n- Tus cursos inscritos y porcentaje de avance\n- Lecciones completadas\n- Logros desbloqueados\n- Estadísticas generales\n\n¿Tienes alguna duda sobre tu progreso en algún curso en particular?`;
  }

  if (lowerMsg.includes('ejercicio') || lowerMsg.includes('desafío') || lowerMsg.includes('challenge')) {
    return `Los ejercicios y desafíos son una parte clave del aprendizaje en Indx Academy.\n\n**Ejercicios de código:**\n- Aparecen dentro de las lecciones\n- Puedes escribir y ejecutar código directamente\n- Recibes retroalimentación inmediata\n\n**Desafíos:**\n- Son retos más completos al final de los módulos\n- Se evalúan manualmente o automáticamente\n- Otorgan puntos extra\n\n¿Necesitas ayuda con algún ejercicio específico?`;
  }

  return `No encontré contenido específico en la plataforma relacionado con tu pregunta, pero puedo ayudarte de otras formas:\n\n- **Pregunta sobre un curso específico** → Selecciona un curso en el chat para contextualizar\n- **Conceptos de programación** → Pregúntame directamente\n- **Términos técnicos** → Consulto el glosario de la plataforma\n\n¿Qué te gustaría saber?`;
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

    const assistantResponse = generateSmartResponse(
      message,
      courseContext,
      matchedCourses,
      matchedLessons,
      matchedGlossary,
    );

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
    console.error('AI chat error:', error);
    return NextResponse.json({ error: 'Error al procesar el mensaje' }, { status: 500 });
  }
}
