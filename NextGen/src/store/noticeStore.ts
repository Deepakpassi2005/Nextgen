import { create } from 'zustand';
import apiClient from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../config';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NoticeAttachment {
  uri?: string;
  url?: string;
  name?: string;
  filename?: string;
  mimeType?: string;
  mimetype?: string;
  size?: number;
}

export interface Notice {
  id: string;
  _id?: string;
  title: string;
  message: string;    // mapped from backend 'content'
  content?: string;
  priority: 'high' | 'medium' | 'low';
  recipient: 'all' | 'admin' | 'class';   // mapped from backend 'audience'
  audience?: string;
  timestamp: number;
  targetClass?: string;
  targetStudents?: string[];
  attachments?: NoticeAttachment[];
  author?: string;
  authorId?: string;
  createdByRole?: 'admin' | 'teacher';
}

// Maps the backend audience value to our UI recipient
const audienceToRecipient = (audience: string): 'all' | 'admin' | 'class' => {
  if (audience === 'teachers') return 'admin';
  if (audience === 'students') return 'class';
  return 'all';
};

// Maps our UI recipient back to the backend audience
const recipientToAudience = (recipient: string): 'all' | 'teachers' | 'students' => {
  if (recipient === 'admin') return 'teachers';
  if (recipient === 'class') return 'students';
  return 'all';
};

// Maps a backend notice to our Notice interface
const mapBackendNotice = (n: any): Notice => {
  const baseUrl = CONFIG.API_BASE_URL.replace('/api', '');
  return {
    id: n._id || n.id,
    _id: n._id || n.id,
    title: n.title,
    message: n.content || n.message || '',
    content: n.content,
    priority: n.priority || 'medium',
    recipient: audienceToRecipient(n.audience || 'all'),
    audience: n.audience,
    timestamp: new Date(n.date || n.createdAt).getTime(),
    attachments: (n.attachments || []).map((att: any) => ({
      uri: att.url ? `${baseUrl}/${att.url}` : att.uri,
      url: att.url,
      name: att.filename || att.name,
      filename: att.filename,
      mimeType: att.mimetype || att.mimeType,
      size: att.size,
    })),
    author: n.author,
    authorId: n.authorId,
    createdByRole: n.createdByRole,
  };
};

// ─── Store ─────────────────────────────────────────────────────────────────

interface NoticeState {
  notices: Notice[];
  isLoading: boolean;
  loadNotices: () => Promise<void>;
  addNotice: (notice: Omit<Notice, 'id' | 'timestamp'>) => Promise<void>;
  updateNotice: (id: string, notice: Partial<Omit<Notice, 'id'>>) => Promise<void>;
  deleteNotice: (id: string) => Promise<void>;
}

export const useNoticeStore = create<NoticeState>((set, get) => ({
  notices: [],
  isLoading: false,

  loadNotices: async () => {
    set({ isLoading: true });
    try {
      const userData = await AsyncStorage.getItem('userData');
      const user = userData ? JSON.parse(userData) : null;
      const role = user?.role || 'student';

      let endpoint = '/student/notices';
      if (role === 'teacher' || role === 'admin') {
        endpoint = '/teacher/notices';
      }

      const response = await apiClient.get(endpoint);
      if (response.data.success) {
        const mapped = (response.data.data || []).map(mapBackendNotice);
        set({ notices: mapped });
      }
    } catch (err) {
      console.error('[noticeStore.loadNotices] Error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addNotice: async (notice) => {
    set({ isLoading: true });
    try {
      const userData = await AsyncStorage.getItem('userData');
      const user = userData ? JSON.parse(userData) : null;
      const userRole = user?.role || 'teacher';
      const endpoint = userRole === 'admin' ? '/notices' : '/teacher/notices';

      const body = {
        title: notice.title,
        content: notice.message,
        priority: notice.priority || 'medium',
        audience: recipientToAudience(notice.recipient),
      };

      const response = await apiClient.post(endpoint, body);
      if (response.data.success) {
        const newNotice = response.data.data;
        const noticeId = newNotice._id || newNotice.id;

        // If there are attachments, upload them
        if (notice.attachments && notice.attachments.length > 0) {
          const fd = new FormData();
          notice.attachments.forEach((att: any) => {
            // @ts-ignore
            fd.append('attachments', {
              uri: att.uri,
              name: att.name || 'document.pdf',
              type: att.mimeType || 'application/octet-stream',
            });
          });

          await apiClient.post(`${endpoint}/${noticeId}/attachments`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }

        await get().loadNotices();
      }
    } catch (error) {
      console.error('Error adding notice:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateNotice: async (id, notice) => {
    set({ isLoading: true });
    try {
      const userData = await AsyncStorage.getItem('userData');
      const user = userData ? JSON.parse(userData) : null;
      const userRole = user?.role || 'teacher';
      const endpoint = userRole === 'admin' ? 'notices' : 'teacher/notices';

      const body: any = {};
      if (notice.title) body.title = notice.title;
      if (notice.message) body.content = notice.message;
      if (notice.priority) body.priority = notice.priority;
      if (notice.recipient) body.audience = recipientToAudience(notice.recipient);

      if (!id) {
        throw new Error('Notice ID is missing');
      }

      console.log(`[noticeStore] Updating notice at: ${endpoint}/${id}`);
      const response = await apiClient.put(`${endpoint}/${id}`, body);

      // If there are attachments, upload them (note: this adds to existing)
      if (response.data.success && notice.attachments && notice.attachments.length > 0) {
        const fd = new FormData();
        notice.attachments.forEach((att: any) => {
          // Only upload "new" attachments (those with local URIs)
          if (att.uri && (att.uri.startsWith('file://') || att.uri.startsWith('content://'))) {
            // @ts-ignore
            fd.append('attachments', {
              uri: att.uri,
              name: att.name || 'document.pdf',
              type: att.mimeType || 'application/octet-stream',
            });
          }
        });

        if ((fd as any).getParts && (fd as any).getParts().length > 0) {
          await apiClient.post(`${endpoint}/${id}/attachments`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }

      await get().loadNotices();
    } catch (error) {
      console.error('Error updating notice:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteNotice: async (id) => {
    set({ isLoading: true });
    try {
      const userData = await AsyncStorage.getItem('userData');
      const user = userData ? JSON.parse(userData) : null;
      const role = user?.role || 'teacher';

      const endpoint = role === 'student'
        ? `/student/notices/${id}`
        : `/teacher/notices/${id}`;

      const response = await apiClient.delete(endpoint);
      if (response.data.success) {
        set((state) => ({
          notices: state.notices.filter((n) => n.id !== id),
        }));
      }
    } catch (err) {
      console.error('[noticeStore.deleteNotice] Error:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },
}));
