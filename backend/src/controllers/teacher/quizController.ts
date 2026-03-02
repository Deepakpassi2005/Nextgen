import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { Quiz } from '../../models/Quiz';
import { sendSuccess, sendError } from '../../utils/response';

export const createQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const { title, classId, questions, dueDate } = req.body;
    const teacherId = req.user?.id;
    const quiz = new Quiz({ title, classId, questions, dueDate, teacherId });
    await quiz.save();
    return sendSuccess(res, quiz, 201);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to create quiz');
  }
};

export const getQuizzesByClass = async (req: AuthRequest, res: Response) => {
  try {
    const classId = req.params.classId;
    const quizzes = await Quiz.find({ classId });
    return sendSuccess(res, quizzes);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch quizzes');
  }
};

export const updateQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const updated = await Quiz.findByIdAndUpdate(req.params.quizId, req.body, { new: true });
    if (!updated) return sendError(res, 'Quiz not found', 404);
    return sendSuccess(res, updated);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to update quiz');
  }
};

export const deleteQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await Quiz.findByIdAndDelete(req.params.quizId);
    if (!deleted) return sendError(res, 'Quiz not found', 404);
    return sendSuccess(res, { message: 'Quiz deleted' });
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to delete quiz');
  }
};
