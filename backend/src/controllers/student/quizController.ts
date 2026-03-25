import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { Quiz } from '../../models/Quiz';
import { Subject } from '../../models/Subject';
import { Class } from '../../models/Class';
import { Student } from '../../models/Student';
import { QuizSubmission } from '../../models/QuizSubmission';
import { Result } from '../../models/Result';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

export const listQuizzes = async (req: AuthRequest, res: Response) => {
  try {
    // Get classId from JWT first. If missing (old token), look it up from DB.
    let classId: mongoose.Types.ObjectId | undefined;

    if (req.user?.classId) {
      classId = new mongoose.Types.ObjectId(req.user.classId);
      console.log(`[student.listQuizzes] ClassId from JWT: ${classId}`);
    } else {
      // Fallback: look up the student record using their user ID
      const studentId = req.user?.id;
      if (!studentId) {
        return sendError(res, 'Unauthorized', 401);
      }
      const student = await Student.findById(studentId).select('classId').lean();
      if (!student?.classId) {
        console.warn(`[student.listQuizzes] Student ${studentId} has no classId in DB`);
        return sendSuccess(res, []);
      }
      classId = new mongoose.Types.ObjectId(String(student.classId));
      console.log(`[student.listQuizzes] ClassId from DB lookup: ${classId}`);
    }

    const quizzes = await Quiz.find({ classId }).populate('classId subjectId');
    console.log(`[student.listQuizzes] Found ${quizzes.length} quizzes for class ${classId}`);

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

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return sendError(res, 'Quiz not found', 404);

    // Calculate score
    let score = 0;
    const gradedAnswers = answers.map((ans: any, index: number) => {
      const question = quiz.questions[index];
      const isCorrect = question && question.answer === ans.answer;
      if (isCorrect) score += (question.marks || 1);
      return { ...ans, isCorrect };
    });

    const submission = new QuizSubmission({ 
      quizId, 
      studentId, 
      answers: gradedAnswers,
      score,
      totalMarks: quiz.totalMarks
    });
    await submission.save();

    // Create Result record automatically
    const result = new Result({
      studentId,
      classId: quiz.classId,
      teacherId: quiz.teacherId,
      examType: 'quiz',
      marks: [{
        subjectId: quiz.subjectId,
        score,
        maxMarks: quiz.totalMarks
      }],
      grade: score >= (quiz.passingMarks || 0) ? 'Pass' : 'Fail',
      published: true // Mark as published immediately for real-time visibility
    });
    await result.save();

    return sendSuccess(res, { submission, result }, 201);
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
