import { Request, Response } from 'express';
import { Timetable } from '../../models/Timetable';
import { Notice } from '../../models/Notice';
import { Attendance } from '../../models/Attendance';
import { Quiz } from '../../models/Quiz';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthRequest } from '../../middlewares/authMiddleware';
import mongoose from 'mongoose';

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const teacherId = new mongoose.Types.ObjectId(authReq.user!.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysTimetable = await Timetable.find({
      teacherId,
      date: { $gte: today, $lt: tomorrow },
    });

    const importantNotices = await Notice.find({ important: true }).limit(5);

    const classesToday = todaysTimetable.length;

    // weekly attendance % for all classes teacher takes
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const attendanceRecords = await Attendance.find({
      teacherId,
      date: { $gte: weekAgo },
    });
    let total = 0,
      present = 0;
    attendanceRecords.forEach((rec) => {
      rec.students.forEach((s) => {
        total++;
        if (s.status === 'present') present++;
      });
    });
    const weeklyPct = total ? (present / total) * 100 : 0;

    const pendingQuizzes = await Quiz.find({ teacherId, dueDate: { $gte: today } });

    return sendSuccess(res, {
      todaysTimetable,
      importantNotices,
      classesToday,
      weeklyAttendancePercent: weeklyPct,
      pendingQuizzes,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to load dashboard');
  }
};
