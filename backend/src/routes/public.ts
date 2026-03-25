import { Router } from 'express';
import { auditLogMiddleware } from '../middlewares/auditMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import multer from 'multer';
import * as classCtrl from '../controllers/classController';
import * as studentCtrl from '../controllers/studentController';
import * as teacherCtrl from '../controllers/teacherController';
import * as subjectCtrl from '../controllers/subjectController';
import * as noticeCtrl from '../controllers/noticeController';
import * as analyticsCtrl from '../controllers/analyticsController';
import * as timetableCtrl from '../controllers/timetableController';
import * as timetableConfigCtrl from '../controllers/timetableConfigController';
import * as marksCtrl from '../controllers/marksController';
import * as attendanceCtrl from '../controllers/attendanceController';
import * as teacherAttendanceCtrl from '../controllers/teacherAttendanceController';
import * as importCtrl from '../controllers/importController';
import * as examCtrl from '../controllers/examController';
import * as materialCtrl from '../controllers/materialController';
import * as notificationCtrl from '../controllers/notificationController';
import { sendSuccess, sendError } from '../utils/response';
import { runValidation, studentValidators, studentUpdateValidators, teacherValidators, teacherUpdateValidators } from '../middlewares/validation';
import { getRecentActivities, markActivityAsRead } from '../services/activityService';
import { profileUpload } from '../middlewares/uploadMiddleware';
import { downloadFile } from '../controllers/public/downloadController';

const router = Router();

// All public endpoints handle their own role-based authorization
// router.use(authMiddleware, roleMiddleware('admin'));

// Classes
router.get('/classes', classCtrl.getClasses);
router.get('/classes/:id', classCtrl.getClassById);
router.get('/classes/:id/with-students', classCtrl.getClassWithStudents);
router.post('/classes', classCtrl.createClass);
router.put('/classes/:id', classCtrl.updateClass);
router.delete('/classes/:id', classCtrl.deleteClass);

// Students
router.get('/students', studentCtrl.getStudents);
router.get('/students/:id', studentCtrl.getStudentById);
router.get('/students/class/:classId', studentCtrl.getStudentsByClass);
router.post('/students', authMiddleware, roleMiddleware('admin'), studentValidators, runValidation, auditLogMiddleware, studentCtrl.createStudent);
router.put('/students/:id', authMiddleware, roleMiddleware('admin'), studentUpdateValidators, runValidation, auditLogMiddleware, studentCtrl.updateStudent);
router.delete('/students/:id', authMiddleware, roleMiddleware('admin'), auditLogMiddleware, studentCtrl.deleteStudent);

// Teachers
router.get('/teachers', teacherCtrl.getTeachers);
router.get('/teachers/:id', teacherCtrl.getTeacherById);
router.post('/teachers', teacherValidators, runValidation, teacherCtrl.createTeacher);
router.put('/teachers/:id', teacherUpdateValidators, runValidation, teacherCtrl.updateTeacher);
router.delete('/teachers/:id', teacherCtrl.deleteTeacher);
router.post('/teachers/:id/assign-subject', teacherCtrl.assignSubjectToTeacher);
router.post('/teachers/:id/assign-class', teacherCtrl.assignClassToTeacher);

// Subjects
router.get('/subjects', subjectCtrl.getSubjects);
router.get('/subjects/:id', subjectCtrl.getSubjectById);
router.post('/subjects', subjectCtrl.createSubject);
router.put('/subjects/:id', subjectCtrl.updateSubject);
router.delete('/subjects/:id', subjectCtrl.deleteSubject);

// Timetable
router.get('/timetable', timetableCtrl.getTimetableSlots);
router.get('/timetable/class/:classId', timetableCtrl.getTimetableByClass);
router.post('/timetable', timetableCtrl.createTimetableSlot);
router.put('/timetable/:id', timetableCtrl.updateTimetableSlot);
router.delete('/timetable/:id', timetableCtrl.deleteTimetableSlot);

// Timetable Config
router.get('/timetable-config/:classId', timetableConfigCtrl.getTimetableConfig);
router.post('/timetable-config', timetableConfigCtrl.saveTimetableConfig);
router.delete('/timetable-config/:classId', timetableConfigCtrl.deleteTimetableConfig);

// Marks
router.get('/marks', marksCtrl.getMarks);
router.get('/marks/student/:studentId', marksCtrl.getMarksByStudent);
router.get('/marks/average/:studentId', marksCtrl.getAverageScore);
router.get('/marks/class/:classId', marksCtrl.getClassPerformance);
router.post('/marks', authMiddleware, roleMiddleware(['teacher', 'admin']), marksCtrl.createMarksRecord);
router.post('/marks/bulk', authMiddleware, roleMiddleware(['teacher', 'admin']), marksCtrl.createMarksBulk);
router.put('/marks/:id', authMiddleware, roleMiddleware(['teacher', 'admin']), marksCtrl.updateMarksRecord);
router.delete('/marks/:id', authMiddleware, roleMiddleware(['teacher', 'admin']), marksCtrl.deleteMarksRecord);

// Attendance
router.get('/attendance', attendanceCtrl.getAttendance);
router.get('/attendance/class/:classId', attendanceCtrl.getAttendanceByClass);
router.get('/attendance/student/:studentId', attendanceCtrl.getAttendanceByStudent);
router.get('/attendance/percentage/:studentId', attendanceCtrl.getAttendancePercentage);
router.post('/attendance', authMiddleware, roleMiddleware(['teacher', 'admin']), attendanceCtrl.markAttendance);
router.post('/attendance/bulk', authMiddleware, roleMiddleware(['teacher', 'admin']), attendanceCtrl.bulkMarkAttendance);
router.put('/attendance/:id', authMiddleware, roleMiddleware(['teacher', 'admin']), attendanceCtrl.updateAttendanceRecord);
router.delete('/attendance/:id', authMiddleware, roleMiddleware(['teacher', 'admin']), attendanceCtrl.deleteAttendanceRecord);
router.get('/attendance/report', authMiddleware, roleMiddleware('admin'), attendanceCtrl.getAttendanceReport);

// Teacher attendance (for teacher punch/status tracking)
router.get('/teacher-attendance', authMiddleware, roleMiddleware(['admin', 'teacher']), teacherAttendanceCtrl.list);
router.post('/teacher-attendance', authMiddleware, roleMiddleware(['admin', 'teacher']), teacherAttendanceCtrl.bulkSave);

// Notices — readable by all authenticated roles; writable by admin & teacher
router.get('/notices', authMiddleware, roleMiddleware(['admin', 'teacher', 'student']), noticeCtrl.getNotices);
router.get('/notices/recent', authMiddleware, roleMiddleware(['admin', 'teacher', 'student']), noticeCtrl.getRecentNotices);
router.get('/notices/:id', authMiddleware, roleMiddleware(['admin', 'teacher', 'student']), noticeCtrl.getNoticeById);
router.post('/notices', authMiddleware, roleMiddleware(['admin', 'teacher']), noticeCtrl.createNotice);
router.put('/notices/:id', authMiddleware, roleMiddleware(['admin', 'teacher']), noticeCtrl.updateNotice);
router.delete('/notices/:id', authMiddleware, roleMiddleware(['admin', 'teacher']), noticeCtrl.deleteNotice);
// Attachment-specific endpoints (uses multer, separate from JSON CRUD)
router.post('/notices/:id/attachments', authMiddleware, roleMiddleware(['admin', 'teacher']), noticeCtrl.uploadNoticeFiles, noticeCtrl.uploadAttachments);
router.delete('/notices/:id/attachments', authMiddleware, roleMiddleware(['admin', 'teacher']), noticeCtrl.removeAttachment);

// Dashboard / Analytics
router.get('/dashboard/summary', analyticsCtrl.getDashboardSummary);
router.get('/dashboard/performance', analyticsCtrl.getPerformanceByClass);
router.get('/analytics', analyticsCtrl.getAnalytics);
router.get('/analytics/analytics', analyticsCtrl.getAnalytics);
router.get('/analytics/attendance/class', analyticsCtrl.getClassAttendanceAnalytics);

// Activities
router.get('/activities', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const activities = await getRecentActivities(limit);
    return sendSuccess(res, activities);
  } catch (err) {
    console.error('[public.getActivities]', err);
    return sendError(res, 'Failed to fetch activities');
  }
});

router.put('/activities/:id/read', async (req, res) => {
  try {
    const activity = await markActivityAsRead(req.params.id);
    if (!activity) return sendError(res, 'Activity not found', 404);
    return sendSuccess(res, activity);
  } catch (err) {
    console.error('[public.markActivityAsRead]', err);
    return sendError(res, 'Failed to mark activity as read');
  }
});

// Import/Export
router.post('/import/students', authMiddleware, roleMiddleware('admin'), multer({ dest: 'uploads/temp/' }).single('file'), importCtrl.importStudents);
router.post('/import/teachers', authMiddleware, roleMiddleware('admin'), multer({ dest: 'uploads/temp/' }).single('file'), importCtrl.importTeachers);
router.get('/export/students', authMiddleware, roleMiddleware('admin'), importCtrl.exportStudents);
router.get('/export/teachers', authMiddleware, roleMiddleware('admin'), importCtrl.exportTeachers);

// Exams
router.get('/exams', examCtrl.getExams);
router.get('/exams/:id', examCtrl.getExamById);
router.get('/exams/class/:classId', examCtrl.getExamsByClass);
router.post('/exams', authMiddleware, roleMiddleware('admin'), examCtrl.createExam);
router.put('/exams/:id', authMiddleware, roleMiddleware('admin'), examCtrl.updateExam);
router.delete('/exams/:id', authMiddleware, roleMiddleware('admin'), examCtrl.deleteExam);

// Study Materials
router.get('/materials', materialCtrl.getMaterials);
router.get('/materials/class/:classId', materialCtrl.getMaterialsByClass);
router.get('/materials/student/:studentId', materialCtrl.getMaterialsByStudent);
router.get('/materials/teacher', authMiddleware, roleMiddleware(['teacher', 'admin']), materialCtrl.getMaterialsByTeacher);
router.post('/materials', authMiddleware, roleMiddleware(['teacher', 'admin']), materialCtrl.uploadMaterial, materialCtrl.createMaterial);
router.put('/materials/:id', authMiddleware, roleMiddleware(['teacher', 'admin']), materialCtrl.updateMaterial);
router.delete('/materials/:id', authMiddleware, roleMiddleware(['teacher', 'admin']), materialCtrl.deleteMaterial);
router.get('/materials/download/:id', materialCtrl.downloadMaterial);

// Notifications
router.get('/notifications', notificationCtrl.getNotifications);
router.get('/notifications/user/:id', notificationCtrl.getNotificationsByUser);
router.post('/notifications', authMiddleware, roleMiddleware('admin'), notificationCtrl.createNotification);
router.put('/notifications/:id', authMiddleware, roleMiddleware('admin'), notificationCtrl.updateNotification);
router.delete('/notifications/:id', authMiddleware, roleMiddleware('admin'), notificationCtrl.deleteNotification);
router.put('/notifications/read/:id', notificationCtrl.markAsRead);

// Generic Download
router.get('/public/download', downloadFile);

export default router;
