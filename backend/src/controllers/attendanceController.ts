import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Attendance } from '../models/Attendance';
import { sendSuccess, sendError } from '../utils/response';
import { requireFields } from '../utils/validators';

const attendanceRequired = ['classId', 'date', 'students'];
// legacy inputs may still send studentId/present

export const getAttendance = async (req: Request, res: Response) => {
  try {
    const attendance = await Attendance.find().populate('classId teacherId students.studentId');
    return sendSuccess(res, attendance);
  } catch (err) {
    console.error('[attendance.getAttendance]', err);
    return sendError(res, 'Failed to fetch attendance');
  }
};

export const getAttendanceByStudent = async (req: Request, res: Response) => {
  try {
    const studentId = req.params.studentId;
    const attendance = await Attendance.find({ 'students.studentId': studentId }).populate('classId');
    return sendSuccess(res, attendance);
  } catch (err) {
    console.error('[attendance.getAttendanceByStudent]', err);
    return sendError(res, 'Failed to fetch student attendance');
  }
};

export const createAttendanceRecord = async (req: AuthRequest, res: Response) => {
  try {
    const err = requireFields(req.body, attendanceRequired);
    if (err) {
      // try legacy path
      const legacyErr = requireFields(req.body, ['studentId', 'classId', 'date']);
      if (legacyErr) return sendError(res, err, 400);
      // convert legacy to new format
      const { studentId, classId, date, present } = req.body;
      const teachersId = req.user?.id; // fallback if available (AuthRequest)
      const rec = new Attendance({
        classId,
        date: new Date(date),
        teacherId: teachersId,
        students: [{ studentId, status: present ? 'present' : 'absent' }],
      });
      const saved = await rec.save();
      return sendSuccess(res, saved, 201);
    }

    // normal grouped create
    const { classId, date, students } = req.body;
    const teacherId = req.user?.id;
    const existing = await Attendance.findOne({ classId, date });
    if (existing) {
      return sendError(res, 'Attendance already exists for this class/date', 409);
    }
    const record = new Attendance({ classId, date, students, teacherId });
    const saved = await record.save();
    return sendSuccess(res, saved, 201);
  } catch (err: any) {
    console.error('[attendance.createAttendanceRecord]', err);
    const msg = err.message || 'Failed to create attendance record';
    return sendError(res, msg, 400);
  }
};

export const updateAttendanceRecord = async (req: Request, res: Response) => {
  try {
    const updated = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate('studentId classId');
    if (!updated) return sendError(res, 'Attendance record not found', 404);
    return sendSuccess(res, updated);
  } catch (err: any) {
    console.error('[attendance.updateAttendanceRecord]', err);
    const msg = err.message || 'Failed to update attendance record';
    return sendError(res, msg, 400);
  }
};

export const deleteAttendanceRecord = async (req: Request, res: Response) => {
  try {
    const deleted = await Attendance.findByIdAndDelete(req.params.id);
    if (!deleted) return sendError(res, 'Attendance record not found', 404);
    return sendSuccess(res, { message: 'Attendance record deleted' });
  } catch (err) {
    console.error('[attendance.deleteAttendanceRecord]', err);
    return sendError(res, 'Failed to delete attendance record');
  }
};

export const getAttendancePercentage = async (req: Request, res: Response) => {
  try {
    const studentId = req.params.studentId;
    const records = await Attendance.find({ 'students.studentId': studentId });
    let total = 0, present = 0;
    records.forEach((r) => {
      r.students.forEach((s) => {
        total++;
        if (s.studentId.toString() === studentId && s.status === 'present') present++;
      });
    });
    const percentage = total > 0 ? (present / total) * 100 : 0;
    return sendSuccess(res, { total, present, percentage: Math.round(percentage) });
  } catch (err) {
    console.error('[attendance.getAttendancePercentage]', err);
    return sendError(res, 'Failed to calculate attendance percentage');
  }
};
