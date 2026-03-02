import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
// @ts-ignore
import * as teacherCtrl from '../controllers/teacher/dashboardController';
// @ts-ignore
import * as timetableCtrl from '../controllers/teacher/timetableController';
// @ts-ignore
import * as quizCtrl from '../controllers/teacher/quizController';
// @ts-ignore
import * as attendanceCtrl from '../controllers/teacher/attendanceController';
// @ts-ignore
import * as punchCtrl from '../controllers/teacher/punchController';
// @ts-ignore
import * as chatCtrl from '../controllers/chat/chatController';
// @ts-ignore
import * as materialCtrl from '../controllers/teacher/materialController';
// @ts-ignore
import * as analyticsCtrl from '../controllers/teacher/analyticsController';
// @ts-ignore
import * as resultCtrl from '../controllers/teacher/resultController';

const router = Router();

router.use(authMiddleware, roleMiddleware('teacher'));

router.get('/dashboard', teacherCtrl.getDashboard);
router.get('/timetable', timetableCtrl.getTimetable);

// quiz management
router.post('/quiz', quizCtrl.createQuiz);
router.get('/quiz/:classId', quizCtrl.getQuizzesByClass);
router.put('/quiz/:quizId', quizCtrl.updateQuiz);
router.delete('/quiz/:quizId', quizCtrl.deleteQuiz);

// attendance
router.post('/attendance/mark', attendanceCtrl.markAttendance);
router.get('/attendance/:classId', attendanceCtrl.getAttendanceByClass);

// punch
router.post('/punch-in', punchCtrl.punchIn);
router.get('/punch-history', punchCtrl.getPunchHistory);

// chat endpoints - for teachers hitting class or personal
router.get('/chat/class/:classId', chatCtrl.getClassChat);
router.post('/chat/class/send', chatCtrl.sendClassMessage);
router.get('/chat/personal/:userId', chatCtrl.getPersonalChat);
router.post('/chat/personal/send', chatCtrl.sendPersonalMessage);

// study material
router.post('/material/upload', materialCtrl.uploadMaterial);
router.get('/material/:classId', materialCtrl.getMaterialsByClass);

// analytics & results
router.get('/analytics', analyticsCtrl.getAnalytics);
router.post('/result', resultCtrl.createResult);
router.put('/result/publish/:id', resultCtrl.publishResult);

export default router;