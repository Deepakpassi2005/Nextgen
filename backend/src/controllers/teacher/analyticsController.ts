import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { Attendance } from '../../models/Attendance';
import { PunchLog } from '../../models/PunchLog';
import { Quiz } from '../../models/Quiz';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = new mongoose.Types.ObjectId(req.user?.id || '');
    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setMonth(now.getMonth() - 1);

    const classesCountThisWeek = await Attendance.distinct('classId', {
      teacherId,
      date: { $gte: weekAgo },
    }).then((ids) => ids.length);

    const punches = await PunchLog.find({
      teacherId,
      timestamp: { $gte: monthAgo },
      withinRadius: true,
    });

    // Unique days punched
    const uniqueDays = new Set(
      punches.map((p) => new Date(p.timestamp).toLocaleDateString())
    ).size;

    // Calculate percent based on a 30-day working month
    const workDaysInMonth = 30; // Assuming 30 days trailing
    const monthlyPct = Math.min(100, Math.round((uniqueDays / workDaysInMonth) * 100));

    const totalQuizzes = await Quiz.countDocuments({ teacherId });

    return sendSuccess(res, { classesCountThisWeek, monthlyAttendancePercent: monthlyPct, totalQuizzes });
  } catch (err) {
    console.error(err);
    return sendError(res, 'Analytics failure');
  }
};
