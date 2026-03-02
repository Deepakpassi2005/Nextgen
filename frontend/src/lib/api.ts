/*
  simple fetch-based API client
  * using baseUrl defined by VITE_API_BASE_URL
  * attaches JWT from localStorage.authToken automatically
  * exposes generic methods and resource groups
*/

// base URL is driven by environment variable set at build time
// fall back to current origin if the env var is missing (useful when serving
// frontend and backend from same host/port).
const API_URL = import.meta.env.VITE_API_URL || '';

// `window.location` is only available at runtime; keep BASE_URL logic in
// a function so server-side code (e.g. during build) doesn't break.
function getBaseUrl() {
  if (API_URL && API_URL.length) {
    return String(API_URL).replace(/\/+$|\s+/g, '');
  }
  // default to same-origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  throw new Error('Unable to determine API base URL');
}

const BASE_URL = getBaseUrl();

async function handleResponse<T>(res: Response): Promise<T> {
  // parse JSON body if present
  let body: unknown = undefined;
  try {
    // Some endpoints may return empty body (204)
    body = await res.json();
  } catch (_e) {
    body = undefined;
  }

  if (!res.ok) {
    // prefer structured message when available
    const msg = typeof body === 'object' && body !== null && 'message' in (body as any)
      ? (body as any).message
      : typeof body === 'object' && body !== null && 'error' in (body as any)
      ? (body as any).error
      : `HTTP ${res.status}`;
    throw new Error(String(msg));
  }

  // If body is an object with { success, data } shape, unwrap it
  if (typeof body === 'object' && body !== null) {
    const asObj = body as Record<string, unknown>;
    if ('success' in asObj && 'data' in asObj) {
      const success = Boolean(asObj.success);
      if (!success) {
        const errMsg = asObj.message || asObj.error || 'API returned success:false';
        throw new Error(String(errMsg));
      }
      return asObj.data as T;
    }
  }

  // If the body is an array, return it
  if (Array.isArray(body)) return body as unknown as T;

  // Otherwise return the parsed body (could be object, primitive, or undefined)
  return body as T;
}

async function request<T>(endpoint: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('authToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  // ensure we always call the API router mounted at /api on the backend
  const base = getBaseUrl();
  const url = endpoint.startsWith('/api') ? `${base}${endpoint}` : `${base}/api${endpoint}`;

  const res = await fetch(url, { ...opts, headers });
  return handleResponse<T>(res);
}

export const api = {
  get: <T = any>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T = any>(endpoint: string, data?: any) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: <T = any>(endpoint: string, data?: any) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  remove: <T = any>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

// example grouping for the `classes` resource (used directly)
export const classes = {
  getAll: () => api.get('/classes'),
  getById: (id: string) => api.get(`/classes/${id}`),
  create: (data: any) => api.post('/classes', data),
  update: (id: string, data: any) => api.put(`/classes/${id}`, data),
  remove: (id: string) => api.remove(`/classes/${id}`),
};

// build backwards-compatible object for legacy hooks/pages
export const apiClient = {
  students: {
    getAll: () => api.get('/students'),
    getById: (id: string) => api.get(`/students/${id}`),
    getByClass: (classId: string) => api.get(`/students/class/${classId}`),
    create: (data: any) => api.post('/students', data),
    update: (id: string, data: any) => api.put(`/students/${id}`, data),
    'delete': (id: string) => api.remove(`/students/${id}`),
    remove: (id: string) => api.remove(`/students/${id}`),
  },
  teachers: {
    getAll: () => api.get('/teachers'),
    getById: (id: string) => api.get(`/teachers/${id}`),
    create: (data: any) => api.post('/teachers', data),
    update: (id: string, data: any) => api.put(`/teachers/${id}`, data),
    'delete': (id: string) => api.remove(`/teachers/${id}`),
    remove: (id: string) => api.remove(`/teachers/${id}`),
    assignSubject: (id: string, subjectId: string) =>
      api.post(`/teachers/${id}/assign-subject`, { subjectId }),
    assignClass: (id: string, classId: string) =>
      api.post(`/teachers/${id}/assign-class`, { classId }),
  },
  classes: {
    getAll: () => api.get('/classes'),
    getById: (id: string) => api.get(`/classes/${id}`),
    getWithStudents: (id: string) => api.get(`/classes/${id}/with-students`),
    create: (data: any) => api.post('/classes', data),
    update: (id: string, data: any) => api.put(`/classes/${id}`, data),
    'delete': (id: string) => api.remove(`/classes/${id}`),
    remove: (id: string) => api.remove(`/classes/${id}`),
  },
  analytics: {
    getDashboardSummary: () => api.get('/dashboard/summary'),
    getPerformanceByClass: () => api.get('/dashboard/performance'),
    getAnalytics: (type: 'teacher' | 'student', id: string) =>
      api.get(`/analytics?type=${type}&${type === 'teacher' ? 'teacherId' : 'studentId'}=${id}`),
  },
  subjects: {
    getAll: () => api.get('/subjects'),
    // backend expects classId as query parameter
  getByClass: (classId: string) => api.get(`/subjects?classId=${classId}`),
    getById: (id: string) => api.get(`/subjects/${id}`),
    create: (data: any) => api.post('/subjects', data),
    update: (id: string, data: any) => api.put(`/subjects/${id}`, data),
    'delete': (id: string) => api.remove(`/subjects/${id}`),
    remove: (id: string) => api.remove(`/subjects/${id}`),
  },
  notices: {
    getAll: () => api.get('/notices'),
    getRecent: (limit: number) => api.get(`/notices/recent?limit=${limit}`),
    getById: (id: string) => api.get(`/notices/${id}`),
    create: (data: any) => api.post('/notices', data),
    update: (id: string, data: any) => api.put(`/notices/${id}`, data),
    'delete': (id: string) => api.remove(`/notices/${id}`),
    remove: (id: string) => api.remove(`/notices/${id}`),
  },
  timetable: {
    getAll: () => api.get('/timetable'),
    getByClass: (classId: string) => api.get(`/timetable/class/${classId}`),
    create: (data: any) => api.post('/timetable', data),
    update: (id: string, data: any) => api.put(`/timetable/${id}`, data),
    'delete': (id: string) => api.remove(`/timetable/${id}`),
    remove: (id: string) => api.remove(`/timetable/${id}`),
  },
  timetableConfig: {
    getByClass: (classId: string) => api.get(`/timetable-config/${classId}`),
    save: (data: any) => api.post('/timetable-config', data),
    delete: (classId: string) => api.remove(`/timetable-config/${classId}`),
  },
  attendance: {
    getAll: () => api.get('/attendance'),
    getByStudent: (studentId: string) => api.get(`/attendance/student/${studentId}`),
    getPercentage: (studentId: string) => api.get(`/attendance/percentage/${studentId}`),
    create: (data: any) => api.post('/attendance', data),
    update: (id: string, data: any) => api.put(`/attendance/${id}`, data),
    'delete': (id: string) => api.remove(`/attendance/${id}`),
    remove: (id: string) => api.remove(`/attendance/${id}`),
  },
  marks: {
    getAll: () => api.get('/marks'),
    getByStudent: (studentId: string) => api.get(`/marks/student/${studentId}`),
    getAverageScore: (studentId: string) => api.get(`/marks/average/${studentId}`),
    getClassPerformance: (classId: string) => api.get(`/marks/class/${classId}`),
    create: (data: any) => api.post('/marks', data),
    update: (id: string, data: any) => api.put(`/marks/${id}`, data),
    'delete': (id: string) => api.remove(`/marks/${id}`),
    remove: (id: string) => api.remove(`/marks/${id}`),
  },
  activities: {
    getAll: (limit?: number) => api.get(`/activities?limit=${limit || 10}`),
    markAsRead: (id: string) => api.put(`/activities/${id}/read`, {}),
  },
};

export default api;
