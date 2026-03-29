import { create } from 'zustand';
import apiClient from './api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- User Store ---
interface User {
  id: string;
  name: string;
  role: string;
}

interface UserState {
  user: User | null;
  loadUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loadUser: async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedUser) {
        set({ user: JSON.parse(storedUser) });
      }
    } catch (e) {
      console.error('Failed to load user data from storage', e);
    }
  },
}));

// --- Quiz Store ---
export interface Question {
  id: string;
  text: string;
  options: { id: string; text: string; isCorrect?: boolean }[];
  marks?: number;
  type?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  duration: number;
}

export interface TeacherQuiz extends Quiz {
  classId: string | { _id: string; name: string };
  subjectId?: string | { _id: string; name: string };
  totalMarks?: number;
}

export interface Class {
  _id: string;
  name: string;
}

export interface Subject {
  _id: string;
  name: string;
}

export interface Attempt {
  quizId: string;
  studentId: string;
  answers: Record<string, string>;
  timestamp: number;
  score?: number;
  totalMarks?: number;
}

interface QuizState {
  quizzes: Quiz[];
  teacherQuizzes: TeacherQuiz[];
  classes: Class[];
  subjects: Subject[];
  attempts: Attempt[];
  isLoading: boolean;
  loadData: () => Promise<void>;
  submitAttempt: (attempt: Attempt) => Promise<void>;
  getQuizzesInChronologicalOrder: () => Quiz[];
  
  // Teacher methods
  fetchTeacherProfileData: () => Promise<void>;
  fetchTeacherQuizzes: (classId?: string) => Promise<void>;
  addQuiz: (quizData: {
    title: string;
    description: string;
    duration: number;
    totalMarks: number;
    questions: Question[];
    classId: string;
    subjectId: string;
  }) => Promise<boolean>;
  updateQuiz: (id: string, quizData: {
    title: string;
    description: string;
    duration: number;
    totalMarks: number;
    questions: Question[];
    classId: string;
    subjectId: string;
  }) => Promise<boolean>;
  deleteQuiz: (id: string) => Promise<boolean>;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  quizzes: [],
  teacherQuizzes: [],
  classes: [],
  subjects: [],
  attempts: [],
  isLoading: false,

  loadData: async () => {
    const user = useUserStore.getState().user;
    if (!user) return;

    set({ isLoading: true });
    try {
      if (user.role === 'admin') {
        // Admins can see all quizzes via admin endpoint
        const response = await apiClient.get('/admin/quizzes');
        const backendQuizzes = response.data.data;
        // Map to student-style quizzes for display in student-like views
        const mappedQuizzes: Quiz[] = backendQuizzes.map((q: any) => ({
          id: q._id,
          title: q.title,
          description: q.description,
          duration: q.duration,
          questions: (q.questions || []).map((quest: any) => ({
            id: quest._id, // Use real DB ID
            text: quest.question,
            options: (quest.options || []).map((opt: string) => ({
              id: opt, // Use text as ID so submission sends text
              text: opt,
            })),
          })),
        }));
        set({ quizzes: mappedQuizzes, teacherQuizzes: backendQuizzes });
      } else if (user.role === 'student') {
        const response = await apiClient.get('/student/quizzes');
        const backendQuizzes = response.data.data;
 
        const mappedQuizzes: Quiz[] = backendQuizzes.map((q: any) => ({
          id: q._id,
          title: q.title,
          description: q.description,
          duration: q.duration,
          questions: q.questions.map((quest: any) => ({
            id: quest._id, // Use real DB ID
            text: quest.question,
            options: quest.options.map((opt: string) => ({
              id: opt, // Use text as ID so submission sends text
              text: opt,
            })),
          })),
        }));

        const attemptsPromises = mappedQuizzes.map(async (q): Promise<Attempt | null> => {
          try {
            const res = await apiClient.get(`/student/quiz/result/${q.id}`);
            if (res.data.success && res.data.data) {
              const sub = res.data.data;
              const answers: Record<string, string> = {};
              sub.answers.forEach((ans: any) => {
                answers[ans.questionId] = ans.answer;
              });
              return {
                quizId: q.id,
                studentId: sub.studentId,
                answers: answers,
                timestamp: new Date(sub.submittedAt).getTime(),
                score: sub.score,
                totalMarks: sub.totalMarks,
              };
            }
          } catch (e) {
            return null;
          }
          return null;
        });

        const attemptsResults = await Promise.all(attemptsPromises);
        set({ quizzes: mappedQuizzes, attempts: attemptsResults.filter((a): a is Attempt => a !== null) });
      }

      if (user.role === 'teacher') {
        await get().fetchTeacherQuizzes();
        await get().fetchTeacherProfileData();
      }
    } catch (e) {
      console.error('Failed to load quizzes', e);
    } finally {
      set({ isLoading: false });
    }
  },

  submitAttempt: async (attempt: Attempt) => {
    try {
      const backendAnswers = Object.entries(attempt.answers).map(([qId, ans]) => ({
        questionId: qId,
        answer: ans,
      }));
      await apiClient.post('/student/quiz/submit', { quizId: attempt.quizId, answers: backendAnswers });
      set((state) => ({ attempts: [...state.attempts, attempt] }));
    } catch (e) {
      console.error('Failed to submit quiz attempt', e);
      throw e;
    }
  },

  getQuizzesInChronologicalOrder: () => {
    return [...get().quizzes].sort((a, b) => b.id.localeCompare(a.id));
  },

  fetchTeacherProfileData: async () => {
    const user = useUserStore.getState().user;
    if (!user || user.role !== 'teacher') return;

    set({ isLoading: true });
    try {
      const response = await apiClient.get('/teacher/profile');
      if (response.data.success && response.data.data) {
        const { classes, subjects } = response.data.data;
        set({ 
          classes: Array.isArray(classes) ? classes : [], 
          subjects: Array.isArray(subjects) ? subjects : [] 
        });
      }
    } catch (e) {
      console.error('Failed to fetch teacher profile data', e);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTeacherQuizzes: async (classId?: string) => {
    set({ isLoading: true });
    try {
      // If classId is provided, fetch for that class, otherwise fetch for all
      const url = classId ? `/teacher/quizzes/${classId}` : '/teacher/quizzes';
      const response = await apiClient.get(url);
      const backendQuizzes = response.data.data || [];
      const mappedQuizzes = backendQuizzes.map((q: any) => ({
        ...q,
        id: q._id || q.id,
      }));
      set({ teacherQuizzes: mappedQuizzes });
    } catch (e) {
      console.error('Failed to fetch teacher quizzes', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addQuiz: async (quizData) => {
    try {
      const backendQuestions = quizData.questions.map((q) => ({
        question: q.text,
        options: q.options.map((opt) => opt.text),
        answer: q.options.find((opt) => opt.isCorrect)?.text || '',
        marks: q.marks || 1,
      }));

      const body = {
        title: quizData.title,
        description: quizData.description,
        classId: quizData.classId,
        subjectId: quizData.subjectId,
        duration: quizData.duration,
        questions: backendQuestions,
        totalMarks: quizData.totalMarks,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week
      };

      const response = await apiClient.post('/teacher/quizzes', body);
      if (response.data.success) {
        await get().fetchTeacherQuizzes();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to create quiz', e);
      return false;
    }
  },

  updateQuiz: async (id, quizData) => {
    try {
      const backendQuestions = quizData.questions.map((q) => ({
        question: q.text,
        options: q.options.map((opt) => opt.text),
        answer: q.options.find((opt) => opt.isCorrect)?.text || '',
        marks: q.marks || 1,
      }));

      const body = {
        title: quizData.title,
        description: quizData.description,
        classId: quizData.classId,
        subjectId: quizData.subjectId,
        duration: quizData.duration,
        questions: backendQuestions,
        totalMarks: quizData.totalMarks,
      };

      const response = await apiClient.put(`/teacher/quizzes/${id}`, body);
      if (response.data.success) {
        await get().fetchTeacherQuizzes();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to update quiz', e);
      return false;
    }
  },

  deleteQuiz: async (id) => {
    try {
      const response = await apiClient.delete(`/teacher/quizzes/${id}`);
      if (response.data.success) {
        await get().fetchTeacherQuizzes();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to delete quiz', e);
      return false;
    }
  },
}));
