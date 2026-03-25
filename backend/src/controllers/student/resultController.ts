import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { Result } from '../../models/Result';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

export const getMyResults = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user?.id || '');
    const results = await Result.find({ studentId, published: true })
      .populate('classId', 'name')
      .populate('teacherId', 'name')
      .populate('marks.subjectId', 'name')
      .sort({ createdAt: -1 });
    return sendSuccess(res, results);
  } catch (err) {
    console.error('[Student.getMyResults]', err);
    return sendError(res, 'Failed to fetch results');
  }
};
