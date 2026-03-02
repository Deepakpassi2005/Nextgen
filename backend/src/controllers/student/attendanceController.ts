import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { Attendance } from '../../models/Attendance';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

export const getMyAttendance = async (req: Request, res: Response) => {
  try {
    const studentId = new mongoose.Types.ObjectId((req as AuthRequest).user?.id || '');
    const records = await Attendance.find({ 'students.studentId': studentId });
    return sendSuccess(res, records);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch attendance');
  }
};
