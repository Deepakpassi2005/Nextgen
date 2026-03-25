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
  const isFormData = opts.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
    request<T>(endpoint, { method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) }),
  put: <T = any>(endpoint: string, data?: any) =>
    request<T>(endpoint, { method: 'PUT', body: data instanceof FormData ? data : JSON.stringify(data) }),
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
    uploadPhoto: (file: File) => {
      const fd = new FormData();
      fd.append('photo', file);
      return api.post('/student/upload-photo', fd);
    },
  },
  teachers: {
    getAll: () => api.get('/teachers'),
    getById: (id: string) => api.get(`/teachers/${id}`),
    create: (data: any) => api.post('/teachers', data),
    update: (id: string, data: any) => api.put(`/teachers/${id}`, data),
    'delete': (id: string) => api.remove(`/teachers/${id}`),
    remove: (id: string) => api.remove(`/teachers/${id}`),
    uploadPhoto: (file: File) => {
      const fd = new FormData();
      fd.append('photo', file);
      return api.post('/teacher/upload-photo', fd);
    },
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
    getAnalytics: (type: string, id: string) => 
      api.get(`/analytics?type=${type}&${type}Id=${id}`),
    getAttendanceReport: (classId: string) => 
      api.get(`/analytics/attendance/class?classId=${classId}`),
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
    uploadAttachments: (id: string, files: File[]) => {
      const fd = new FormData();
      files.forEach((f) => fd.append('attachments', f));
      const token = localStorage.getItem('authToken');
      return fetch(`${getBaseUrl()}/api/notices/${id}/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      }).then(handleResponse);
    },
    removeAttachment: (id: string, url: string) => request(`/notices/${id}/attachments`, {
      method: 'DELETE',
      body: JSON.stringify({ url }),
    }),
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
    getByClass: (classId: string) => api.get(`/attendance/class/${classId}`),
    getByStudent: (studentId: string) => api.get(`/attendance/student/${studentId}`),
    getPercentage: (studentId: string) => api.get(`/attendance/percentage/${studentId}`),
    exportData: (role: string, startDate: string, endDate: string, classId?: string) => {
      const url = `/admin/attendance/export?role=${role}&startDate=${startDate}&endDate=${endDate}${classId ? `&classId=${classId}` : ''}`;
      return fetch(`${getBaseUrl()}/api${url}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      }).then(res => {
        if (!res.ok) throw new Error('Failed to export');
        return res.blob();
      });
    },
    create: (data: any) => api.post('/attendance', data),
    update: (id: string, data: any) => api.put(`/attendance/${id}`, data),
    'delete': (id: string) => api.remove(`/attendance/${id}`),
    remove: (id: string) => api.remove(`/attendance/${id}`),
  },
  teacherAttendance: {
    getByDate: (date: string) => api.get(`/teacher-attendance?date=${encodeURIComponent(date)}`),
    bulkSave: (data: any) => api.post('/teacher-attendance', data),
  },
  marks: {
    getAll: () => api.get('/marks'),
    getByStudent: (studentId: string) => api.get(`/marks/student/${studentId}`),
    getAverageScore: (studentId: string) => api.get(`/marks/average/${studentId}`),
    getClassPerformance: (classId: string) => api.get(`/marks/class/${classId}`),
    create: (data: any) => api.post('/marks', data),
    createBulk: (data: any) => api.post('/marks/bulk', data),
    update: (id: string, data: any) => api.put(`/marks/${id}`, data),
    'delete': (id: string) => api.remove(`/marks/${id}`),
    remove: (id: string) => api.remove(`/marks/${id}`),
  },
  results: {
    getByClass: (classId: string, examType?: string) => 
      api.get(`/admin/results/class/${classId}${examType ? `?examType=${examType}` : ''}`),
    update: (id: string, data: any) => api.put(`/admin/results/${id}`, data),
    remove: (id: string) => api.remove(`/admin/results/${id}`),
  },
  activities: {
    getAll: (limit?: number) => api.get(`/activities?limit=${limit || 10}`),
    markAsRead: (id: string) => api.put(`/activities/${id}/read`, {}),
  },
  exams: {
    getAll: () => api.get('/exams'),
    getById: (id: string) => api.get(`/exams/${id}`),
    getByClass: (classId: string) => api.get(`/exams/class/${classId}`),
    create: (data: any) => api.post('/exams', data),
    update: (id: string, data: any) => api.put(`/exams/${id}`, data),
    remove: (id: string) => api.remove(`/exams/${id}`),
  },
  materials: {
    getAll: () => api.get('/materials'),
    getByClass: (classId: string) => api.get(`/materials/class/${classId}`),
    getByStudent: (studentId: string) => api.get(`/materials/student/${studentId}`),
    create: (data: any) => api.post('/materials', data),
    update: (id: string, data: any) => api.put(`/materials/${id}`, data),
    remove: (id: string) => api.remove(`/materials/${id}`),
    download: (id: string) => api.get(`/materials/download/${id}`),
  },
  notifications: {
    getAll: () => api.get('/notifications'),
    getByUser: (userId: string) => api.get(`/notifications/user/${userId}`),
    create: (data: any) => api.post('/notifications', data),
    update: (id: string, data: any) => api.put(`/notifications/${id}`, data),
    remove: (id: string) => api.remove(`/notifications/${id}`),
    markAsRead: (id: string) => api.put(`/notifications/read/${id}`, {}),
  },
  punch: {
    getAllLogs: () => api.get('/admin/teacher-punch-logs'),
    getMyHistory: () => api.get('/teacher/punch-history'),
    punchIn: (latitude: number, longitude: number) => api.post('/teacher/punch-in', { latitude, longitude }),
  },
  importExport: {
    importStudents: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetch(`${getBaseUrl()}/api/import/students`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        body: formData,
      }).then(res => res.json());
    },
    importTeachers: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetch(`${getBaseUrl()}/api/import/teachers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        body: formData,
      }).then(res => res.json());
    },
    exportStudents: () => api.get('/export/students'),
    exportTeachers: () => api.get('/export/teachers'),
  },
  quizzes: {
    // Admin
    getAllAdmin: () => api.get('/admin/quizzes'),
    updateAdmin: (id: string, data: any) => api.put(`/admin/quizzes/${id}`, data),
    deleteAdmin: (id: string) => api.remove(`/admin/quizzes/${id}`),
    
    // Teacher
    create: (data: any) => api.post('/teacher/quizzes', data),
    getByClass: (classId: string) => api.get(`/teacher/quizzes/${classId}`),
    update: (id: string, data: any) => api.put(`/teacher/quizzes/${id}`, data),
    remove: (id: string) => api.remove(`/teacher/quizzes/${id}`),

    // Student
    listStudent: () => api.get('/student/quizzes'),
    submit: (data: any) => api.post('/student/quiz/submit', data),
    getResult: (quizId: string) => api.get(`/student/quiz/result/${quizId}`),
  },
};

export default api;
