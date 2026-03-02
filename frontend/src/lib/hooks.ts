import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './api';

// ==================== STUDENTS ====================
export const useStudents = () => {
  return useQuery({
    queryKey: ['students'],
    queryFn: apiClient.students.getAll,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    staleTime: 2000,
  });
};

export const useStudent = (id: string) => {
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => apiClient.students.getById(id),
    enabled: !!id,
  });
};

export const useStudentsByClass = (classId: string) => {
  return useQuery({
    queryKey: ['students', 'class', classId],
    queryFn: () => apiClient.students.getByClass(classId),
    enabled: !!classId,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    staleTime: 1000,
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.students.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      // also refresh any class-filtered queries
      queryClient.invalidateQueries({ queryKey: ['students', 'class'] });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.students.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students', id] });
      queryClient.invalidateQueries({ queryKey: ['students', 'class'] });
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.students.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students', 'class'] });
    },
  });
};

// ==================== TEACHERS ====================
export const useTeachers = () => {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: apiClient.teachers.getAll,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    staleTime: 2000,
  });
};

export const useTeacher = (id: string) => {
  return useQuery({
    queryKey: ['teachers', id],
    queryFn: () => apiClient.teachers.getById(id),
    enabled: !!id,
  });
};

export const useCreateTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.teachers.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
};

export const useUpdateTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.teachers.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['teachers', id] });
    },
  });
};

export const useDeleteTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.teachers.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
};

// ==================== CLASSES ====================
export const useClasses = () => {
  return useQuery({
    queryKey: ['classes'],
    queryFn: apiClient.classes.getAll,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    staleTime: 2000,
  });
};

export const useClass = (id: string) => {
  return useQuery({
    queryKey: ['classes', id],
    queryFn: () => apiClient.classes.getById(id),
    enabled: !!id,
  });
};

export const useClassWithStudents = (id: string) => {
  return useQuery({
    queryKey: ['classes', id, 'students'],
    queryFn: () => apiClient.classes.getWithStudents(id),
    enabled: !!id,
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.classes.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.classes.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['classes', id] });
    },
  });
};

export const useDeleteClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.classes.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};

// ==================== SUBJECTS ====================
export const useSubjects = (classId?: string) => {
  return useQuery({
    // class-specific call uses query param now
    queryKey: classId ? ['subjects', 'byClass', classId] : ['subjects'],
    queryFn: () => classId ? apiClient.subjects.getByClass(classId) : apiClient.subjects.getAll(),
    enabled: !classId || !!classId, // Enable for all subjects or only when classId is provided
  });
};

export const useSubject = (id: string) => {
  return useQuery({
    queryKey: ['subjects', id],
    queryFn: () => apiClient.subjects.getById(id),
    enabled: !!id,
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.subjects.create,
    onSuccess: (newSubject: any) => {
      console.log('═══════════════════════════════════════');
      console.log('🎯 [useCreateSubject.onSuccess] INVALIDATING QUERIES');
      console.log('═══════════════════════════════════════');
      console.log('New subject data:', {
        id: newSubject._id,
        name: newSubject.name,
        classId: newSubject.classId?._id || newSubject.classId,
        teacherIds: newSubject.teacherIds,
        teacherCount: newSubject.teacherIds?.length
      });
      
      // Step 1: Invalidate global subjects query - CRITICAL for when no class is selected
      console.log('🔄 Invalidating: queryKey [subjects]');
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      
      // Step 2: Invalidate class-specific query
      const classId = newSubject.classId?._id || newSubject.classId;
      if (classId) {
        console.log('🔄 Invalidating: queryKey [subjects, byClass, ' + classId + ']');
        queryClient.invalidateQueries({ 
          queryKey: ['subjects', 'byClass', classId]
        });
      }
      
      // DEBUGGING: Log all active queries in cache
      const allQueries = queryClient.getQueryCache().getAll();
      console.log('📊 All queries in cache:', allQueries.map(q => q.queryKey));
      
      console.log('✅ All queries invalidated - will refetch fresh data');
      console.log('═══════════════════════════════════════');
    },
  });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.subjects.update(id, data),
    onSuccess: (updatedSubject: any, { id }) => {
      console.log('═══════════════════════════════════════');
      console.log('🎯 [useUpdateSubject.onSuccess] INVALIDATING QUERIES');
      console.log('═══════════════════════════════════════');
      console.log('Updated subject data:', {
        id: id,
        name: updatedSubject.name,
        classId: updatedSubject.classId?._id || updatedSubject.classId,
        teacherIds: updatedSubject.teacherIds,
        teacherCount: updatedSubject.teacherIds?.length
      });
      
      // Step 1: Invalidate global subjects query
      console.log('🔄 Invalidating: queryKey [subjects]');
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      
      // Step 2: Invalidate single subject by ID
      console.log('🔄 Invalidating: queryKey [subjects, ' + id + ']');
      queryClient.invalidateQueries({ queryKey: ['subjects', id] });
      
      // Step 3: Invalidate class-specific query
      const classId = updatedSubject.classId?._id || updatedSubject.classId;
      if (classId) {
        console.log('🔄 Invalidating: queryKey [subjects, byClass, ' + classId + ']');
        queryClient.invalidateQueries({ 
          queryKey: ['subjects', 'byClass', classId]
        });
      }
      console.log('✅ All queries invalidated - will refetch fresh data');
      console.log('═══════════════════════════════════════');
    },
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.subjects.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
};

// ==================== NOTICES ====================
export const useNotices = () => {
  return useQuery({
    queryKey: ['notices'],
    queryFn: apiClient.notices.getAll,
  });
};

export const useRecentNotices = (limit?: number) => {
  return useQuery({
    queryKey: ['notices', 'recent', limit],
    queryFn: () => apiClient.notices.getRecent(limit ?? 0),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    staleTime: 2000,
  });
};

export const useNotice = (id: string) => {
  return useQuery({
    queryKey: ['notices', id],
    queryFn: () => apiClient.notices.getById(id),
    enabled: !!id,
  });
};

export const useCreateNotice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.notices.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      queryClient.invalidateQueries({ queryKey: ['notices', 'recent'] });
    },
  });
};

export const useUpdateNotice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.notices.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      queryClient.invalidateQueries({ queryKey: ['notices', id] });
    },
  });
};

export const useDeleteNotice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.notices.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      queryClient.invalidateQueries({ queryKey: ['notices', 'recent'] });
    },
  });
};

// ==================== TIMETABLE ====================
export const useTimetable = () => {
  return useQuery({
    queryKey: ['timetable'],
    queryFn: apiClient.timetable.getAll,
  });
};

export const useTimetableByClass = (classId: string) => {
  return useQuery({
    queryKey: ['timetable', 'class', classId],
    queryFn: () => apiClient.timetable.getByClass(classId),
    enabled: !!classId,
  });
};

export const useCreateTimetableSlot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.timetable.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      queryClient.invalidateQueries({ queryKey: ['timetable', 'class', data.classId] });
    },
  });
};

export const useUpdateTimetableSlot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.timetable.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      queryClient.invalidateQueries({ queryKey: ['timetable', 'class', data.classId] });
    },
  });
};

export const useDeleteTimetableSlot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.timetable.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
    },
  });
};

// ==================== TIMETABLE CONFIG ====================
export const useTimetableConfig = (classId: string) => {
  return useQuery({
    queryKey: ['timetable-config', classId],
    queryFn: () => apiClient.timetableConfig.getByClass(classId),
    enabled: !!classId,
  });
};

export const useSaveTimetableConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.timetableConfig.save,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ 
        queryKey: ['timetable-config', data.classId] 
      });
    },
  });
};

export const useDeleteTimetableConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.timetableConfig.delete,
    onSuccess: (_, classId) => {
      queryClient.invalidateQueries({ 
        queryKey: ['timetable-config', classId] 
      });
    },
  });
};

// ==================== ATTENDANCE ====================
export const useAttendance = () => {
  return useQuery({
    queryKey: ['attendance'],
    queryFn: apiClient.attendance.getAll,
  });
};

export const useAttendanceByStudent = (studentId: string) => {
  return useQuery({
    queryKey: ['attendance', 'student', studentId],
    queryFn: () => apiClient.attendance.getByStudent(studentId),
    enabled: !!studentId,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    staleTime: 1000,
  });
};

export const useAttendancePercentage = (studentId: string) => {
  return useQuery({
    queryKey: ['attendance', 'student', studentId, 'percentage'],
    queryFn: () => apiClient.attendance.getPercentage(studentId),
    enabled: !!studentId,
  });
};

export const useCreateAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.attendance.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.attendance.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

export const useDeleteAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.attendance.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

// ==================== MARKS ====================
export const useMarks = () => {
  return useQuery({
    queryKey: ['marks'],
    queryFn: apiClient.marks.getAll,
  });
};

export const useMarksByStudent = (studentId: string) => {
  return useQuery({
    queryKey: ['marks', 'student', studentId],
    queryFn: () => apiClient.marks.getByStudent(studentId),
    enabled: !!studentId,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    staleTime: 1000,
  });
};

export const useAverageScore = (studentId: string) => {
  return useQuery({
    queryKey: ['marks', 'student', studentId, 'average'],
    queryFn: () => apiClient.marks.getAverageScore(studentId),
    enabled: !!studentId,
  });
};

export const useClassPerformance = (classId: string) => {
  return useQuery({
    queryKey: ['marks', 'class', classId, 'performance'],
    queryFn: () => apiClient.marks.getClassPerformance(classId),
    enabled: !!classId,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    staleTime: 1000,
  });
};

export const useCreateMarks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.marks.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
    },
  });
};

export const useUpdateMarks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.marks.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
    },
  });
};

export const useDeleteMarks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.marks.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
    },
  });
};

// ==================== ANALYTICS & DASHBOARD ====================
export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: apiClient.analytics.getDashboardSummary,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    staleTime: 2000,
  });
};

export const usePerformanceByClass = () => {
  return useQuery({
    queryKey: ['dashboard', 'performance'],
    queryFn: apiClient.analytics.getPerformanceByClass,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    staleTime: 2000,
  });
};

export const useAnalytics = (type: 'teacher' | 'student', id: string) => {
  return useQuery({
    queryKey: ['analytics', type, id],
    queryFn: () => apiClient.analytics.getAnalytics(type, id),
    enabled: !!id,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    staleTime: 1000,
  });
};
// ==================== ACTIVITIES ====================
export const useActivities = (limit?: number) => {
  return useQuery({
    queryKey: ['activities', limit],
    queryFn: () => apiClient.activities.getAll(limit ?? 10),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    staleTime: 2000,
  });
};

export const useMarkActivityAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.activities.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
};