import { Request, Response } from 'express';
import { PunchLog } from '../../models/PunchLog';
import { sendSuccess, sendError } from '../../utils/response';

export const list = async (_req: Request, res: Response) => {
  try {
    console.log('[API HIT] /admin/teacher-punch-logs requested by admin');
    const logs = await PunchLog.find().populate('teacherId');
    console.log(`[API HIT] Returning ${logs.length} punch logs to admin`);
    return sendSuccess(res, logs);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch punch logs');
  }
};
