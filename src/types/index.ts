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
