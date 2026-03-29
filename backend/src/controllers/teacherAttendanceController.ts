import { Request, Response } from 'express';
import { TeacherAttendance } from '../models/TeacherAttendance';
import { sendSuccess, sendError } from '../utils/response';

export const list = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const query: any = {};

    if (date) {
      const start = new Date(String(date));
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }

    const records = await TeacherAttendance.find(query).populate('teacherId');
    return sendSuccess(res, records);
  } catch (err) {
    console.error('[teacherAttendance.list]', err);
    return sendError(res, 'Failed to fetch teacher attendance');
  }
};

export const bulkSave = async (req: Request, res: Response) => {
  try {
    const { date, records } = req.body;
    if (!date || !Array.isArray(records)) {
      return sendError(res, 'Missing required fields: date and records', 400);
    }

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    // Upsert each record (one per teacher per day)
    const ops = records.map((rec: any) => {
      if (!rec.teacherId || !rec.status) return null;
      return {
        updateOne: {
          filter: { teacherId: rec.teacherId, date: { $gte: start, $lt: end } },
          update: {
            $set: {
              status: rec.status,
              remarks: rec.remarks || '',
              date: start,
            },
          },
          upsert: true,
        },
      };
    }).filter(Boolean);

    if (ops.length === 0) {
      return sendError(res, 'No valid records to save', 400);
    }

    await TeacherAttendance.bulkWrite(ops as any);

    const saved = await TeacherAttendance.find({ date: { $gte: start, $lt: end } }).populate('teacherId');
    return sendSuccess(res, saved);
  } catch (err) {
    console.error('[teacherAttendance.bulkSave]', err);
    return sendError(res, 'Failed to save teacher attendance');
  }
};
