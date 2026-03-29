import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { Timetable } from '../../models/Timetable';
import { sendSuccess, sendError } from '../../utils/response';

export const getTimetable = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    const slots = await Timetable.find({ teacherId });
    return sendSuccess(res, slots);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch timetable');
  }
};
