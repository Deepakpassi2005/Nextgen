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

const router = Router();
router.use(authMiddleware, roleMiddleware('student'));

router.get('/dashboard', dashboardCtrl.getDashboard);
router.get('/quizzes', quizCtrl.listQuizzes);
router.post('/quiz/submit', quizCtrl.submitQuiz);
router.get('/quiz/result/:quizId', quizCtrl.getQuizResult);

router.get('/attendance', attendanceCtrl.getMyAttendance);
router.get('/results', resultCtrl.getMyResults);
router.get('/timetable', timetableCtrl.getMyTimetable);

export default router;