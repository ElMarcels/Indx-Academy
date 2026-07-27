import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

type ContentType =
  | 'lesson_content'
  | 'lesson_task'
  | 'quiz_questions'
  | 'exercise'
  | 'challenge'
  | 'course_description'
  | 'module_description'
  | 'glossary_term'
  | 'flashcards';

const contentPrompts: Record<ContentType, (ctx: ContentContext) => string> = {
  lesson_content: (ctx) =>
    `Genera el CONTENIDO de una lección en formato Markdown para un curso de programación.
Curso: "${ctx.courseTitle}"${ctx.moduleTitle ? `\nMódulo: "${ctx.moduleTitle}"` : ''}${ctx.lessonTitle ? `\nLección: "${ctx.lessonTitle}"` : ''}
${ctx.additionalContext ? `Contexto adicional: ${ctx.additionalContext}` : ''}

Requisitos:
- Escribe contenido educativo claro y bien estructurado
- Usa Markdown: títulos (##, ###), listas, código con bloques \`\`\`
- Incluye ejemplos prácticos de código cuando sea apropiado
- Explica el "por qué" no solo el "cómo"
- Extensión: 400-800 palabras
- Solo devuelve el contenido Markdown, sin explicaciones adicionales sobre lo que generaste`,

  lesson_task: (ctx) =>
    `Genera una TAREA/PRÁCTICA para una lección de programación.
Curso: "${ctx.courseTitle}"${ctx.moduleTitle ? `\nMódulo: "${ctx.moduleTitle}"` : ''}${ctx.lessonTitle ? `\nLección: "${ctx.lessonTitle}"` : ''}
${ctx.additionalContext ? `Contexto adicional: ${ctx.additionalContext}` : ''}

Requisitos:
- Describe un ejercicio práctico que el estudiante debe completar
- Incluye objetivos claros
- Especifica requisitos técnicos
- Da ejemplos de lo esperado
- Usa formato Markdown
- Solo devuelve la tarea, sin explicaciones adicionales`,

  quiz_questions: (ctx) =>
    `Genera 5 preguntas de tipo opción múltiple para un quiz de programación.
Curso: "${ctx.courseTitle}"${ctx.moduleTitle ? `\nMódulo: "${ctx.moduleTitle}"` : ''}
${ctx.additionalContext ? `Contexto adicional: ${ctx.additionalContext}` : ''}

Responde EXACTAMENTE en este formato JSON (sin markdown, sin código, solo el JSON):
{
  "questions": [
    {
      "question": "Texto de la pregunta",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctIndex": 0,
      "explanation": "Explicación de por qué la respuesta correcta es la A",
      "difficulty": "MEDIUM"
    }
  ]
}

Requisitos:
- 5 preguntas con exactamente 4 opciones cada una
- Mezcla dificultades: 2 EASY, 2 MEDIUM, 1 HARD
- La explicación debe ser clara y educativa
- Solo el JSON, nada más`,

  exercise: (ctx) =>
    `Genera un ejercicio de código interactivo para una lección de programación.
Curso: "${ctx.courseTitle}"${ctx.moduleTitle ? `\nMódulo: "${ctx.moduleTitle}"` : ''}${ctx.lessonTitle ? `\nLección: "${ctx.lessonTitle}"` : ''}
${ctx.additionalContext ? `Contexto adicional: ${ctx.additionalContext}` : ''}

Responde EXACTAMENTE en este formato JSON (sin markdown, sin código, solo el JSON):
{
  "title": "Título del ejercicio",
  "description": "Descripción del ejercicio en Markdown",
  "language": "javascript",
  "starterCode": "// Código inicial que el estudiante modifica\\nfunction ejemplo() {\\n  // Tu código aquí\\n}",
  "solution": "// Solución completa\\nfunction ejemplo() {\\n  return 'resultado';\\n}",
  "testCases": [
    { "input": "parámetro de entrada", "expected": "resultado esperado" },
    { "input": "parámetro de entrada 2", "expected": "resultado esperado 2" }
  ],
  "difficulty": "MEDIUM",
  "points": 10
}

Requisitos:
- El ejercicio debe ser claro y autocontenido
- Incluye al menos 3 test cases
- El starter code debe ser un buen punto de partida
- difficulty: EASY, MEDIUM, o HARD
- points: 5-50 según dificultad
- Solo el JSON, nada más`,

  challenge: (ctx) =>
    `Genera un desafío de programación para un curso.
Curso: "${ctx.courseTitle}"
${ctx.additionalContext ? `Contexto adicional: ${ctx.additionalContext}` : ''}

Responde EXACTAMENTE en este formato JSON (sin markdown, sin código, solo el JSON):
{
  "title": "Título del desafío",
  "description": "Descripción completa del desafío en Markdown. Incluye: objetivos, requisitos técnicos, criterios de evaluación, ejemplo de uso esperado.",
  "difficulty": "MEDIUM",
  "points": 20
}

Requisitos:
- El desafío debe ser retador pero alcanzable
- La descripción debe ser completa y autocontenida
- difficulty: EASY (10pts), MEDIUM (20pts), o HARD (30-50pts)
- Solo el JSON, nada más`,

  course_description: (ctx) =>
    `Genera una descripción profesional para un curso de programación.
Título del curso: "${ctx.courseTitle}"
${ctx.additionalContext ? `Detalles adicionales: ${ctx.additionalContext}` : ''}

Requisitos:
- Descripción atractiva y persuasiva (150-250 palabras)
- Menciona qué aprenderá el estudiante
- Menciona los prerequisitos si los hay
- Menciona el nivel (principiante/intermedio/avanzado)
- Tone profesional pero accesible
- Solo el texto de la descripción, sin explicaciones`,

  module_description: (ctx) =>
    `Genera una descripción para un módulo de un curso de programación.
Curso: "${ctx.courseTitle}"
Módulo: "${ctx.moduleTitle}"
${ctx.additionalContext ? `Contexto adicional: ${ctx.additionalContext}` : ''}

Requisitos:
- Descripción concisa (50-100 palabras)
- Explica qué cubre el módulo
- Menciona qué aprenderá el estudiante
- Solo el texto, sin explicaciones`,

  glossary_term: (ctx) =>
    `Genera una definición de glosario técnico para programación.
Término: "${ctx.additionalContext || 'Término no especificado'}"

Responde EXACTAMENTE en este formato JSON (sin markdown, sin código, solo el JSON):
{
  "term": "Nombre del término",
  "definition": "Definición clara y concisa del término",
  "example": "Ejemplo práctico de uso en código o contexto",
  "category": "Categoría (ej: JavaScript, Python, General, Frameworks, etc.)"
}

Requisitos:
- Definición precisa y fácil de entender
- Ejemplo práctico y relevante
- Categoría apropiada
- Solo el JSON, nada más`,

  flashcards: (ctx) =>
    `Genera 5 flashcards para estudio de programación.
Curso: "${ctx.courseTitle}"
${ctx.additionalContext ? `Tema específico: ${ctx.additionalContext}` : ''}

Responde EXACTAMENTE en este formato JSON (sin markdown, sin código, solo el JSON):
{
  "flashcards": [
    {
      "term": "Término o concepto",
      "definition": "Definición clara y concisa",
      "example": "Ejemplo práctico o snippet de código"
    }
  ]
}

Requisitos:
- 5 flashcards con términos relevantes al curso
- Definiciones cortas pero completas
- Ejemplos prácticos cuando sea posible
- Solo el JSON, nada más`,
};

interface ContentContext {
  courseTitle: string;
  moduleTitle?: string;
  lessonTitle?: string;
  additionalContext?: string;
}

async function fetchCourseContext(courseId?: string, moduleId?: string, lessonId?: string) {
  let courseTitle = 'Programación General';
  let moduleTitle: string | undefined;
  let lessonTitle: string | undefined;

  if (courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { title: true },
    });
    if (course) courseTitle = course.title;
  }

  if (moduleId) {
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { title: true },
    });
    if (module) moduleTitle = module.title;
  }

  if (lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { title: true },
    });
    if (lesson) lessonTitle = lesson.title;
  }

  return { courseTitle, moduleTitle, lessonTitle };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: 'GOOGLE_AI_API_KEY no configurada' }, { status: 500 });
    }

    const body = await req.json();
    const { contentType, courseId, moduleId, lessonId, additionalContext } = body as {
      contentType: ContentType;
      courseId?: string;
      moduleId?: string;
      lessonId?: string;
      additionalContext?: string;
    };

    if (!contentType || !contentPrompts[contentType]) {
      return NextResponse.json({ error: 'Tipo de contenido no válido' }, { status: 400 });
    }

    const ctx = await fetchCourseContext(courseId, moduleId, lessonId);
    const prompt = contentPrompts[contentType]({ ...ctx, additionalContext });

    const model = genAI.getGenerativeModel({
      model: 'gemma-4-26b-a4b-it',
      systemInstruction: 'Eres un experto creador de contenido educativo para programación. Generas contenido de alta calidad, preciso y bien estructurado. Respondes siempre en español.',
    });

    const result = await model.generateContent(prompt);
    const generatedContent = result.response.text();

    return NextResponse.json({ content: generatedContent, contentType });
  } catch (error) {
    console.error('IndxAI admin generate error:', error);
    return NextResponse.json({ error: 'Error al generar contenido' }, { status: 500 });
  }
}
