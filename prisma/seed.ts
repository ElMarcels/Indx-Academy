import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@indx.academy' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@indx.academy',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  // Create demo student
  const studentPassword = await bcrypt.hash('student123', 12);
  const student = await prisma.user.upsert({
    where: { email: 'student@indx.academy' },
    update: {},
    create: {
      name: 'Estudiante Demo',
      email: 'student@indx.academy',
      password: studentPassword,
      role: 'STUDENT',
      emailVerified: new Date(),
    },
  });

  // Create sample courses (all free!)
  const jsCourse = await prisma.course.upsert({
    where: { slug: 'javascript-moderno' },
    update: {},
    create: {
      title: 'JavaScript Moderno',
      slug: 'javascript-moderno',
      description: 'Aprende JavaScript desde cero hasta nivel avanzado. Domina ES6+, async/await, manipulación del DOM y mucho más.',
      isPublished: true,
      category: 'Desarrollo Web',
      level: 'BEGINNER',
      duration: '40h',
      authorId: admin.id,
    },
  });

  const reactCourse = await prisma.course.upsert({
    where: { slug: 'react-completo' },
    update: {},
    create: {
      title: 'React Completo',
      slug: 'react-completo',
      description: 'Domina React desde los componentes básicos hasta hooks avanzados, Context API y patrones de diseño.',
      isPublished: true,
      category: 'Desarrollo Web',
      level: 'INTERMEDIATE',
      duration: '35h',
      authorId: admin.id,
    },
  });

  const pythonCourse = await prisma.course.upsert({
    where: { slug: 'python-cientifico' },
    update: {},
    create: {
      title: 'Python para Ciencia de Datos',
      slug: 'python-cientifico',
      description: 'Aprende Python aplicado a análisis de datos, visualización, machine learning y más.',
      isPublished: true,
      category: 'Ciencia de Datos',
      level: 'BEGINNER',
      duration: '50h',
      authorId: admin.id,
    },
  });

  // Create modules and lessons for JS course
  const jsModule1 = await prisma.module.create({
    data: {
      title: 'Introducción a JavaScript',
      order: 1,
      courseId: jsCourse.id,
    },
  });

  const jsModule2 = await prisma.module.create({
    data: {
      title: 'Funciones y Scope',
      order: 2,
      courseId: jsCourse.id,
    },
  });

  const jsLesson1 = await prisma.lesson.create({
    data: {
      title: '¿Qué es JavaScript?',
      description: 'Historia, usos y por qué aprender JavaScript.',
      content: `## ¿Qué es JavaScript?

JavaScript es un lenguaje de programación que se utiliza para crear contenido interactivo en páginas web.

### Historia
- Creado por Brendan Eich en 1995 en Netscape
- Originalmente se llamó "Mocha" y luego "LiveScript"
- Se renombró a JavaScript como estrategia de marketing (relacionado con Java)

### Usos de JavaScript
1. **Desarrollo Web Frontend**: Hace las páginas web interactivas
2. **Desarrollo Backend**: Con Node.js
3. **Aplicaciones Móviles**: React Native, Ionic
4. **Aplicaciones de Escritorio**: Electron
5. **Inteligencia Artificial**: TensorFlow.js

### ¿Por qué aprender JavaScript?
- Es el lenguaje más popular del mundo
- Tiene una comunidad enorme
- Salidas laborales muy variadas
- Es relativamente fácil de aprender
- Permite ser fullstack con un solo lenguaje`,
      task: 'Investiga y escribe 3 ejemplos reales de uso de JavaScript en la web cotidiana. Piensa en páginas que uses a diario y cómo JavaScript las hace funcionar.',
      order: 1,
      isFree: true,
      moduleId: jsModule1.id,
    },
  });

  const jsLesson2 = await prisma.lesson.create({
    data: {
      title: 'Variables y Tipos de Datos',
      description: 'let, const, var y los tipos primitivos.',
      content: `## Variables y Tipos de Datos

### Declaración de Variables

\`\`\`javascript
// Moderno (recomendado)
const nombre = "Juan";    // No se puede reasignar
let edad = 25;            // Se puede reasignar

// Antiguo (evitar)
var antiguo = "no usar";
\`\`\`

### Tipos Primitivos
1. **String**: Texto → \`"Hola"\`, \`'Mundo'\`, \`\\\`Template\\\`\`
2. **Number**: Números → \`42\`, \`3.14\`, \`-7\`
3. **Boolean**: Verdadero/Falso → \`true\`, \`false\`
4. **undefined**: Sin valor asignado
5. **null**: Valor vacío intencional
6. **Symbol**: Identificador único
7. **BigInt**: Números muy grandes

### typeof
\`\`\`javascript
typeof "Hola"    // "string"
typeof 42        // "number"
typeof true      // "boolean"
typeof undefined // "undefined"
typeof null      // "object" (bug conocido)
\`\`\``,
      task: 'Crea un script en JavaScript que declare variables de cada tipo primitivo y use typeof para mostrar el tipo de cada una. Ejecútalo en la consola del navegador.',
      order: 2,
      isFree: true,
      moduleId: jsModule1.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Operadores y Condicionales',
      description: 'Operadores lógicos, if/else y switch.',
      content: 'En esta lección aprenderás sobre operadores lógicos, condicionales if/else y switch en JavaScript.',
      task: 'Escribe un programa que pida una nota del 0 al 10 y muestre la calificación (A, B, C, D, F) usando if/else.',
      order: 3,
      isFree: false,
      moduleId: jsModule1.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Bucles y Iteración',
      description: 'for, while, for...of y métodos de arrays.',
      content: 'En esta lección aprenderás sobre bucles: for, while, do-while, for...of y los métodos de arrays más importantes.',
      task: 'Crea una función que reciba un array de números y devuelva la suma de todos ellos usando for...of.',
      order: 4,
      isFree: false,
      moduleId: jsModule1.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Funciones Declaradas vs Expresiones',
      description: 'Diferencias y cuándo usar cada una.',
      content: 'En esta lección verás las diferencias entre funciones declaradas y expresiones de función.',
      task: 'Reescribe 3 funciones declaradas como expresiones de función y viceversa.',
      order: 1,
      isFree: false,
      moduleId: jsModule2.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Arrow Functions',
      description: 'Sintaxis moderna y casos de uso.',
      content: 'En esta lección aprenderás sobre las arrow functions, su sintaxis concisa y cuándo usarlas.',
      task: 'Convierte 5 funciones regulares a arrow functions y explica en cuáles NO deberías usar arrow functions.',
      order: 2,
      isFree: false,
      moduleId: jsModule2.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Scope y Closures',
      description: 'Entiende el alcance de las variables y las clausuras.',
      content: 'En esta lección profundizarás en el scope de JavaScript y el concepto de closures.',
      task: 'Crea un contador usando closures que tenga métodos increment, decrement y getValue.',
      order: 3,
      isFree: false,
      moduleId: jsModule2.id,
    },
  });

  // Modules for React course
  const reactModule1 = await prisma.module.create({
    data: {
      title: 'Fundamentos de React',
      order: 1,
      courseId: reactCourse.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: '¿Qué es React?',
      description: 'Introducción a React y su filosofía.',
      content: 'React es una biblioteca de JavaScript para construir interfaces de usuario, creada por Meta (Facebook).',
      task: 'Instala React en un proyecto nuevo usando Vite y crea un "Hola Mundo" básico.',
      order: 1,
      isFree: true,
      moduleId: reactModule1.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Tu primer componente',
      description: 'Crea tu primer componente React.',
      content: 'Los componentes son la base de React. Aprende a crear tu primer componente funcional.',
      task: 'Crea 3 componentes diferentes: Header, Footer y Sidebar. Cada uno debe renderizar contenido diferente.',
      order: 2,
      isFree: true,
      moduleId: reactModule1.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'JSX y Props',
      description: 'Aprende JSX y el paso de propiedades.',
      content: 'JSX es la extención de sintaxis de React. Las props son la forma de pasar datos entre componentes.',
      task: 'Crea un componente Card que reciba title, description y image como props.',
      order: 3,
      isFree: false,
      moduleId: reactModule1.id,
    },
  });

  // Create quiz for JS module 1
  const jsQuiz = await prisma.quiz.create({
    data: {
      title: 'Quiz: Fundamentos de JavaScript',
      description: 'Pon a prueba tus conocimientos sobre variables, tipos de datos y operadores.',
      moduleId: jsModule1.id,
      questions: {
        create: [
          {
            question: '¿Cuál es la diferencia principal entre let y const?',
            options: JSON.stringify([
              'let permite reasignar, const no',
              'const es más rápido que let',
              'let es global, const es local',
              'No hay diferencia',
            ]),
            correctIndex: 0,
            explanation: 'const declara una constante que no puede ser reasignada. let permite reasignación.',
            order: 1,
          },
          {
            question: '¿Qué retorna typeof null?',
            options: JSON.stringify(['"null"', '"undefined"', '"object"', '"boolean"']),
            correctIndex: 2,
            explanation: 'Es un bug histórico de JavaScript que typeof null retorna "object".',
            order: 2,
          },
          {
            question: '¿Cuál es la forma correcta de declarar una variable que no cambiará?',
            options: JSON.stringify([
              'var nombre = "Ana"',
              'let nombre = "Ana"',
              'const nombre = "Ana"',
              'variable nombre = "Ana"',
            ]),
            correctIndex: 2,
            explanation: 'const es la mejor opción cuando el valor no será reasignado.',
            order: 3,
          },
        ],
      },
    },
  });

  // Create challenge for JS course
  await prisma.challenge.create({
    data: {
      title: 'Calculadora de arrays',
      description: 'Crea una función en JavaScript que reciba un array de números y realice las siguientes operaciones:\n\n1. Suma de todos los elementos\n2. Promedio\n3. Valor máximo\n4. Valor mínimo\n5. Filtrar números pares\n\nTu función debe devolver un objeto con estos 5 resultados. Incluye manejo de arrays vacíos.',
      difficulty: 'EASY',
      points: 10,
      courseId: jsCourse.id,
    },
  });

  await prisma.challenge.create({
    data: {
      title: 'Sistema de colas (Queue)',
      description: 'Implementa una clase Queue en JavaScript con los métodos:\n\n- enqueue(item): Agrega un elemento al final\n- dequeue(): Remueve y retorna el primer elemento\n- peek(): Retorna el primer elemento sin removerlo\n- isEmpty(): Retorna true si está vacía\n- size(): Retorna el tamaño\n- toString(): Retorna representación en string\n\nIncluye manejo de errores cuando la cola está vacía.',
      difficulty: 'MEDIUM',
      points: 25,
      courseId: jsCourse.id,
    },
  });

  // Create quiz for React course module 1
  await prisma.quiz.create({
    data: {
      title: 'Quiz: Fundamentos de React',
      description: 'Evalúa tu comprensión de componentes, JSX y props.',
      moduleId: reactModule1.id,
      questions: {
        create: [
          {
            question: '¿Qué es JSX?',
            options: JSON.stringify([
              'Un lenguaje de programación',
              'Una extensión de sintaxis para JavaScript',
              'Un framework CSS',
              'Una base de datos',
            ]),
            correctIndex: 1,
            explanation: 'JSX es una extensión de sintaxis de JavaScript que permite escribir HTML-like dentro del código de React.',
            order: 1,
          },
          {
            question: '¿Cómo se pasan datos de un componente padre a uno hijo?',
            options: JSON.stringify([
              'Usando state',
              'Usando props',
              'Usando context',
              'Usando refs',
            ]),
            correctIndex: 1,
            explanation: 'Las props (propiedades) son la forma estándar de pasar datos de padre a hijo.',
            order: 2,
          },
        ],
      },
    },
  });

  // Enroll demo student in JS course
  await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: jsCourse.id,
    },
  });

  console.log('Database seeded successfully!');
  console.log('Admin: admin@indx.academy / admin123');
  console.log('Student: student@indx.academy / student123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
