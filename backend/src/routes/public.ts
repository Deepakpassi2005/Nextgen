import { Router } from 'express';
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
import { getRecentActivities, markActivityAsRead } from '../services/activityService';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

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
router.post('/students', studentCtrl.createStudent);
router.put('/students/:id', studentCtrl.updateStudent);
router.delete('/students/:id', studentCtrl.deleteStudent);

// Teachers
router.get('/teachers', teacherCtrl.getTeachers);
router.get('/teachers/:id', teacherCtrl.getTeacherById);
router.post('/teachers', teacherCtrl.createTeacher);
router.put('/teachers/:id', teacherCtrl.updateTeacher);
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
router.post('/marks', marksCtrl.createMarksRecord);
router.put('/marks/:id', marksCtrl.updateMarksRecord);
router.delete('/marks/:id', marksCtrl.deleteMarksRecord);

// Attendance
router.get('/attendance', attendanceCtrl.getAttendance);
router.get('/attendance/student/:studentId', attendanceCtrl.getAttendanceByStudent);
router.get('/attendance/percentage/:studentId', attendanceCtrl.getAttendancePercentage);
router.post('/attendance', attendanceCtrl.createAttendanceRecord);
router.put('/attendance/:id', attendanceCtrl.updateAttendanceRecord);
router.delete('/attendance/:id', attendanceCtrl.deleteAttendanceRecord);

// Notices
router.get('/notices', noticeCtrl.getNotices);
router.get('/notices/recent', noticeCtrl.getRecentNotices);
router.get('/notices/:id', noticeCtrl.getNoticeById);
router.post('/notices', noticeCtrl.createNotice);
router.put('/notices/:id', noticeCtrl.updateNotice);
router.delete('/notices/:id', noticeCtrl.deleteNotice);

// Dashboard / Analytics
router.get('/dashboard/summary', analyticsCtrl.getDashboardSummary);
router.get('/dashboard/performance', analyticsCtrl.getPerformanceByClass);
router.get('/analytics', analyticsCtrl.getAnalytics);

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

export default router;
