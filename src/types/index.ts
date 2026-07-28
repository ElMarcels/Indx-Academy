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
    quizzes: { id: string; title: string }[];
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

// ─── Achievement Types ──────────────────────────────────

export interface Achievement {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  points: number;
}

// ─── Chat Types ─────────────────────────────────────────

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
}

// ─── Group Types ────────────────────────────────────────

export interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
}

// ─── Student Types ──────────────────────────────────────

export interface StudentProfile {
  id: string;
  name: string | null;
  email: string;
  bio: string | null;
  createdAt: Date;
  _count: {
    enrollments: number;
    lessonProgress: number;
    achievements: number;
  };
}

// ─── Admin Stats ────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalLessons: number;
  totalEnrollments: number;
  totalMessages: number;
  totalAchievements: number;
  recentEnrollments: {
    id: string;
    enrolledAt: Date;
    user: { name: string | null; email: string };
    course: { title: string };
  }[];
}

// ─── Code Exercise Types ────────────────────────────────
export interface CodeExercise {
  id: string;
  title: string;
  description: string;
  language: string;
  starterCode: string | null;
  solution: string | null;
  testCases: { input: string; expected: string; description: string }[];
  difficulty: string;
  points: number;
}

// ─── Terminal Types ─────────────────────────────────────
export interface TerminalCommand {
  id: string;
  command: string;
  description: string | null;
  output: string;
  explanation: string | null;
  order: number;
}

// ─── Forum Types ────────────────────────────────────────
export interface ForumPost {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isResolved: boolean;
  userId: string;
  user: { name: string | null; image: string | null };
  _count: { replies: number };
  createdAt: string;
}

export interface ForumReply {
  id: string;
  content: string;
  userId: string;
  user: { name: string | null; image: string | null };
  createdAt: string;
}

// ─── Glossary Types ─────────────────────────────────────
export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  example: string | null;
  category: string | null;
}

// ─── Certificate Types ──────────────────────────────────
export interface Certificate {
  id: string;
  certificateNumber: string;
  completedAt: string;
  course: { title: string; slug: string };
}

// ─── Learning Path Types ────────────────────────────────
export interface LearningPath {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  level: string;
  courses: {
    order: number;
    course: {
      id: string;
      title: string;
      slug: string;
      thumbnail: string | null;
      level: string;
      _count: { enrollments: number };
    };
  }[];
}

// ─── Notification Types ─────────────────────────────────
export interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

// ─── Peer Match Types ───────────────────────────────────
export interface PeerMatch {
  id: string;
  peerId: string;
  status: string;
  message: string | null;
  peer: { name: string | null; image: string | null; bio: string | null };
  createdAt: string;
}

// ─── Call Types ─────────────────────────────────────────
export interface CallSession {
  id: string;
  type: string;
  status: string;
  callerId: string;
  caller: { name: string | null };
  startedAt: string;
}

// ─── Comment Types ──────────────────────────────────────
export interface CommentWithReplies {
  id: string;
  content: string;
  userId: string;
  user: { name: string | null; image: string | null };
  createdAt: string;
  replies: CommentWithReplies[];
}

// ─── Course Template Types ──────────────────────────────
export interface CourseTemplate {
  id: string;
  name: string;
  description: string | null;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  language: string | null;
}

// ─── Reaction Types ─────────────────────────────────────
export interface Reaction {
  id: string;
  type: string;
  userId: string;
  targetType: string;
  targetId: string;
}

// ─── Report Types ───────────────────────────────────────
export interface Report {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  reporter?: { name: string | null; email: string };
}

// ─── Survey Types ───────────────────────────────────────
export interface SurveyQuestion {
  question: string;
  type: 'stars' | 'text' | 'choice';
  options?: string[];
}

export interface Survey {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  questions: SurveyQuestion[];
  isActive: boolean;
}

// ─── Flashcard Types ────────────────────────────────────
export interface FlashcardReview {
  id: string;
  glossaryId: string;
  quality: number;
  interval: number;
  easeFactor: number;
  nextReview: string;
  reviewCount: number;
  term?: GlossaryTerm;
}

// ─── Collaborative Project Types ────────────────────────
export interface CollaborativeProject {
  id: string;
  name: string;
  description: string | null;
  language: string;
  code: string;
  groupId: string | null;
  createdById: string;
  createdAt: string;
  members?: ProjectMember[];
  createdBy?: { name: string | null; image: string | null };
}

export interface ProjectMember {
  id: string;
  userId: string;
  role: string;
  user: { name: string | null; image: string | null };
}

// ─── Path Quiz Types ────────────────────────────────────
export interface PathQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

// ─── Onboarding Types ───────────────────────────────────
export interface OnboardingState {
  completedSteps: string[];
  completedAt: string | null;
}

// ─── Submodule Types ────────────────────────────────────
export interface Submodule {
  id: string;
  title: string;
  order: number;
  moduleId: string;
  lessons?: { id: string; title: string; order: number; isFree: boolean }[];
}

// ─── Course Flashcard Types ─────────────────────────────
export interface CourseFlashcard {
  id: string;
  term: string;
  definition: string;
  example: string | null;
  order: number;
  courseId: string;
}

// ─── Course Teacher Types ───────────────────────────────
export interface CourseTeacher {
  id: string;
  courseId: string;
  userId: string;
  role: string;
  addedAt: string;
  user: { id: string; name: string | null; email: string | null; image: string | null };
}

// ─── Support Ticket Types ──────────────────────────────
export interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string | null; email: string; image: string | null };
  _count?: { messages: number };
}

export interface SupportTicketMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: { id: string; name: string | null; email: string; image: string | null; role: string };
}

export interface SupportTicketDetail extends SupportTicket {
  messages: SupportTicketMessage[];
}

// ─── AI Assistant Types ─────────────────────────────────
export interface AIConversation {
  id: string;
  title: string | null;
  courseId: string | null;
  createdAt: string;
  messages?: AIMessage[];
}

export interface AIMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}
