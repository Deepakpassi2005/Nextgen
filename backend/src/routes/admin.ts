import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import * as adminCtrl from '../controllers/admin/analyticsController';
import * as punchCtrl from '../controllers/admin/punchLogController';
import * as quizCtrl from '../controllers/admin/quizController';
import * as resultCtrl from '../controllers/admin/resultController';
import * as assignmentCtrl from '../controllers/admin/assignmentController';
import { getRecentActivities, markActivityAsRead } from '../services/activityService';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();
router.use(authMiddleware, roleMiddleware('admin'));

router.get('/teacher-punch-logs', punchCtrl.list);
router.get('/analytics', adminCtrl.getAnalytics);

// Assignment endpoints
router.get('/assignments', assignmentCtrl.getAssignments);
router.get('/assignments/export', assignmentCtrl.exportAssignmentsToExcel);

// Attendance endpoints
import { exportAttendance } from '../controllers/admin/attendanceExportController';
router.get('/attendance/export', exportAttendance);

// Quiz endpoints
router.get('/quizzes', quizCtrl.getAllQuizzes);
router.put('/quizzes/:id', quizCtrl.updateQuiz);
// Result endpoints
router.get('/results/class/:classId', resultCtrl.getResultsByClass);
router.put('/results/:id', resultCtrl.updateResult);
router.delete('/results/:id', resultCtrl.deleteResult);

// Activity endpoints
router.get('/activities', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const activities = await getRecentActivities(limit);
    return sendSuccess(res, activities);
  } catch (err) {
    console.error('[admin.getActivities]', err);
    return sendError(res, 'Failed to fetch activities');
  }
});

router.put('/activities/:id/read', async (req, res) => {
  try {
    const activity = await markActivityAsRead(req.params.id);
    if (!activity) return sendError(res, 'Activity not found', 404);
    return sendSuccess(res, activity);
  } catch (err) {
    console.error('[admin.markActivityAsRead]', err);
    return sendError(res, 'Failed to mark activity as read');
  }
});

export default router;