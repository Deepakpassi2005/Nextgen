import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { Timetable } from '../../models/Timetable';
import { Notice } from '../../models/Notice';
import { Attendance } from '../../models/Attendance';
import { Quiz } from '../../models/Quiz';
import { Result } from '../../models/Result';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user?.id || '');

    // today timetable for student's class
    const student = await Attendance.findOne({ 'students.studentId': studentId });
    // fallback: we may have stored classId in user profile

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysTimetable = await Timetable.find({
      classId: student?.classId,
      date: { $gte: today, $lt: tomorrow },
    });

    const notices = await Notice.find({ classId: student?.classId });

    const attendanceRecords = await Attendance.find({
      'students.studentId': studentId,
    });
    let total = 0, present = 0;
    attendanceRecords.forEach((rec) => {
      rec.students.forEach((s) => {
        total++;
        if (s.studentId.toString() === studentId.toString() && s.status === 'present') present++;
      });
    });
    const attendancePct = total ? (present / total) * 100 : 0;

    const pendingQuizzes = await Quiz.find({
      classId: student?.classId,
      dueDate: { $gte: today },
    });

    const latestResult = await Result.findOne({ studentId }).sort({ createdAt: -1 });

    return sendSuccess(res, {
      todaysTimetable,
      notices,
      attendancePercent: attendancePct,
      pendingQuizzes,
      latestResult,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to load dashboard');
  }
};
