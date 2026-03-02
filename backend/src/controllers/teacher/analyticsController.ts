import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { Attendance } from '../../models/Attendance';
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

    const attendanceRecords = await Attendance.find({ teacherId, date: { $gte: monthAgo } });
    let total = 0,
      present = 0;
    attendanceRecords.forEach((rec) => {
      rec.students.forEach((s) => {
        total++;
        if (s.status === 'present') present++;
      });
    });
    const monthlyPct = total ? (present / total) * 100 : 0;

    const totalQuizzes = await Quiz.countDocuments({ teacherId });

    return sendSuccess(res, { classesCountThisWeek, monthlyAttendancePercent: monthlyPct, totalQuizzes });
  } catch (err) {
    console.error(err);
    return sendError(res, 'Analytics failure');
  }
};
