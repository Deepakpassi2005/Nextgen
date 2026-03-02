import { Request, Response } from 'express';
import { PunchLog } from '../../models/PunchLog';
import { sendSuccess, sendError } from '../../utils/response';

export const list = async (_req: Request, res: Response) => {
  try {
    const logs = await PunchLog.find().populate('teacherId');
    return sendSuccess(res, logs);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch punch logs');
  }
};
