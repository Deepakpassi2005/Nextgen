import { create } from 'zustand';
import { api } from './api';

export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  verifyAdminPassword: (password: string) => Promise<boolean>;
  initialize: () => Promise<void>;
}

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem('authUser');
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

const initialStoredUser = getStoredUser();
const hasToken = Boolean(localStorage.getItem('authToken'));

export const useStore = create<AuthState>((set, get) => ({
  currentUser: initialStoredUser,
  isAuthenticated: false,
  isLoading: hasToken,

  login: async (email, password) => {
    const response = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    const { token, user } = response;

    if (!token || !user) {
      throw new Error('Unexpected login response');
    }

    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));

    set({ currentUser: user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    set({ currentUser: null, isAuthenticated: false });
  },

  verifyAdminPassword: async (password: string) => {
    const currentUser = get().currentUser;
    if (!currentUser) return false;
    try {
      const response = await api.post<{ token: string }>('/auth/login', {
        email: currentUser.email,
        password,
      });
      if (response?.token) {
        // Replace stored token to keep auth in-sync
        localStorage.setItem('authToken', response.token);
        return true;
      }
    } catch {
      // ignore; invalid password
    }
    return false;
  },

  initialize: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    set({ isLoading: true });
    try {
      const user = await api.get<User>('/auth/me');
      localStorage.setItem('authUser', JSON.stringify(user));
      set({ currentUser: user, isAuthenticated: true });
    } catch (err) {
      console.warn('Failed to validate auth token', err);
      get().logout();
    } finally {
      set({ isLoading: false });
    }
  },
}));
