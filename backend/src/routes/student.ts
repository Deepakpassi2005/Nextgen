import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
// @ts-ignore
import * as dashboardCtrl from '../controllers/student/dashboardController';
// @ts-ignore
import * as quizCtrl from '../controllers/student/quizController';
// @ts-ignore
import * as attendanceCtrl from '../controllers/student/attendanceController';
// @ts-ignore
import * as resultCtrl from '../controllers/student/resultController';
// @ts-ignore
import * as timetableCtrl from '../controllers/student/timetableController';
// @ts-ignore
import * as assignmentCtrl from '../controllers/student/assignmentController';
// @ts-ignore
import * as noticeCtrl from '../controllers/noticeController';
// @ts-ignore
import * as materialCtrl from '../controllers/materialController';

import { profileUpload, assignmentUpload } from '../middlewares/uploadMiddleware';
import * as studentCtrl from '../controllers/studentController';

const router = Router();
router.use(authMiddleware, roleMiddleware(['student', 'admin']));

router.post('/upload-photo', profileUpload.single('photo'), studentCtrl.uploadStudentPhoto);
router.get('/profile', studentCtrl.getMyProfile);
router.put('/profile', studentCtrl.updateMyProfile);

router.get('/dashboard', dashboardCtrl.getDashboard);
router.get('/quizzes', quizCtrl.listQuizzes);
router.post('/quiz/submit', quizCtrl.submitQuiz);
router.get('/quiz/result/:quizId', quizCtrl.getQuizResult);

router.get('/attendance', attendanceCtrl.getMyAttendance);
router.get('/results', resultCtrl.getMyResults);
router.get('/timetable', timetableCtrl.getMyTimetable);

// assignments
router.get('/assignments', assignmentCtrl.getAssignments);
router.post('/assignments/submit', assignmentUpload.array('files', 10), assignmentCtrl.submitAssignment);
router.get('/assignments/submissions', assignmentCtrl.getMySubmissions);

// notices
router.get('/notices', noticeCtrl.getNotices);
router.get('/notices/recent', noticeCtrl.getRecentNotices);

// study materials
router.get('/materials', materialCtrl.getMaterialsByStudent);

export default router;