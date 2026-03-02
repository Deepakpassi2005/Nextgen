import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { Attendance } from '../../models/Attendance';
import { sendSuccess, sendError } from '../../utils/response';

export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, date, students } = req.body;
    if (!classId || !date || !Array.isArray(students)) {
      return sendError(res, 'classId, date and students array required', 400);
    }
    // prevent duplicate per class+date
    const existing = await Attendance.findOne({ classId, date });
    if (existing) {
      return sendError(res, 'Attendance already marked for this date', 409);
    }
    const teacherId = req.user?.id;
    const record = new Attendance({ classId, date, students, teacherId });
    await record.save();
    return sendSuccess(res, record, 201);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to mark attendance');
  }
};

export const getAttendanceByClass = async (req: AuthRequest, res: Response) => {
  try {
    const classId = req.params.classId;
    const list = await Attendance.find({ classId });
    return sendSuccess(res, list);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch attendance');
  }
};
