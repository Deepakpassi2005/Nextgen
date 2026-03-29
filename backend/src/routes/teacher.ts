import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { quizValidators, assignmentValidators, attendanceValidators, runValidation } from '../middlewares/validation';
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
import * as materialCtrl from '../controllers/materialController';
// @ts-ignore
import * as analyticsCtrl from '../controllers/teacher/analyticsController';
// @ts-ignore
import * as resultCtrl from '../controllers/teacher/resultController';
// @ts-ignore
import * as assignmentCtrl from '../controllers/teacher/assignmentController';
// @ts-ignore
import * as noticeCtrl from '../controllers/noticeController';

import { profileUpload, assignmentUpload } from '../middlewares/uploadMiddleware';
import * as teacherCtrlMain from '../controllers/teacherController';

const router = Router();

router.use(authMiddleware, roleMiddleware(['teacher', 'admin']));

router.post('/upload-photo', profileUpload.single('photo'), teacherCtrlMain.uploadTeacherPhoto);
router.get('/profile', teacherCtrlMain.getMyProfile);
router.put('/profile', teacherCtrlMain.updateMyProfile);

router.get('/dashboard', teacherCtrl.getDashboard);
router.get('/timetable', timetableCtrl.getTimetable);

// quiz management
router.post('/quizzes', quizValidators, runValidation, quizCtrl.createQuiz);
router.get('/quizzes', quizCtrl.getAllTeacherQuizzes);
router.get('/quizzes/:quizId/submissions', quizCtrl.getQuizSubmissions);
router.get('/quizzes/:classId', quizCtrl.getQuizzesByClass);
router.put('/quizzes/:quizId', quizValidators, runValidation, quizCtrl.updateQuiz);
router.delete('/quizzes/:quizId', quizCtrl.deleteQuiz);

// attendance
router.post('/attendance/mark', attendanceValidators, runValidation, attendanceCtrl.markAttendance);
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
router.get('/material/teacher', materialCtrl.getMaterialsByTeacher);
router.post('/material/upload', materialCtrl.uploadMaterial, materialCtrl.createMaterial);
router.get('/material/:classId', materialCtrl.getMaterialsByClass);

// analytics & results
router.get('/analytics', analyticsCtrl.getAnalytics);
router.get('/results', resultCtrl.getResultsByTeacher);
router.post('/result', resultCtrl.createResult);
router.put('/result/publish/:id', resultCtrl.publishResult);
router.put('/result/:id', resultCtrl.updateResult);
router.delete('/result/:id', resultCtrl.deleteResult);

// assignments
router.post('/assignments', assignmentUpload.array('files', 5), assignmentCtrl.createAssignment);

router.get('/assignments/class/:classId', assignmentCtrl.getAssignmentsByClass);
router.put('/assignments/:id', assignmentUpload.array('files', 5), assignmentValidators, runValidation, assignmentCtrl.updateAssignment);
router.delete('/assignments/:id', assignmentCtrl.deleteAssignment);
router.get('/assignments/:assignmentId/submissions', assignmentCtrl.getSubmissions);
router.put('/assignments/submissions/:id/grade', assignmentCtrl.gradeSubmission);

// notices (teachers can create and manage their own notices)
router.get('/notices', noticeCtrl.getNotices);
router.get('/notices/recent', noticeCtrl.getRecentNotices);
router.get('/notices/:id', noticeCtrl.getNoticeById);
router.post('/notices', noticeCtrl.createNotice);
router.put('/notices/:id', noticeCtrl.updateNotice);
router.delete('/notices/:id', noticeCtrl.deleteNotice);
router.post('/notices/:id/attachments', noticeCtrl.uploadNoticeFiles, noticeCtrl.uploadAttachments);
router.delete('/notices/:id/attachments', noticeCtrl.removeAttachment);

export default router;