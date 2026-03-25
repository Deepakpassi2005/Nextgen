import { Request, Response } from 'express';
import { Quiz } from '../../models/Quiz';
import { Subject } from '../../models/Subject';
import { Class } from '../../models/Class';
import { Teacher } from '../../models/Teacher';
import { sendSuccess, sendError } from '../../utils/response';

export const getAllQuizzes = async (req: Request, res: Response) => {
  try {
    const quizzes = await Quiz.find()
      .populate('classId subjectId teacherId')
      .sort({ createdAt: -1 });

    return sendSuccess(res, quizzes);
  } catch (err) {
    console.error('[admin.getAllQuizzes]', err);
    return sendError(res, 'Failed to fetch quizzes');
  }
};

export const deleteQuiz = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Quiz.findByIdAndDelete(id);
    if (!deleted) return sendError(res, 'Quiz not found', 404);
    return sendSuccess(res, deleted, 200);
  } catch (err) {
    console.error('[admin.deleteQuiz]', err);
    return sendError(res, 'Failed to delete quiz');
  }
};
export const updateQuiz = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, duration, dueDate, questions } = req.body;
    
    // Only update fields that are provided
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (duration !== undefined) updateData.duration = duration;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (questions !== undefined) updateData.questions = questions;

    const updated = await Quiz.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return sendError(res, 'Quiz not found', 404);
    
    return sendSuccess(res, updated);
  } catch (err) {
    console.error('[admin.updateQuiz]', err);
    return sendError(res, 'Failed to update quiz');
  }
};
