import { Request, Response } from 'express';
import { Attendance } from '../../models/Attendance';
import { Quiz } from '../../models/Quiz';
import { PunchLog } from '../../models/PunchLog';
import { sendSuccess, sendError } from '../../utils/response';

export const getAnalytics = async (_req: Request, res: Response) => {
  try {
    const totalStudents = await Attendance.distinct('students.studentId').then((a) => a.length);
    const totalTeachers = await PunchLog.distinct('teacherId').then((a) => a.length);
    const totalQuizzes = await Quiz.countDocuments();
    return sendSuccess(res, { totalStudents, totalTeachers, totalQuizzes });
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch analytics');
  }
};
