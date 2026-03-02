import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { Quiz } from '../../models/Quiz';
import { QuizSubmission } from '../../models/QuizSubmission';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

export const listQuizzes = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user?.id || '');
    // determine classId from attendance or profile
    // for simplicity assume req.user has classId
    const classId = req.user?.classId;
    const quizzes = await Quiz.find({ classId });
    return sendSuccess(res, quizzes);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to load quizzes');
  }
};

export const submitQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user?.id || '');
    const { quizId, answers } = req.body;
    const existing = await QuizSubmission.findOne({ quizId, studentId });
    if (existing) return sendError(res, 'Already submitted', 409);
    const submission = new QuizSubmission({ quizId, studentId, answers });
    await submission.save();
    return sendSuccess(res, submission, 201);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to submit quiz');
  }
};

export const getQuizResult = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user?.id || '');
    const quizId = req.params.quizId;
    const submission = await QuizSubmission.findOne({ quizId, studentId });
    if (!submission) return sendError(res, 'No submission found', 404);
    return sendSuccess(res, submission);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch result');
  }
};
