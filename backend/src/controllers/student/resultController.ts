import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { Result } from '../../models/Result';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

export const getMyResults = async (req: Request, res: Response) => {
  try {
    const studentId = new mongoose.Types.ObjectId((req as AuthRequest).user?.id || '');
    const results = await Result.find({ studentId });
    return sendSuccess(res, results);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch results');
  }
};
