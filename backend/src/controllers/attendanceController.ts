import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Attendance } from '../models/Attendance';
import { Student } from '../models/Student';
import { sendSuccess, sendError } from '../utils/response';
import { requireFields } from '../utils/validators';

const attendanceRequired = ['classId', 'date', 'students'];
const bulkAttendanceRequired = ['classId', 'date', 'attendanceData'];

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

export const getAttendanceByClass = async (req: Request, res: Response) => {
  try {
    const attendance = await Attendance.find({ classId: req.params.classId }).populate('teacherId students.studentId');
    return sendSuccess(res, attendance);
  } catch (err) {
    console.error('[attendance.getAttendanceByClass]', err);
    return sendError(res, 'Failed to fetch class attendance');
  }
};

export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const err = requireFields(req.body, attendanceRequired);
    if (err) return sendError(res, err, 400);

    const { classId, date, students, teacherId: bodyTeacherId } = req.body;
    const teacherId = bodyTeacherId || req.user?.id;
    if (!teacherId) {
      return sendError(res, 'Teacher ID is required', 400);
    }

    const existing = await Attendance.findOne({ classId, date });
    if (existing) {
      return sendError(res, 'Attendance already exists for this class/date', 409);
    }
    const record = new Attendance({ classId, date, students, teacherId });
    const saved = await record.save();
    return sendSuccess(res, saved, 201);
  } catch (err: any) {
    console.error('[attendance.markAttendance]', err);
    const msg = err.message || 'Failed to mark attendance';
    return sendError(res, msg, 400);
  }
};

export const bulkMarkAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const err = requireFields(req.body, bulkAttendanceRequired);
    if (err) return sendError(res, err, 400);

const { classId, date, attendanceData, teacherId: bodyTeacherId } = req.body;
  const teacherId = bodyTeacherId || req.user?.id;
  if (!teacherId) {
    return sendError(res, 'Teacher ID is required', 400);
  }

    // Get all students in the class
    const students = await Student.find({ classId });

    // Create attendance records
    const attendanceRecords = students.map(student => ({
      studentId: student._id,
      status: attendanceData[student._id.toString()] || 'absent',
      remarks: '',
    }));

    const existing = await Attendance.findOne({ classId, date });
    if (existing) {
      return sendError(res, 'Attendance already exists for this class/date', 409);
    }

    const record = new Attendance({
      classId,
      date,
      students: attendanceRecords,
      teacherId
    });

    const saved = await record.save();
    const populated = await saved.populate('classId teacherId students.studentId');
    return sendSuccess(res, populated, 201);
  } catch (err: any) {
    console.error('[attendance.bulkMarkAttendance]', err);
    const msg = err.message || 'Failed to bulk mark attendance';
    return sendError(res, msg, 400);
  }
};

export const updateAttendanceRecord = async (req: Request, res: Response) => {
  try {
    const updated = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate('classId teacherId students.studentId');
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
        if (s.studentId.toString() === studentId) {
          total++;
          if (s.status === 'present') present++;
        }
      });
    });
    const percentage = total > 0 ? (present / total) * 100 : 0;
    return sendSuccess(res, { percentage: Math.round(percentage * 10) / 10 });
  } catch (err) {
    console.error('[attendance.getAttendancePercentage]', err);
    return sendError(res, 'Failed to calculate attendance percentage');
  }
};

export const getAttendanceReport = async (req: Request, res: Response) => {
  try {
    const { classId, startDate, endDate } = req.query;
    const query: any = {};
    if (classId) query.classId = classId;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }

    const records = await Attendance.find(query).populate('classId teacherId students.studentId');
    return sendSuccess(res, records);
  } catch (err) {
    console.error('[attendance.getAttendanceReport]', err);
    return sendError(res, 'Failed to fetch attendance report');
  }
};



// trigger restart
