import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { Timetable } from '../../models/Timetable';
import { sendSuccess, sendError } from '../../utils/response';

export const getMyTimetable = async (req: AuthRequest, res: Response) => {
  try {
    const classId = req.user?.classId;
    const slots = await Timetable.find({ classId });
    return sendSuccess(res, slots);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch timetable');
  }
};
