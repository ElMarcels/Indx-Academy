export interface CourseWithModules {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  isPublished: boolean;
  category: string | null;
  level: string;
  duration: string | null;
  authorId: string;
  createdAt: Date;
  author: {
    name: string | null;
    image: string | null;
  };
  modules: {
    id: string;
    title: string;
    order: number;
    lessons: {
      id: string;
      title: string;
      duration: number | null;
      isFree: boolean;
      order: number;
    }[];
  }[];
  _count?: {
    enrollments: number;
  };
}

export interface LessonWithModule {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  task: string | null;
  order: number;
  isFree: boolean;
  module: {
    id: string;
    title: string;
    course: {
      id: string;
      title: string;
      slug: string;
    };
  };
  files?: {
    id: string;
    name: string;
    url: string;
    size: number | null;
    type: string | null;
  }[];
}

export interface UserProgress {
  lessonId: string;
  completed: boolean;
}

// ─── Quiz Types ─────────────────────────────────────────

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  order: number;
}

export interface QuizWithQuestions {
  id: string;
  title: string;
  description: string | null;
  questions: QuizQuestion[];
}

export interface QuizAttemptResult {
  id: string;
  score: number;
  total: number;
  answers: number[];
  passed: boolean;
  createdAt: Date;
}

// ─── Challenge Types ────────────────────────────────────

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  points: number;
  courseId: string;
}

export interface ChallengeWithSubmissions extends Challenge {
  submissions?: {
    id: string;
    status: string;
    content: string;
    feedback: string | null;
    createdAt: Date;
  }[];
}

// ─── Admin Stats ────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalLessons: number;
  totalEnrollments: number;
  recentEnrollments: {
    id: string;
    enrolledAt: Date;
    user: { name: string | null; email: string };
    course: { title: string };
  }[];
}
